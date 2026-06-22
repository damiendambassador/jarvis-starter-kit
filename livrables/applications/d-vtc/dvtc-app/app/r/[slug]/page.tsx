'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Driver, type Pricing, type Unavailability } from '@/lib/supabase'
import { calculateStandardPrice, formatPrice, isNightHour } from '@/lib/pricing'
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [distanceLoading, setDistanceLoading] = useState(false)
  const [distanceError, setDistanceError] = useState<string | null>(null)
  const [returningUser, setReturningUser] = useState<string | null>(null)
  const [dateUnavails, setDateUnavails] = useState<Unavailability[]>([])

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

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isToday = form.date === todayStr
  const nowHHMM = useMemo(() => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  }, [form.date])
  const minTime = isToday ? nowHHMM : undefined
  const availableSlots = isToday ? TIME_SLOTS.filter(t => t > nowHHMM) : TIME_SLOTS

  useEffect(() => {
    if (isToday && form.time <= nowHHMM) {
      setForm(prev => ({ ...prev, time: availableSlots[0] ?? '10:00' }))
    }
  }, [form.date])

  const dispoTiers = useMemo(() => pricing ? buildDispoTiers(pricing) : [], [pricing])
  const selectedTier = dispoTiers.find(t => t.value === form.dispoDuration) ?? dispoTiers[0]

  const hour = parseInt(form.time.split(':')[0])
  const isNight = pricing ? isNightHour(pricing, hour) : (hour < 8 || hour >= 20)

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

  const FIELD_LABELS: Partial<Record<keyof typeof form, string>> = {
    firstName: 'Prénom',
    lastName: 'Nom',
    phone: 'Téléphone',
    email: 'Email',
    date: 'Date',
    pickupAddress: form.rideType === 'standard' ? 'Adresse de départ' : 'Lieu de prise en charge',
    dropoffAddress: 'Adresse d\'arrivée',
    distanceKm: 'Distance',
  }

  // Chargement des indisponibilités à chaque changement de date
  useEffect(() => {
    if (!form.date || !driver) { setDateUnavails([]); return }
    supabase.from('unavailabilities')
      .select('*')
      .eq('driver_id', driver.id)
      .eq('date', form.date)
      .then(({ data }) => setDateUnavails(data ?? []))
  }, [form.date, driver?.id])

  // Conflit : l'heure choisie tombe dans un créneau bloqué
  const timeConflict = useMemo(() => {
    if (!form.time) return null
    const [h, m] = form.time.split(':').map(Number)
    const t = h * 60 + m
    return dateUnavails.find(u => {
      const [sh, sm] = u.start_time.split(':').map(Number)
      const [eh, em] = u.end_time.split(':').map(Number)
      return t >= sh * 60 + sm && t < eh * 60 + em
    }) ?? null
  }, [form.time, dateUnavails])

  const requiredFields: (keyof typeof form)[] = [
    'firstName', 'lastName', 'phone', 'email', 'date', 'pickupAddress',
    ...(form.rideType === 'standard' ? ['dropoffAddress', 'distanceKm'] as const : []),
  ]
  const missingFields = [
    ...requiredFields.filter(f => !form[f]).map(f => FIELD_LABELS[f] ?? f),
    ...(!form.acceptPrivacy ? ['Politique de confidentialité'] : []),
  ]
  const missingCount = missingFields.length
  const canSubmit = missingCount === 0 && !submitting && !timeConflict

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dvtc_client_info')
      if (saved) {
        const { firstName, lastName, phone, email } = JSON.parse(saved)
        setForm(prev => ({ ...prev, firstName, lastName, phone, email }))
        setReturningUser(firstName)
      }
    } catch {}
  }, [])

  useEffect(() => {
    supabase.from('drivers').select('*').eq('slug', slug).eq('is_active', true).single()
      .then(({ data, error: e }) => {
        if (e || !data) { setLoadError('Chauffeur introuvable.'); setLoading(false); return }
        supabase.from('pricing').select('*').eq('driver_id', data.id).single()
          .then(({ data: p }) => { setDriver(data); setPricing(p); setLoading(false) })
      })
  }, [slug])

  const distanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (form.rideType !== 'standard') return
    if (form.pickupAddress.length < 5 || form.dropoffAddress.length < 5) return
    if (distanceTimer.current) clearTimeout(distanceTimer.current)
    distanceTimer.current = setTimeout(async () => {
      setDistanceLoading(true)
      setDistanceError(null)
      try {
        const geocode = async (address: string) => {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
            headers: { 'Accept-Language': 'fr' }
          })
          const data = await res.json()
          if (!data[0]) throw new Error()
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        }
        const [from, to] = await Promise.all([geocode(form.pickupAddress), geocode(form.dropoffAddress)])
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`)
        const data = await res.json()
        const km = Math.round(data.routes[0].distance / 100) / 10
        setForm(prev => ({ ...prev, distanceKm: String(km) }))
      } catch {
        setDistanceError('Distance non trouvée. Entrez-la manuellement.')
      } finally {
        setDistanceLoading(false)
      }
    }, 1000)
  }, [form.pickupAddress, form.dropoffAddress, form.rideType])

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
    const { data: reservationId, error: insertError } = await supabase.rpc('create_reservation', {
      p_driver_id:      payload.driver_id,
      p_client_name:    payload.client_name,
      p_client_phone:   payload.client_phone,
      p_client_email:   payload.client_email,
      p_ride_type:      payload.ride_type,
      p_pickup_address: payload.pickup_address,
      p_dropoff_address: payload.dropoff_address ?? null,
      p_distance_km:    payload.distance_km ?? null,
      p_scheduled_at:   payload.scheduled_at,
      p_passengers:     payload.passengers,
      p_notes:          payload.notes ?? null,
      p_price_estimate: payload.price_estimate ?? null,
      p_status:         payload.status,
    })
    if (insertError) {
      setSubmitError(`Erreur : ${insertError.message}`)
      setSubmitting(false)
      return
    }
    // Mémoriser les infos client pour la prochaine visite
    try {
      localStorage.setItem('dvtc_client_info', JSON.stringify({
        firstName: form.firstName, lastName: form.lastName,
        phone: form.phone, email: form.email,
      }))
    } catch {}

    // Envoyer les emails + enregistrer le client côté serveur (awaité pour éviter l'annulation)
    try {
      await fetch('/api/booking/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      })
    } catch (err) {
      console.error('[notify]', err)
    }

    router.push(`/r/${slug}/confirmation?id=${reservationId}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Loader2 className="animate-spin text-navy" size={32} />
    </div>
  )

  if (loadError || !driver || !pricing) return (
    <div className="min-h-screen flex items-center justify-center bg-cream text-center px-4">
      <div>
        <p className="text-navy font-semibold text-lg">{loadError ?? 'Chauffeur introuvable.'}</p>
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
        {driver.vehicle_model && (
          <div className="mt-5 inline-flex items-center gap-2.5 bg-white/10 border border-white/15 px-4 py-2 rounded-full text-[13px] text-white/75">
            <Car size={13} className="text-gold flex-shrink-0" />
            <span>{driver.vehicle_model}</span>
            {driver.vehicle_plate && (
              <span className="text-white/50">· {driver.vehicle_plate}</span>
            )}
            {driver.vehicle_capacity && (
              <span className="text-white/40">· {driver.vehicle_capacity} passager{driver.vehicle_capacity > 1 ? 's' : ''}</span>
            )}
          </div>
        )}
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
            {pricing.night_surcharge_enabled !== false && (
              <div className="text-[12px] text-[#8A94A6] mt-2">
                Majoration nuit +{nightPct}% ({String(pricing.night_start_hour ?? 20).padStart(2, '0')}h–{String(pricing.night_end_hour ?? 8).padStart(2, '0')}h)
              </div>
            )}
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

          {/* Returning user greeting */}
          {returningUser && (
            <div className="flex items-center justify-between gap-3 bg-[#FBF7EC] border border-[#EAD9A8] rounded-2xl px-5 py-4">
              <div>
                <div className="text-[15px] font-bold text-[#9A7B2E]">Bon retour, {returningUser} !</div>
                <div className="text-[12px] text-[#9A7B2E]/80 mt-0.5">Vos coordonnées sont prêtes, il ne reste qu'à choisir votre course.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReturningUser(null)
                  setForm(prev => ({ ...prev, firstName: '', lastName: '', phone: '', email: '' }))
                  localStorage.removeItem('dvtc_client_info')
                }}
                className="text-[12px] text-[#9A7B2E] underline underline-offset-2 hover:opacity-70 transition-opacity flex-shrink-0"
              >
                Ce n'est pas moi
              </button>
            </div>
          )}

          {/* Coordonnées */}
          <div className="card px-[22px] py-[22px]">
            <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#8A94A6] mb-4">Vos coordonnées</div>
            <div className="grid grid-cols-2 gap-[14px]">
              {([
                { name: 'firstName', label: 'Prénom', placeholder: 'Jean' },
                { name: 'lastName', label: 'Nom', placeholder: 'Dupont' },
                { name: 'phone', label: 'Téléphone', placeholder: '06 12 34 56 78', type: 'tel' },
                { name: 'email', label: 'Email', placeholder: 'jean@email.com', type: 'email' },
              ] as { name: 'firstName' | 'lastName' | 'phone' | 'email'; label: string; placeholder: string; type?: string }[]).map(f => (
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
                        ...prev, date: format(cell.date!, 'yyyy-MM-dd')
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
                  <input
                    type="time"
                    className="input-field"
                    value={form.time}
                    min={minTime}
                    list="time-slots-list"
                    onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                  <datalist id="time-slots-list">
                    {availableSlots.map(t => <option key={t} value={t} />)}
                  </datalist>
                  {timeConflict && (
                    <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <span className="text-red-400 text-[15px] flex-shrink-0 mt-[1px]">⊘</span>
                      <div>
                        <div className="text-[12px] font-semibold text-red-600">Créneau indisponible</div>
                        <div className="text-[11px] text-red-400 mt-0.5">
                          Le chauffeur est indisponible de {timeConflict.start_time.slice(0,5)} à {timeConflict.end_time.slice(0,5)}
                          {timeConflict.label !== 'Indisponible' ? ` (${timeConflict.label})` : ''}.
                          Choisissez une autre heure.
                        </div>
                      </div>
                    </div>
                  )}
                  {!timeConflict && dateUnavails.length > 0 && (
                    <div className="mt-2 text-[11px] text-[#8A94A6] leading-[1.5]">
                      Créneaux bloqués ce jour : {dateUnavails.map(u => `${u.start_time.slice(0,5)}–${u.end_time.slice(0,5)}`).join(', ')}
                    </div>
                  )}
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
          <div className="card px-[22px] py-[22px] max-w-xs">
            <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#8A94A6] mb-3.5">
              Note <span className="font-normal normal-case tracking-normal">(optionnel)</span>
            </div>
            <textarea className="input-field resize-none" rows={2}
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
              {submitting ? 'Envoi en cours…' : 'Envoyer ma réservation →'}
            </button>
            {!submitting && timeConflict && (
              <div className="mt-3 text-[12px] text-red-500 font-medium">
                Créneau indisponible — choisissez une autre heure.
              </div>
            )}
            {!submitting && !timeConflict && missingCount > 0 && (
              <div className="mt-3 text-[12px] text-[#8A94A6] leading-[1.6]">
                {missingCount <= 3
                  ? <>Manquant : <span className="font-semibold text-[#5A6477]">{missingFields.join(', ')}</span></>
                  : <>{missingCount} informations manquantes à compléter.</>
                }
              </div>
            )}
            {canSubmit && !submitting && (
              <div className="text-center text-[12px] text-green-500 mt-2.5 font-medium">Prêt à envoyer</div>
            )}
            {submitError && <div className="text-[12px] text-red-500 mt-2.5 leading-[1.5]">{submitError}</div>}
          </div>
        </div>
      </section>

      <footer className="bg-navy text-white/40 text-center py-5 text-[12px]">
        Service propulsé par D Embassy
      </footer>

    </div>
  )
}
