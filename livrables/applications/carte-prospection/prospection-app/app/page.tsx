'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { APIProvider } from '@vis.gl/react-google-maps'
import { supabase, type Store, type StoreWithPlacements } from '@/lib/supabase'
import {
  chainFromText,
  DEFAULT_COLOR_MODE,
  type ColorMode,
} from '@/lib/constants'
import { parseKml, generateKml } from '@/lib/kml'
import MapView, { hasBrandPresent, newDnCount, type LatLng } from '@/components/MapView'
import StorePanel from '@/components/StorePanel'
import AddStoreForm from '@/components/AddStoreForm'
import FilterBar, { EMPTY_FILTERS, type Filters } from '@/components/FilterBar'
import StatsPanel from '@/components/StatsPanel'
import PasteImport from '@/components/PasteImport'
import { MapPin, Plus, LocateFixed, Upload, Download, LogOut, Loader2, ClipboardPaste } from 'lucide-react'

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Élément d'import : lat/lng optionnels (null = à géocoder depuis l'adresse).
export type ImportItem = {
  chain: string
  name: string
  lat: number | null
  lng: number | null
  address: string | null
  postal: string | null
  notes?: string | null
}

export default function HomePage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [stores, setStores] = useState<StoreWithPlacements[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [colorMode, setColorMode] = useState<ColorMode>(DEFAULT_COLOR_MODE)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [tempPin, setTempPin] = useState<LatLng | null>(null)
  const [myLocation, setMyLocation] = useState<LatLng | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Auth guard ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/connexion')
      else setAuthChecked(true)
    })
  }, [router])

  // ── Chargement des magasins + placements ──
  const load = useCallback(async () => {
    const { data } = await supabase
      .from('stores')
      .select('*, placements(*)')
      .order('created_at', { ascending: true })
    setStores((data as StoreWithPlacements[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authChecked) load()
  }, [authChecked, load])

  // ── Filtrage ──
  const filtered = useMemo(() => {
    return stores.filter((s) => {
      if (filters.chain && s.chain !== filters.chain) return false
      if (filters.status && s.status !== filters.status) return false
      if (filters.query) {
        const q = filters.query.toLowerCase()
        const hay = `${s.name ?? ''} ${s.address ?? ''} ${s.city ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.brand) {
        const present = hasBrandPresent(s, filters.brand)
        if (filters.presence === 'present' && !present) return false
        if (filters.presence === 'absent' && present) return false
      }
      if (filters.onlyNewDn && newDnCount(s) === 0) return false
      return true
    })
  }, [stores, filters])

  const selected = useMemo(() => stores.find((s) => s.id === selectedId) ?? null, [stores, selectedId])

  // ── Ma position ──
  function locateMe() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Géolocalisation refusée ou indisponible.'),
      { enableHighAccuracy: true },
    )
  }

  // ── Import générique (coordonnées directes + géocodage des adresses) ──
  // Réutilisé par l'import KML et l'import par collage de liste.
  const importRows = useCallback(
    async (items: ImportItem[]) => {
      if (!items.length) {
        alert('Aucune ligne à importer.')
        return
      }
      setImporting(true)

      type Row = {
        chain: string
        name: string
        lat: number
        lng: number
        address: string | null
        postal_code: string | null
        status: string
        notes: string | null
      }
      const ready: Row[] = []
      const toGeocode = items.filter((p) => p.lat == null || p.lng == null)

      for (const p of items) {
        if (p.lat != null && p.lng != null) {
          ready.push({
            chain: p.chain,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            address: p.address,
            postal_code: p.postal,
            status: 'À prospecter',
            notes: p.notes ?? null,
          })
        }
      }

      let done = 0
      let failed = 0
      const CHUNK = 5
      for (let i = 0; i < toGeocode.length; i += CHUNK) {
        const chunk = toGeocode.slice(i, i + CHUNK)
        const results = await Promise.all(
          chunk.map(async (p) => {
            const query = [p.address, p.postal, 'France'].filter(Boolean).join(', ') || `${p.name}, France`
            try {
              const res = await fetch('/api/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: query }),
              })
              if (!res.ok) return null
              const d = await res.json()
              return { p, lat: d.lat as number, lng: d.lng as number }
            } catch {
              return null
            }
          }),
        )
        for (const r of results) {
          if (!r) {
            failed++
            continue
          }
          ready.push({
            chain: r.p.chain,
            name: r.p.name,
            lat: r.lat,
            lng: r.lng,
            address: r.p.address,
            postal_code: r.p.postal,
            status: 'À prospecter',
            notes: r.p.notes ?? null,
          })
        }
        done += chunk.length
        setImportMsg(`Géocodage des adresses… ${Math.min(done, toGeocode.length)}/${toGeocode.length}`)
      }

      setImportMsg(`Enregistrement de ${ready.length} magasins…`)
      let inserted = 0
      let insertError: string | null = null
      for (let i = 0; i < ready.length; i += 500) {
        const slice = ready.slice(i, i + 500)
        const { error } = await supabase.from('stores').insert(slice)
        if (error) {
          insertError = error.message
          break
        }
        inserted += slice.length
      }

      await load()
      setImporting(false)
      setImportMsg(null)
      if (insertError) {
        // Ne jamais annoncer un succès si l'écriture en base a échoué (ex. session expirée → RLS).
        alert(
          `L'enregistrement a échoué après ${inserted} magasin(s) sur ${ready.length}.\n` +
            `Erreur : ${insertError}\n\n` +
            `Si tu es resté longtemps sur la page, ta session a peut-être expiré : ` +
            `déconnecte-toi, reconnecte-toi, puis relance l'import.`,
        )
      } else {
        alert(
          `${inserted} magasin(s) importé(s).` +
            (failed ? `\n${failed} adresse(s) non localisée(s) (à ajouter manuellement).` : ''),
        )
      }
    },
    [load],
  )

  // ── Import KML ──
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMsg('Lecture du fichier…')
    const text = await file.text()
    const placemarks = parseKml(text)
    if (!placemarks.length) {
      setImportMsg(null)
      alert('Aucun magasin trouvé dans ce fichier KML.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    await importRows(
      placemarks.map((p) => ({
        chain: chainFromText(p.chain), // enseigne déduite du calque KML
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        postal: p.postal,
        notes: p.description,
      })),
    )
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Export KML ──
  function exportKml() {
    const blob = new Blob([generateKml(filtered)], { type: 'application/vnd.google-earth.kml+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'carte-prospection.kml'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/connexion')
  }

  function onStoreSaved(s: Store) {
    setAddOpen(false)
    setTempPin(null)
    load().then(() => setSelectedId(s.id))
  }

  if (!authChecked)
    return (
      <div className="min-h-screen bg-teal-deep flex items-center justify-center">
        <Loader2 className="animate-spin text-bronze" size={32} />
      </div>
    )

  if (!GMAPS_KEY)
    return (
      <div className="min-h-screen bg-teal-deep flex items-center justify-center px-6 text-center">
        <div className="text-cream/80 max-w-md">
          <MapPin className="mx-auto mb-3 text-bronze" />
          <p className="font-semibold mb-1">Clé Google Maps manquante</p>
          <p className="text-[13px] text-cream/60">
            Renseigne <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> dans <code>.env.local</code> puis relance.
          </p>
        </div>
      </div>
    )

  const btn =
    'flex items-center gap-1.5 text-[12px] font-semibold rounded-lg px-3 py-1.5 transition-colors'

  return (
    <APIProvider apiKey={GMAPS_KEY}>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        {/* Barre du haut */}
        <header className="bg-teal text-cream px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0 z-30">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg border border-bronze/50 flex items-center justify-center">
              <MapPin size={16} className="text-bronze" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[.14em] text-bronze font-semibold">Edrington</div>
              <div className="text-[11px] text-cream/60">Prospection</div>
            </div>
          </div>

          <button
            onClick={() => {
              setAddOpen((v) => !v)
              setTempPin(null)
            }}
            className={`${btn} ${addOpen ? 'bg-bronze text-white' : 'bg-bronze/90 text-white hover:bg-bronze'}`}
          >
            <Plus size={14} /> Ajouter
          </button>
          <button onClick={locateMe} className={`${btn} bg-cream/10 text-cream hover:bg-cream/20`}>
            <LocateFixed size={14} /> Ma position
          </button>
          <button
            onClick={() => setPasteOpen(true)}
            disabled={importing}
            className={`${btn} bg-cream/10 text-cream hover:bg-cream/20`}
          >
            <ClipboardPaste size={14} /> Coller une liste
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className={`${btn} bg-cream/10 text-cream hover:bg-cream/20`}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Importer KML
          </button>
          <button onClick={exportKml} className={`${btn} bg-cream/10 text-cream hover:bg-cream/20`}>
            <Download size={14} /> Exporter KML
          </button>
          <input ref={fileRef} type="file" accept=".kml,.xml" onChange={onFile} className="hidden" />

          <button onClick={logout} className={`${btn} text-cream/60 hover:text-cream ml-auto`}>
            <LogOut size={14} /> Quitter
          </button>
        </header>

        {/* Barre de filtres */}
        <div className="bg-cream border-b border-teal/10 px-4 py-2 shrink-0 z-20">
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            colorMode={colorMode}
            setColorMode={setColorMode}
            count={filtered.length}
          />
        </div>

        {/* Carte */}
        <div className="relative flex-1">
          {loading && (
            <div className="absolute inset-0 z-40 bg-teal-deep/40 flex items-center justify-center">
              <Loader2 className="animate-spin text-bronze" size={28} />
            </div>
          )}

          {importMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-teal text-cream text-[13px] font-semibold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Loader2 className="animate-spin" size={15} /> {importMsg}
            </div>
          )}

          <MapView
            stores={filtered}
            colorMode={colorMode}
            brandFocus={filters.brand || null}
            selectedId={selectedId}
            onSelectStore={(s) => setSelectedId(s.id)}
            addMode={addOpen}
            onMapClick={(p) => setTempPin(p)}
            tempPin={addOpen ? tempPin : null}
            myLocation={myLocation}
          />

          <StatsPanel stores={stores} colorMode={colorMode} brandFocus={filters.brand || null} />

          {addOpen && (
            <AddStoreForm
              tempPin={tempPin}
              onSetTempPin={setTempPin}
              onClose={() => {
                setAddOpen(false)
                setTempPin(null)
              }}
              onSaved={onStoreSaved}
            />
          )}

          {selected && (
            <StorePanel
              store={selected}
              myLocation={myLocation}
              onClose={() => setSelectedId(null)}
              onRefresh={load}
            />
          )}

          {pasteOpen && <PasteImport onImport={importRows} onClose={() => setPasteOpen(false)} />}
        </div>
      </div>
    </APIProvider>
  )
}
