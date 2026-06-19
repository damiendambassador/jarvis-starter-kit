'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Driver, type Pricing } from '@/lib/supabase'
import { calculateStandardPrice, formatPrice } from '@/lib/pricing'
import {
  Car, Clock, Star, MapPin, Route, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import {
  format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isSameDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

function buildCalCells(viewDate: Date, selectedDate: Date | null) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let startOffset = getDay(startOfMonth(viewDate)) - 1
  if (startOffset < 0) startOffset = 6
  const days = getDaysInMonth(viewDate)
  type Cell = { day: number | null; date: Date | null; past: boolean; sel: boolean; today: boolean }
  const cells: Cell[] = []
  for (let i = 0; i < startOffset; i++) cells.push({ day: null, date: null, past: true, sel: false, today: false })
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d)
    cells.push({
      day: d, date,
      past: date < today,
      sel: selectedDate ? isSameDay(date, selectedDate) : false,
      today: isSameDay(date, today),
    })
  }
  return cells
}

function buildDispoTiers(p: Pricing) {
  return [
    { value: '2', label: '2 heures', price: p.dispo_2h },
    { value: '3', label: '3 heures', price: Math.round(p.dispo_2h * 1.40) },
    { value: '4', label: '4 heures', price: Math.round(p.dispo_2h * 1.70) },
    { value: '6', label: '6 heures', price: Math.round(p.dispo_day * 0.70) },
    { value: '8', label: '8 heures', price: Math.round(p.dispo_day * 0.88) },
    { value: 'day', label: 'Journée complète', price: p.dispo_day },
  ]
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [driver, setDriver] = useState<Driver | null>(null)
  const [pricing, setPricing] = useState<Pricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    date: '', time: '10:00', passengers: 1,
    rideType: 'standard' as 'standard' | 'dispo',
    pickupAddress: '', dropoffAddress: '', distanceKm: '',
    dispoDuration: '2',
    notes: '', acceptPrivacy: false,
  })

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const selectedDate = form.date ? new Date(form.date + 'T12:00:00') : null
  const calCells = useMemo(() => buildCalCells(viewDate, selectedDate), [viewDate, form.date])
  const pickerLabel = format(viewDate, 'MMMM yyyy', { locale: fr })

  const dispoTiers = useMemo(() => pricing ? buildDispoTiers(pricing) : [], [pricing])
  const selectedTier = dispoTiers.find(t => t.value === form.dispoDuration) ?? dispoTiers[0]

  const hour = parseInt(form.time.split(':')[0])
  const isNight = hour < 8 || hour >= 20

  const standardPrice = useMemo(() => {
    if (!pricing || form.rideType !== 'standard') return null
    const dist = parseFloat(form.distanceKm)
    if (!dist) return null
    return calculateStandardPrice(pricing, dist, hour, false)
  }, [pricing, form.distanceKm, form.time, form.rideType, hour])

  const totalPrice = form.rideType === 'standard'
    ? (standardPrice?.total ?? null)
    : (selectedTier?.price ?? null)

  const recapKm = form.rideType === 'standard'
    ? (form.distanceKm ? `${form.distanceKm} km` : '—')
    : (selectedTier?.label ?? '—')

  const recapDur = form.rideType === 'standard' && form.distanceKm
    ? `~${Math.round(parseFloat(form.distanceKm) * 1.5)} min`
    : null

  const requiredFields: (keyof typeof form)[] = [
    'firstName', 'lastName', 'phone', 'email', 'date', 'time', 'pickupAddress',
    ...(form.rideType === 'standard' ? ['dropoffAddress', 'distanceKm'] as const : []),
  ]
  const missingCount = requiredFields.filter(f => !form[f]).length
  const canSubmit = missingCount === 0 && form.acceptPrivacy && !submitting

  useEffect(() => {
    supabase.from('drivers').select('*').eq('slug', slug).eq('is_active', true).single()
      .then(({ data, error: e }) => {
        if (e || !data) { setError('Chauffeur introuvable.'); setLoading(false); return }
        supabase.from('pricing').select('*').eq('driver_id', data.id).single()
          .then(({ data: p }) => { setDriver(data); setPricing(p); setLoading(false) })
      })
  }, [slug])

  async function doSubmit() {
    if (!driver || !canSubmit) return
    setSubmitting(true)
    const payload = {
      driver_id: driver.id,
      client_name: `${form.firstName} ${form.lastName}`,
      client_phone: form.phone,
      client_email: form.email,
      ride_type: form.rideType,
      pickup_address: form.pickupAddress,
      dropoff_address: form.rideType === 'standard' ? form.dropoffAddress : null,
      distance_km: form.rideType === 'standard' ? parseFloat(form.distanceKm) : null,
      scheduled_at: `${form.date}T${form.time}:00`,
      passengers: form.passengers,
      notes: form.notes || null,
      price_estimate: totalPrice,
      status: 'pending',
    }
    const { data: reservation, error: insertError } = await supabase
      .from('reservations').insert(payload).select().single()
    if (insertError) { setError('Une erreur est survenue. Réessayez.'); setSubmitting(false); return }
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'new_reservation', reservation, driverEmail: driver.email, driverName: driver.name }),
    })
    router.push(`/r/${slug}/confirmation?id=${reservation.id}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Loader2 className="animate-spin text-navy" size={32} />
    </div>
  )

  if (error || !driver || !pricing) return (
    <div className="min-h-screen flex items-center justify-center bg-cream text-center px-4">
      <div>
        <p className="text-navy font-semibold text-lg">{error ?? 'Chauffeur introuvable.'}</p>
        <p className="text-[#8A94A6] mt-2 text-sm">Vérifiez le lien que vous avez reçu.</p>
      </div>
    </div>
  )

  const nightPct = Math.round(pricing.night_surcharge * 100)

  return (
    <div className="min-h-screen bg-cream antialiased animate-fade-in">

      {/* Header */}
      <header className="bg-navy text-white px-7 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[9px] bg-navy border border-gold/50 flex items-center justify-center flex-shrink-0">
            <span className="text-gold font-bold text-lg leading-none">D</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[.2em] text-gold font-semibold">Service privé VTC</div>
            <div className="text-[15px] font-semibold text-white mt-0.5">{driver.name}</div>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="border border-white/22 text-white/85 px-3.5 py-2 rounded-lg text-[13px] font-medium hover:bg-white/10 transition-colors"
        >
          Espace conducteur
        </button>
      </header>

      {/* Hero */}
      <section className="bg-navy text-white px-7 pt-[46px] pb-[60px] text-center">
        <h1 className="font-serif text-[44px] font-bold leading-[1.12] tracking-[-0.01em] m-0">
          Réservez votre chauffeur,<br />
          <span className="text-gold">en toute simplicité.</span>
        </h1>
        <p className="mt-4 max-w-[480px] mx-auto text-white/60 text-base leading-[1.55]">
          Un service ponctuel et discret. Réservation en quelques secondes, confirmation par votre chauffeur.
        </p>
      </section>

      {/* Tariff cards */}
      <section className="max-w-[1080px] mx-auto -mt-[34px] px-6 relative z-10">
        <div className="flex gap-[18px] flex-wrap">
          <div className="flex-1 basis-[230px] card px-[22px] py-[22px]">
            <Car className="text-blue mb-3" size={22} />
            <div className="font-serif text-[17px] font-bold text-navy">Trajets standards</div>
            <div className="text-[20px] font-bold mt-2 text-navy">
              À partir de {formatPrice(pricing.base_fare)}&thinsp;
              <span className="text-[14px] font-medium text-[#8A94A6]">+ {formatPrice(pricing.price_per_km)}/km</span>
            </div>
            <div className="text-[12px] text-[#8A94A6] mt-2">Majoration nuit +{nightPct}% (20h–8h)</div>
          </div>
          <div className="flex-1 basis-[230px] card px-[22px] py-[22px]">
            <Clock className="text-blue mb-3" size={22} />
            <div className="font-serif text-[17px] font-bold text-navy">Mise à disposition</div>
            <div className="text-[20px] font-bold mt-2 text-navy">
              À partir de {formatPrice(pricing.dispo_2h)}&thinsp;
              <span className="text-[14px] font-medium text-[#8A94A6]">/ 2h</span>
            </div>
            <div className="text-[12px] text-[#8A94A6] mt-2">Journée complète {formatPrice(pricing.dispo_day)}</div>
          </div>
          <div className="flex-1 basis-[230px] bg-[#FBF7EC] border border-[#C9A84C] rounded-2xl px-[22px] py-[22px] shadow-[0_8px_28px_rgba(201,168,76,0.12)]">
            <Star className="text-gold mb-3" size={22} />
            <div className="font-serif text-[17px] font-bold text-[#9A7B2E]">Programme fidélité</div>
            <div className="text-[20px] font-bold mt-2 text-navy">
              −{Math.round(pricing.loyalty_discount * 100)}% automatique
            </div>
            <div className="text-[12px] text-[#9A7B2E] mt-2">
              Dès la {pricing.loyalty_threshold}ᵉ course, sur vos 3 prochaines
            </div>
          </div>
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="max-w-[1080px] mx-auto mt-9 px-6 pb-[70px] flex gap-[26px] flex-wrap items-start">

        {/* Left: Form */}
        <div className="flex-1 basis-[540px] min-w-[300px] flex flex-col gap-[18px]">

          {/* Coordonnées */}
          <div className="card px-[22px] py-[22px]">
            <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#8A94A6] mb-4">Vos coordonnées</div>
            <div className="grid grid-cols-2 gap-[14px]">
              {([
                { name: 'firstName', label: 'Prénom', placeholder: 'Jean' },
                { name: 'lastName', label: 'Nom', placeholder: 'Dupont' },
                { name: 'phone', label: 'Téléphone', placeholder: '06 12 34 56 78', type: 'tel' },
                { name: 'email', label: 'Email', placeholder: 'jean@email.com', type: 'email' },
              ] as const).map(f => (
                <label key={f.name} className="block">
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">{f.label}</span>
                  <input
                    type={f.type ?? 'text'}
                    className="input-field"
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Date & Heure */}
          <div className="card px-[22px] py-[22px]">
            <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#8A94A6] mb-4">Date et heure</div>
            <div className="flex gap-5 flex-wrap">
              {/* Calendar picker */}
              <div className="flex-1 min-w-[280px]">
                <div className="flex items-center justify-between mb-2.5">
                  <button type="button"
                    onClick={() => setViewDate(d => subMonths(d, 1))}
                    className="w-[30px] h-[30px] border border-blue-gray bg-white rounded-lg flex items-center justify-center text-[#5A6477] hover:border-navy transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-[14px] font-semibold text-navy capitalize">{pickerLabel}</div>
                  <button type="button"
                    onClick={() => setViewDate(d => addMonths(d, 1))}
                    className="w-[30px] h-[30px] border border-blue-gray bg-white rounded-lg flex items-center justify-center text-[#5A6477] hover:border-navy transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-[3px] mb-1.5">
                  {WEEKDAYS.map(wd => (
                    <div key={wd} className="text-center text-[10px] font-semibold text-[#A7B0BF] py-1">{wd}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-[3px]">
                  {calCells.map((cell, i) => (
                    <button key={i} type="button"
                      disabled={!cell.day || cell.past}
                      onClick={() => cell.date && setForm(prev => ({
                        ...prev, date: cell.date!.toISOString().split('T')[0]
                      }))}
                      className={[
                        'aspect-square flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors',
                        !cell.day ? 'invisible' : '',
                        cell.past ? 'text-[#C4CDDB] cursor-not-allowed' : 'cursor-pointer',
                        cell.sel ? 'bg-navy text-white' : '',
                        cell.today && !cell.sel ? 'border border-navy/30 font-bold text-navy' : '',
                        !cell.sel && !cell.past && !cell.today ? 'text-navy hover:bg-blue-gray' : '',
                      ].join(' ')}
                    >
                      {cell.day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time + Passengers */}
              <div className="flex-1 min-w-[200px] flex flex-col gap-[18px]">
                <label className="block">
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">Heure de prise en charge</span>
                  <select className="input-field" value={form.time}
                    onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <div>
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-2">Passagers</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} type="button"
                        onClick={() => setForm(prev => ({ ...prev, passengers: n }))}
                        className={[
                          'w-10 h-10 rounded-[9px] border text-[14px] font-semibold transition-colors',
                          form.passengers === n
                            ? 'bg-navy text-white border-navy'
                            : 'border-blue-gray text-navy hover:border-navy',
                        ].join(' ')}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mode de course */}
          <div className="card px-[22px] py-[22px]">
            <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#8A94A6] mb-4">Mode de course</div>
            <div className="flex gap-3 flex-wrap mb-[18px]">
              {([
                { v: 'standard', label: 'Trajet simple', desc: 'Du point A au point B' },
                { v: 'dispo', label: 'Mise à disposition', desc: 'Chauffeur à votre service' },
              ] as const).map(m => (
                <button key={m.v} type="button"
                  onClick={() => setForm(prev => ({ ...prev, rideType: m.v }))}
                  className={[
                    'flex-1 min-w-[150px] p-4 rounded-xl border text-left transition-colors',
                    form.rideType === m.v
                      ? 'bg-navy text-white border-navy'
                      : 'border-blue-gray text-navy hover:border-navy',
                  ].join(' ')}>
                  <div className="text-[14px] font-semibold">{m.label}</div>
                  <div className={`text-[12px] mt-1 ${form.rideType === m.v ? 'text-white/60' : 'text-[#8A94A6]'}`}>{m.desc}</div>
                </button>
              ))}
            </div>

            {form.rideType === 'standard' ? (
              <div className="flex flex-col gap-[14px]">
                <label className="block">
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">Adresse de départ</span>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A7B0BF]" size={17} />
                    <input className="input-field pl-[38px]" placeholder="12 rue de la Paix, Paris"
                      value={form.pickupAddress}
                      onChange={e => setForm(prev => ({ ...prev, pickupAddress: e.target.value }))} />
                  </div>
                </label>
                <label className="block">
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">Adresse d'arrivée</span>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" size={17} />
                    <input className="input-field pl-[38px]" placeholder="Aéroport CDG, Terminal 2"
                      value={form.dropoffAddress}
                      onChange={e => setForm(prev => ({ ...prev, dropoffAddress: e.target.value }))} />
                  </div>
                </label>
                <div className="flex items-center gap-2.5 bg-[#EDF3FC] border border-[#D5E2F7] rounded-xl px-[14px] py-3">
                  <Route className="text-blue flex-shrink-0" size={18} />
                  <div className="flex-1">
                    <div className="text-[12px] text-[#5A6477]">Distance estimée (km)</div>
                    <input
                      className="text-[15px] font-bold text-navy w-full bg-transparent outline-none placeholder:text-[#A7B0BF] mt-0.5"
                      type="number" min="1" step="0.5" placeholder="Ex: 15"
                      value={form.distanceKm}
                      onChange={e => setForm(prev => ({ ...prev, distanceKm: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-[14px]">
                <label className="block">
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">Lieu de prise en charge</span>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A7B0BF]" size={17} />
                    <input className="input-field pl-[38px]" placeholder="Hôtel Le Bristol, Paris"
                      value={form.pickupAddress}
                      onChange={e => setForm(prev => ({ ...prev, pickupAddress: e.target.value }))} />
                  </div>
                </label>
                <label className="block max-w-[260px]">
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">Durée de mise à disposition</span>
                  <select className="input-field" value={form.dispoDuration}
                    onChange={e => setForm(prev => ({ ...prev, dispoDuration: e.target.value }))}>
                    {dispoTiers.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                {selectedTier && (
                  <div className="bg-[#FBF7EC] border border-[#EAD9A8] rounded-xl px-[18px] py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[14px] font-semibold text-navy">{selectedTier.label} de disponibilité</span>
                      <span className="text-[22px] font-bold text-[#9A7B2E]">{formatPrice(selectedTier.price)}</span>
                    </div>
                    <div className="text-[12px] text-[#9A7B2E] mt-1.5">
                      Kilomètres et carburant inclus
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Note */}
          <div className="card px-[22px] py-[22px]">
            <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#8A94A6] mb-3.5">
              Note <span className="font-normal normal-case tracking-normal">(optionnel)</span>
            </div>
            <textarea className="input-field resize-none" rows={3}
              placeholder="Bagages, animal, demande particulière…"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} />
          </div>

          {/* Privacy */}
          <label className="flex gap-2.5 items-start cursor-pointer px-1">
            <input type="checkbox" className="mt-0.5 w-[15px] h-[15px] accent-blue flex-shrink-0"
              checked={form.acceptPrivacy}
              onChange={e => setForm(prev => ({ ...prev, acceptPrivacy: e.target.checked }))} />
            <span className="text-[11px] text-[#8A94A6] leading-[1.5]">
              J'accepte que mes informations soient utilisées pour traiter ma réservation, conformément à la politique de confidentialité. Aucune donnée n'est partagée à des tiers.
            </span>
          </label>
        </div>

        {/* Right: Sticky recap */}
        <div className="flex-none basis-[330px] min-w-[290px] sticky top-[22px]">
          <div className="card px-6 py-6 shadow-[0_10px_36px_rgba(10,22,40,0.07)]">
            <div className="font-serif text-[19px] font-bold text-navy mb-1">Votre course</div>
            {isNight && (
              <div className="inline-block text-[11px] font-semibold text-[#9A7B2E] bg-[#FBF7EC] border border-[#EAD9A8] px-2 py-0.5 rounded mb-3.5">
                Tarif de nuit · +{nightPct}%
              </div>
            )}
            <div className="flex flex-col gap-[13px] my-4">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#5A6477]">
                  {form.rideType === 'standard' ? 'Distance' : 'Durée'}
                </span>
                <span className="text-[14px] font-semibold text-navy">{recapKm}</span>
              </div>
              {recapDur && (
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#5A6477]">Durée estimée</span>
                  <span className="text-[14px] font-semibold text-navy">{recapDur}</span>
                </div>
              )}
            </div>
            <div className="border-t border-blue-gray mb-4" />
            <div className="flex justify-between items-baseline">
              <span className="text-[14px] font-semibold text-navy">Total</span>
              <span className="text-[26px] font-bold text-gold tracking-[-0.01em]">
                {totalPrice !== null ? formatPrice(totalPrice) : '— €'}
              </span>
            </div>
            <div className="text-[11px] text-[#A7B0BF] mt-1.5 leading-[1.45]">
              Tarif tout compris — TVA non applicable, art. 293 B du CGI
            </div>
            <button
              onClick={doSubmit}
              disabled={!canSubmit}
              className={[
                'mt-5 w-full py-[14px] rounded-xl text-[14px] font-semibold tracking-[.02em] transition-colors',
                canSubmit
                  ? 'bg-navy text-white hover:bg-navy-light cursor-pointer'
                  : 'bg-[#E8EDF5] text-[#A7B0BF] cursor-not-allowed',
              ].join(' ')}>
              {submitting
                ? 'Envoi en cours…'
                : missingCount > 0
                  ? `${missingCount} champ${missingCount > 1 ? 's' : ''} manquant${missingCount > 1 ? 's' : ''}`
                  : 'Envoyer ma réservation →'}
            </button>
            {canSubmit && !submitting && (
              <div className="text-center text-[12px] text-green-500 mt-2.5 font-medium">Prêt à envoyer</div>
            )}
            {error && <div className="text-center text-[12px] text-red-500 mt-2.5">{error}</div>}
          </div>
        </div>
      </section>

      <footer className="bg-navy text-white/40 text-center py-5 text-[12px]">
        Service propulsé par D Embassy
      </footer>
    </div>
  )
}
