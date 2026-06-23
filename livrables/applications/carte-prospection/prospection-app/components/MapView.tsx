'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import type { Marker } from '@googlemaps/markerclusterer'
import { Star } from 'lucide-react'
import type { StoreWithPlacements } from '@/lib/supabase'
import {
  FRANCE_CENTER,
  FRANCE_ZOOM,
  pinColor,
  brandStatusColor,
  chainCode,
  ON_SHELF_STATUSES,
  type ColorMode,
} from '@/lib/constants'

const MAP_ID = process.env.NEXT_PUBLIC_MAP_ID || 'DEMO_MAP_ID'

export type LatLng = { lat: number; lng: number }

// ── Comptes dérivés d'un magasin ───────────────────────────
// Pénétration : marques « sur l'étagère » (Présent ou Gagné).
export function presentCount(s: StoreWithPlacements): number {
  return s.placements.filter((p) => ON_SHELF_STATUSES.includes(p.status)).length
}
// Mes gains : marques que j'ai placées (statut « Gagné »).
export function newDnCount(s: StoreWithPlacements): number {
  return s.placements.filter((p) => p.status === 'Gagné').length
}
export function hasBrandPresent(s: StoreWithPlacements, brand: string): boolean {
  return s.placements.some((p) => p.brand === brand && ON_SHELF_STATUSES.includes(p.status))
}
// État d'une marque donnée dans ce magasin (null = pas travaillée = opportunité).
export function brandStatus(s: StoreWithPlacements, brand: string): string | null {
  const ps = s.placements.filter((p) => p.brand === brand)
  if (!ps.length) return null
  const order = ['Gagné', 'Présent', 'En cours', 'Refusé'] // on montre le meilleur état atteint
  return [...ps].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))[0].status
}

function colorForStore(
  s: StoreWithPlacements,
  colorMode: ColorMode,
  brandFocus: string | null,
): string {
  if (brandFocus) return brandStatusColor(brandStatus(s, brandFocus))
  return pinColor(colorMode, {
    chain: s.chain,
    status: s.status,
    presentCount: presentCount(s),
    newDnCount: newDnCount(s),
  })
}

// ── Marqueur magasin : pastille ronde, couleur = état, code 2 lettres = enseigne.
// Le gain (« Gagné ») = simple badge étoile vert, sans altérer la couleur du pin.
function StoreMarker({
  fill,
  code,
  selected,
  win,
}: {
  fill: string
  code: string
  selected: boolean
  win: boolean
}) {
  const size = selected ? 32 : 26
  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 12, height: size + 12 }}>
      <div
        className="rounded-full flex items-center justify-center text-white font-bold tracking-tight"
        style={{
          width: size,
          height: size,
          background: fill,
          boxShadow: selected
            ? '0 0 0 2px #0E3F40, 0 0 0 4px #fff, 0 2px 6px rgba(0,0,0,0.4)'
            : '0 0 0 2px #fff, 0 1px 4px rgba(0,0,0,0.35)',
          fontSize: size * 0.4,
        }}
      >
        {code}
      </div>
      {win && (
        <span
          className="absolute flex items-center justify-center rounded-full bg-green-600 border border-white"
          style={{ width: 14, height: 14, top: -3, right: -3 }}
        >
          <Star size={8} color="#fff" fill="#fff" />
        </span>
      )}
    </div>
  )
}

// ── Marqueurs clusterisés ──────────────────────────────────
function ClusteredStoreMarkers({
  stores,
  colorMode,
  brandFocus,
  selectedId,
  onSelect,
}: {
  stores: StoreWithPlacements[]
  colorMode: ColorMode
  brandFocus: string | null
  selectedId: string | null
  onSelect: (s: StoreWithPlacements) => void
}) {
  const map = useMap()

  const clusterer = useMemo(() => (map ? new MarkerClusterer({ map }) : null), [map])

  // Marqueurs stockés dans une ref (mutation, pas de setState) pour éviter
  // toute boucle de rendu liée aux callbacks ref inline.
  const markersRef = useRef<Record<string, Marker>>({})

  const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
    if (marker) markersRef.current[key] = marker
    else delete markersRef.current[key]
  }, [])

  // Resynchronise le clusterer quand la liste des magasins (ou le clusterer) change.
  useEffect(() => {
    if (!clusterer) return
    clusterer.clearMarkers()
    clusterer.addMarkers(Object.values(markersRef.current))
  }, [clusterer, stores])

  useEffect(() => () => clusterer?.clearMarkers(), [clusterer])

  return (
    <>
      {stores.map((s) => {
        const selected = s.id === selectedId
        const hasNewDn = newDnCount(s) > 0 // magasin où une nouvelle DN a été gagnée
        const fill = colorForStore(s, colorMode, brandFocus)
        return (
          <AdvancedMarker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            ref={(marker) => setMarkerRef(marker, s.id)}
            onClick={() => onSelect(s)}
            zIndex={selected ? 999 : hasNewDn ? 600 : undefined}
          >
            <StoreMarker fill={fill} code={chainCode(s.chain)} selected={selected} win={hasNewDn} />
          </AdvancedMarker>
        )
      })}
    </>
  )
}

// ── Carte principale ───────────────────────────────────────
export default function MapView({
  stores,
  colorMode,
  brandFocus,
  selectedId,
  onSelectStore,
  addMode,
  onMapClick,
  tempPin,
  myLocation,
}: {
  stores: StoreWithPlacements[]
  colorMode: ColorMode
  brandFocus: string | null
  selectedId: string | null
  onSelectStore: (s: StoreWithPlacements) => void
  addMode: boolean
  onMapClick: (p: LatLng) => void
  tempPin: LatLng | null
  myLocation: LatLng | null
}) {
  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={FRANCE_CENTER}
      defaultZoom={FRANCE_ZOOM}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapTypeControl={false}
      streetViewControl={false}
      fullscreenControl={false}
      className="w-full h-full"
      style={addMode ? { cursor: 'crosshair' } : undefined}
      onClick={(e) => {
        if (addMode && e.detail.latLng) onMapClick(e.detail.latLng)
      }}
    >
      <ClusteredStoreMarkers
        stores={stores}
        colorMode={colorMode}
        brandFocus={brandFocus}
        selectedId={selectedId}
        onSelect={onSelectStore}
      />

      {tempPin && (
        <AdvancedMarker position={tempPin} zIndex={1000}>
          <div
            className="rounded-full"
            style={{
              width: 22,
              height: 22,
              background: '#BC7A4A',
              boxShadow: '0 0 0 3px #fff, 0 2px 6px rgba(0,0,0,0.4)',
            }}
          />
        </AdvancedMarker>
      )}

      {myLocation && (
        <AdvancedMarker position={myLocation} zIndex={1001}>
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_0_4px_rgba(59,130,246,0.35)]" />
        </AdvancedMarker>
      )}
    </Map>
  )
}
