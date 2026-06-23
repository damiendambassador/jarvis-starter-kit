'use client'

import { useState } from 'react'
import { supabase, type Store } from '@/lib/supabase'
import { CHAIN_NAMES, STATUS_NAMES, DEFAULT_STATUS } from '@/lib/constants'
import type { LatLng } from './MapView'
import { X, Search, Loader2, MapPinned, Check } from 'lucide-react'

export default function AddStoreForm({
  tempPin,
  onSetTempPin,
  onClose,
  onSaved,
}: {
  tempPin: LatLng | null
  onSetTempPin: (p: LatLng) => void
  onClose: () => void
  onSaved: (store: Store) => void
}) {
  const [chain, setChain] = useState<string>(CHAIN_NAMES[0])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postal, setPostal] = useState('')
  const [status, setStatus] = useState<string>(DEFAULT_STATUS)
  const [geocoding, setGeocoding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  async function locate() {
    if (!address.trim()) return
    setGeocoding(true)
    setGeoError(null)
    const res = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    setGeocoding(false)
    if (!res.ok) {
      setGeoError('Adresse introuvable. Essaie d’être plus précis ou clique sur la carte.')
      return
    }
    const d = await res.json()
    onSetTempPin({ lat: d.lat, lng: d.lng })
    if (d.formatted_address) setAddress(d.formatted_address)
    if (d.city) setCity(d.city)
    if (d.postal_code) setPostal(d.postal_code)
  }

  async function save() {
    if (!tempPin) return
    setSaving(true)
    const { data, error } = await supabase
      .from('stores')
      .insert({
        chain,
        name: name || null,
        address: address || null,
        city: city || null,
        postal_code: postal || null,
        lat: tempPin.lat,
        lng: tempPin.lng,
        status,
      })
      .select('*')
      .single()
    setSaving(false)
    if (!error && data) onSaved(data as Store)
  }

  return (
    <div className="absolute top-4 left-4 z-30 w-[320px] bg-cream rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
      <div className="bg-teal text-cream px-4 py-3 flex items-center justify-between">
        <span className="font-serif text-[16px] font-bold flex items-center gap-2">
          <MapPinned size={16} /> Nouveau magasin
        </span>
        <button onClick={onClose} className="text-cream/70 hover:text-cream">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Recherche adresse */}
        <div>
          <label className="text-[11px] font-semibold text-teal/60 block mb-1">Adresse</label>
          <div className="flex gap-1.5">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && locate()}
              placeholder="12 rue de la Paix, Paris"
              className="flex-1 border border-teal/20 rounded-lg px-2.5 py-2 text-[13px] text-teal bg-white"
            />
            <button
              onClick={locate}
              disabled={geocoding}
              title="Localiser l'adresse"
              className="bg-bronze text-white rounded-lg px-3 hover:bg-bronze-dark disabled:opacity-50 transition-colors"
            >
              {geocoding ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            </button>
          </div>
          <p className="text-[11px] text-teal/50 mt-1">…ou clique directement sur la carte pour poser le point.</p>
          {geoError && <p className="text-[11px] text-red-500 mt-1">{geoError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-teal/60 block mb-1">Ville</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-teal/20 rounded-lg px-2.5 py-2 text-[13px] text-teal bg-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-teal/60 block mb-1">Code postal</label>
            <input
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              className="w-full border border-teal/20 rounded-lg px-2.5 py-2 text-[13px] text-teal bg-white"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-teal/60 block mb-1">Enseigne</label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="w-full border border-teal/20 rounded-lg px-2.5 py-2 text-[13px] text-teal bg-white"
          >
            {CHAIN_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-teal/60 block mb-1">Nom (optionnel)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Nicolas Marbeuf"
              className="w-full border border-teal/20 rounded-lg px-2.5 py-2 text-[13px] text-teal bg-white"
            />
          </div>
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
        </div>

        <div className="text-[11px] text-teal/60 bg-teal/5 rounded-lg px-3 py-2">
          {tempPin ? (
            <span className="flex items-center gap-1.5 text-teal">
              <Check size={13} /> Point posé : {tempPin.lat.toFixed(5)}, {tempPin.lng.toFixed(5)}
            </span>
          ) : (
            'Aucun point posé. Localise l’adresse ou clique sur la carte.'
          )}
        </div>

        <button
          onClick={save}
          disabled={!tempPin || saving}
          className="w-full bg-teal text-cream rounded-lg py-2.5 text-[13px] font-semibold hover:bg-teal-light disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Enregistrer le magasin
        </button>
      </div>
    </div>
  )
}
