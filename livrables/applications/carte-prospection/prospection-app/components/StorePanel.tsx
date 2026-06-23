'use client'

import { useEffect, useState } from 'react'
import { supabase, type StoreWithPlacements } from '@/lib/supabase'
import {
  BRAND_NAMES,
  referencesForBrand,
  STATUS_NAMES,
  BRAND_STATUS_NAMES,
  DEFAULT_BRAND_STATUS,
  brandStatusColor,
  chainColor,
} from '@/lib/constants'
import type { LatLng } from './MapView'
import { X, Trash2, Plus, MapPin, Phone, Mail, StickyNote, Navigation, Loader2, Star } from 'lucide-react'

export default function StorePanel({
  store,
  myLocation,
  onClose,
  onRefresh,
}: {
  store: StoreWithPlacements
  myLocation: LatLng | null
  onClose: () => void
  onRefresh: () => void
}) {
  // ── État éditable du magasin ──
  const [status, setStatus] = useState(store.status)
  const [contactName, setContactName] = useState(store.contact_name ?? '')
  const [phone, setPhone] = useState(store.phone ?? '')
  const [email, setEmail] = useState(store.email ?? '')
  const [notes, setNotes] = useState(store.notes ?? '')
  const [savingStore, setSavingStore] = useState(false)

  // ── Nouvel ajout de placement ──
  const [brand, setBrand] = useState<string>(BRAND_NAMES[0])
  const [reference, setReference] = useState('')
  const [pStatus, setPStatus] = useState<string>(DEFAULT_BRAND_STATUS)
  const [addingPlacement, setAddingPlacement] = useState(false)

  const [distance, setDistance] = useState<string | null>(null)
  const [loadingDist, setLoadingDist] = useState(false)

  // Réinitialise les champs quand on change de magasin
  useEffect(() => {
    setStatus(store.status)
    setContactName(store.contact_name ?? '')
    setPhone(store.phone ?? '')
    setEmail(store.email ?? '')
    setNotes(store.notes ?? '')
    setDistance(null)
  }, [store])

  async function saveStore() {
    setSavingStore(true)
    await supabase
      .from('stores')
      .update({
        status,
        contact_name: contactName || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
      })
      .eq('id', store.id)
    setSavingStore(false)
    onRefresh()
  }

  async function addPlacement() {
    if (!brand) return
    setAddingPlacement(true)
    await supabase.from('placements').insert({
      store_id: store.id,
      brand,
      reference: reference || null,
      status: pStatus,
    })
    setReference('')
    setAddingPlacement(false)
    onRefresh()
  }

  async function deletePlacement(id: string) {
    await supabase.from('placements').delete().eq('id', id)
    onRefresh()
  }

  async function deleteStore() {
    if (!confirm('Supprimer définitivement ce magasin et ses placements ?')) return
    await supabase.from('stores').delete().eq('id', store.id)
    onClose()
    onRefresh()
  }

  async function computeDistance() {
    if (!myLocation) {
      alert('Active d’abord « Ma position » dans la barre du haut.')
      return
    }
    setLoadingDist(true)
    const res = await fetch('/api/distance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: myLocation, destinations: [{ lat: store.lat, lng: store.lng }] }),
    })
    const data = await res.json()
    const r = data.results?.[0]
    setDistance(r?.ok ? `${r.distance_text} · ${r.duration_text}` : 'Indisponible')
    setLoadingDist(false)
  }

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-[400px] bg-cream shadow-[-12px_0_40px_rgba(0,0,0,0.25)] flex flex-col z-20">
      {/* En-tête */}
      <div className="bg-teal text-cream px-5 py-4 flex items-start gap-3">
        <span className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ background: chainColor(store.chain) }} />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-cream/60">{store.chain}</div>
          <div className="font-serif text-[19px] font-bold leading-tight truncate">{store.name || 'Magasin'}</div>
          {store.address && <div className="text-[12px] text-cream/70 mt-0.5">{store.address}</div>}
        </div>
        <button onClick={onClose} className="text-cream/70 hover:text-cream shrink-0">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll px-5 py-4 space-y-5">
        {/* Statut magasin */}
        <div>
          <label className="text-[11px] font-semibold text-teal/60 block mb-1">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-teal/20 rounded-lg px-2.5 py-2 text-[13px] text-teal bg-white"
          >
            {STATUS_NAMES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* CRM léger */}
        <div className="space-y-2">
          <Field icon={<MapPin size={14} />} placeholder="Contact" value={contactName} onChange={setContactName} />
          <Field icon={<Phone size={14} />} placeholder="Téléphone" value={phone} onChange={setPhone} />
          <Field icon={<Mail size={14} />} placeholder="Email" value={email} onChange={setEmail} />
          <div className="flex items-start gap-2">
            <span className="text-teal/40 mt-2.5">
              <StickyNote size={14} />
            </span>
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="flex-1 border border-teal/20 rounded-lg px-3 py-2 text-[13px] text-teal bg-white resize-none"
            />
          </div>
        </div>

        <button
          onClick={saveStore}
          disabled={savingStore}
          className="w-full bg-teal text-cream rounded-lg py-2.5 text-[13px] font-semibold hover:bg-teal-light disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {savingStore && <Loader2 size={14} className="animate-spin" />}
          Enregistrer les infos
        </button>

        {/* Distance */}
        <button
          onClick={computeDistance}
          disabled={loadingDist}
          className="w-full border border-teal/30 text-teal rounded-lg py-2 text-[12px] font-semibold hover:bg-teal/5 transition-colors flex items-center justify-center gap-2"
        >
          {loadingDist ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          {distance ? `Trajet : ${distance}` : 'Distance depuis ma position'}
        </button>

        {/* Placements */}
        <div>
          <div className="text-[12px] font-bold text-teal uppercase tracking-wide mb-2">Marques placées</div>
          {store.placements.length === 0 && (
            <p className="text-[12px] text-teal/40 italic mb-2">Aucune marque renseignée.</p>
          )}
          <ul className="space-y-1.5 mb-3">
            {store.placements.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 bg-white border border-teal/15 rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-teal flex items-center gap-1.5">
                    {p.brand}
                    {p.status === 'Gagné' && <Star size={11} className="text-green-600" />}
                  </div>
                  {p.reference && <div className="text-[12px] text-teal/60 truncate">{p.reference}</div>}
                </div>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: `${brandStatusColor(p.status)}22`, color: brandStatusColor(p.status) }}
                >
                  {p.status}
                </span>
                <button onClick={() => deletePlacement(p.id)} className="text-red-400 hover:text-red-600 shrink-0">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>

          {/* Ajout de placement */}
          <div className="bg-white border border-teal/15 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value)
                  setReference('')
                }}
                className="border border-teal/20 rounded-lg px-2 py-1.5 text-[12px] text-teal bg-white"
              >
                {BRAND_NAMES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={pStatus}
                onChange={(e) => setPStatus(e.target.value)}
                className="border border-teal/20 rounded-lg px-2 py-1.5 text-[12px] text-teal bg-white"
              >
                {BRAND_STATUS_NAMES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <input
              list="ref-suggestions"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Référence (ex. Macallan DC 12)"
              className="w-full border border-teal/20 rounded-lg px-2.5 py-1.5 text-[12px] text-teal bg-white"
            />
            <datalist id="ref-suggestions">
              {referencesForBrand(brand).map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <p className="text-[11px] text-teal/50 leading-snug">
              Statut <b>Gagné</b> = nouvelle DN que tu as placée (mise en avant sur la carte).
            </p>
            <button
              onClick={addPlacement}
              disabled={addingPlacement}
              className="w-full bg-bronze text-white rounded-lg py-2 text-[12px] font-semibold hover:bg-bronze-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {addingPlacement ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Ajouter la marque
            </button>
          </div>
        </div>
      </div>

      {/* Pied : suppression */}
      <div className="border-t border-teal/10 px-5 py-3">
        <button
          onClick={deleteStore}
          className="text-[12px] text-red-500 hover:text-red-700 flex items-center gap-1.5"
        >
          <Trash2 size={13} /> Supprimer ce magasin
        </button>
      </div>
    </div>
  )
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-teal/40">{icon}</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 border border-teal/20 rounded-lg px-3 py-2 text-[13px] text-teal bg-white"
      />
    </div>
  )
}
