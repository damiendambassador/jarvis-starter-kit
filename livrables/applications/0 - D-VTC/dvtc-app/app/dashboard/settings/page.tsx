'use client'

import { useEffect, useState } from 'react'
import { supabase, type Driver, type Pricing } from '@/lib/supabase'
import { useDriver } from '../_context'
import { formatPrice } from '@/lib/pricing'
import { Copy, Check, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const driver = useDriver()
  const [pricing, setPricing] = useState<Pricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [profile, setProfile] = useState({ name: driver.name, phone: driver.phone ?? '' })
  const [vehicle, setVehicle] = useState({
    model: driver.vehicle_model ?? '',
    plate: driver.vehicle_plate ?? '',
    capacity: String(driver.vehicle_capacity),
  })
  const [tarif, setTarif] = useState({
    base: '', perKm: '', night: '', dispo2h: '', journee: '', remise: '',
  })

  useEffect(() => {
    supabase.from('pricing').select('*').eq('driver_id', driver.id).single()
      .then(({ data }) => {
        if (data) {
          setPricing(data)
          setTarif({
            base: String(data.base_fare),
            perKm: String(data.price_per_km),
            night: String(Math.round(data.night_surcharge * 100)),
            dispo2h: String(data.dispo_2h),
            journee: String(data.dispo_day),
            remise: String(Math.round(data.loyalty_discount * 100)),
          })
        }
        setLoading(false)
      })
  }, [driver.id])

  async function saveProfile() {
    setSaving('profile')
    await supabase.from('drivers').update({ name: profile.name, phone: profile.phone || null }).eq('id', driver.id)
    setSaving(null)
  }

  async function saveVehicle() {
    setSaving('vehicle')
    await supabase.from('drivers').update({
      vehicle_model: vehicle.model || null,
      vehicle_plate: vehicle.plate || null,
      vehicle_capacity: parseInt(vehicle.capacity) || 4,
    }).eq('id', driver.id)
    setSaving(null)
  }

  async function saveTarif() {
    if (!pricing) return
    setSaving('tarif')
    await supabase.from('pricing').update({
      base_fare: parseFloat(tarif.base),
      price_per_km: parseFloat(tarif.perKm),
      night_surcharge: parseFloat(tarif.night) / 100,
      dispo_2h: parseFloat(tarif.dispo2h),
      dispo_day: parseFloat(tarif.journee),
      loyalty_discount: parseFloat(tarif.remise) / 100,
    }).eq('id', pricing.id)
    setSaving(null)
  }

  function copyLink() {
    const link = `${window.location.origin}/r/${driver.slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bookingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${driver.slug}`
    : `/r/${driver.slug}`

  // Preview pour la tarification
  const prevBase = parseFloat(tarif.base) || 0
  const prevPerKm = parseFloat(tarif.perKm) || 0
  const prevTotal = prevBase + 20 * prevPerKm

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-navy" size={28} /></div>
  )

  return (
    <div className="max-w-[760px]">
      <h1 className="font-serif text-[28px] font-bold text-navy m-0 mb-6 tracking-[-0.01em]">Paramètres</h1>

      <div className="flex flex-col gap-[18px]">

        {/* Profil */}
        <Section title="Mon profil">
          <div className="grid grid-cols-2 gap-[14px]">
            <Field label="Nom complet">
              <input className="input-field" value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Téléphone">
              <input className="input-field" value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
            </Field>
            <div className="col-span-2">
              <Field label="Email (lecture seule)">
                <input className="input-field bg-[#F8F9FA] text-[#8A94A6]" value={driver.email} readOnly />
              </Field>
            </div>
          </div>
          <SaveButton onClick={saveProfile} saving={saving === 'profile'} />
        </Section>

        {/* Véhicule */}
        <Section title="Mon véhicule">
          <div className="grid grid-cols-3 gap-[14px]">
            <Field label="Modèle">
              <input className="input-field" placeholder="Toyota Camry" value={vehicle.model}
                onChange={e => setVehicle(v => ({ ...v, model: e.target.value }))} />
            </Field>
            <Field label="Plaque">
              <input className="input-field" placeholder="AB-123-CD" value={vehicle.plate}
                onChange={e => setVehicle(v => ({ ...v, plate: e.target.value }))} />
            </Field>
            <Field label="Capacité">
              <select className="input-field" value={vehicle.capacity}
                onChange={e => setVehicle(v => ({ ...v, capacity: e.target.value }))}>
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <option key={n} value={String(n)}>{n} passager{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </Field>
          </div>
          <SaveButton onClick={saveVehicle} saving={saving === 'vehicle'} />
        </Section>

        {/* Tarification */}
        {pricing && (
          <Section title="Ma tarification">
            <div className="flex gap-5 flex-wrap">
              <div className="flex-1 min-w-[320px] grid grid-cols-2 gap-[13px]">
                <Field label="Prix de base (€)">
                  <input className="input-field" type="number" step="0.01" inputMode="decimal"
                    value={tarif.base} onChange={e => setTarif(t => ({ ...t, base: e.target.value }))} />
                </Field>
                <Field label="Prix par km (€)">
                  <input className="input-field" type="number" step="0.01" inputMode="decimal"
                    value={tarif.perKm} onChange={e => setTarif(t => ({ ...t, perKm: e.target.value }))} />
                </Field>
                <Field label="Majoration nuit (%)">
                  <input className="input-field" type="number" step="1" inputMode="decimal"
                    value={tarif.night} onChange={e => setTarif(t => ({ ...t, night: e.target.value }))} />
                </Field>
                <Field label="Mise à dispo 2h (€)">
                  <input className="input-field" type="number" step="1" inputMode="decimal"
                    value={tarif.dispo2h} onChange={e => setTarif(t => ({ ...t, dispo2h: e.target.value }))} />
                </Field>
                <Field label="Journée complète (€)">
                  <input className="input-field" type="number" step="1" inputMode="decimal"
                    value={tarif.journee} onChange={e => setTarif(t => ({ ...t, journee: e.target.value }))} />
                </Field>
                <Field label="Remise fidélité (%)">
                  <input className="input-field" type="number" step="1" inputMode="decimal"
                    value={tarif.remise} onChange={e => setTarif(t => ({ ...t, remise: e.target.value }))} />
                </Field>
              </div>

              {/* Preview */}
              <div className="flex-1 min-w-[200px] bg-navy rounded-xl px-[18px] py-[18px] self-start text-white">
                <div className="text-[11px] uppercase tracking-[.06em] text-white/50 mb-3">Aperçu — course 20 km</div>
                <div className="flex justify-between text-[13px] text-white/75 mb-2">
                  <span>Base</span><span>{formatPrice(prevBase)}</span>
                </div>
                <div className="flex justify-between text-[13px] text-white/75 mb-2">
                  <span>20 km × {formatPrice(prevPerKm)}</span><span>{formatPrice(20 * prevPerKm)}</span>
                </div>
                <div className="border-t border-white/14 my-2.5" />
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px]">Total</span>
                  <span className="text-[22px] font-bold text-gold">{formatPrice(prevTotal)}</span>
                </div>
              </div>
            </div>
            <SaveButton onClick={saveTarif} saving={saving === 'tarif'} />
          </Section>
        )}

        {/* Lien de réservation + QR Code */}
        <Section title="Mon lien de réservation">
          <div className="flex gap-2.5 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] bg-[#F8F9FA] border border-blue-gray rounded-[9px] px-[14px] py-3 text-[14px] text-[#3A4456] font-mono truncate">
              {bookingLink}
            </div>
            <button onClick={copyLink}
              className="flex items-center gap-2 bg-blue text-white border-none rounded-[9px] px-4 py-3 text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="text-[12px] text-[#8A94A6] mt-3 leading-[1.5]">
            Partagez ce lien à vos clients pour qu'ils réservent directement chez vous.
          </p>

          {/* QR Code */}
          <div className="mt-5 pt-5 border-t border-blue-gray flex gap-6 items-start flex-wrap">
            <div className="flex flex-col items-center gap-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(bookingLink)}&bgcolor=ffffff&color=0a1628&margin=10`}
                alt="QR Code réservation"
                width={160}
                height={160}
                className="rounded-xl border border-blue-gray"
              />
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(bookingLink)}&bgcolor=ffffff&color=0a1628&margin=20`}
                download="qr-code-dvtc.png"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[12px] font-semibold text-blue hover:opacity-75 transition-opacity"
              >
                Télécharger en HD
              </a>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-[13px] font-bold text-navy mb-2">À imprimer pour votre véhicule</div>
              <div className="text-[12px] text-[#5A6477] leading-[1.6]">
                Plastifiez ce QR code et posez-le dans votre voiture. Vos clients scannent, réservent en 30 secondes, sans chercher votre lien.
              </div>
            </div>
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card px-[22px] py-[22px]">
      <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#8A94A6] mb-4">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="mt-4 w-full bg-navy text-white border-none rounded-[9px] py-[11px] text-[13px] font-semibold hover:bg-navy-light transition-colors disabled:opacity-50 cursor-pointer">
      {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Enregistrer les modifications'}
    </button>
  )
}
