'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Driver, type Pricing } from '@/lib/supabase'
import { calculateStandardPrice, calculateDispoPrice, formatPrice } from '@/lib/pricing'
import {
  MapPin, Clock, Users, Car, ChevronRight, Star,
  Phone, Mail, User, FileText, ArrowRight, Loader2
} from 'lucide-react'

type RideType = 'standard' | 'dispo'

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
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    date: '',
    time: '10:00',
    passengers: 1,
    rideType: 'standard' as RideType,
    pickupAddress: '',
    dropoffAddress: '',
    distanceKm: '',
    notes: '',
    acceptPrivacy: false,
  })

  const [priceInfo, setPriceInfo] = useState<{
    total: number | null
    isNight: boolean
    isLoyal: boolean
    breakdown: string
  }>({ total: null, isNight: false, isLoyal: false, breakdown: '' })

  const missingFields = (() => {
    const required = ['firstName', 'lastName', 'phone', 'email', 'date', 'time', 'pickupAddress']
    if (form.rideType === 'standard') required.push('dropoffAddress', 'distanceKm')
    return required.filter(f => !form[f as keyof typeof form]).length
  })()

  useEffect(() => {
    async function fetchDriver() {
      const { data: driverData, error: driverErr } = await supabase
        .from('drivers')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (driverErr || !driverData) {
        setError('Chauffeur introuvable.')
        setLoading(false)
        return
      }

      const { data: pricingData } = await supabase
        .from('pricing')
        .select('*')
        .eq('driver_id', driverData.id)
        .single()

      setDriver(driverData)
      setPricing(pricingData)
      setLoading(false)
    }

    fetchDriver()
  }, [slug])

  useEffect(() => {
    if (!pricing || form.rideType !== 'standard') return
    const distance = parseFloat(form.distanceKm)
    if (!distance || !form.time) {
      setPriceInfo({ total: null, isNight: false, isLoyal: false, breakdown: '' })
      return
    }
    const hour = parseInt(form.time.split(':')[0])
    const result = calculateStandardPrice(pricing, distance, hour, false)
    setPriceInfo({
      total: result.total,
      isNight: result.isNight,
      isLoyal: false,
      breakdown: `Base ${formatPrice(result.base)} + ${distance} km × ${formatPrice(pricing.price_per_km)}${result.isNight ? ' + majoration nuit 30%' : ''}`,
    })
  }, [form.distanceKm, form.time, form.rideType, pricing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!driver || !form.acceptPrivacy) return
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
      price_estimate: priceInfo.total,
      status: 'pending',
    }

    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setSubmitting(false)
      return
    }

    // Envoyer les emails de notification
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_reservation',
        reservation,
        driverEmail: driver.email,
        driverName: driver.name,
      }),
    })

    router.push(`/r/${slug}/confirmation?id=${reservation.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-navy" size={32} />
      </div>
    )
  }

  if (error || !driver || !pricing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <p className="text-navy font-semibold text-lg">{error || 'Chauffeur introuvable.'}</p>
          <p className="text-gray-500 mt-2">Vérifiez le lien que vous avez reçu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gold font-medium uppercase tracking-widest mb-0.5">Service privé VTC</p>
            <h1 className="text-xl font-bold">{driver.name}</h1>
          </div>
          {driver.phone && (
            <a href={`tel:${driver.phone}`} className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
              <Phone size={15} />
              <span className="hidden sm:inline">{driver.phone}</span>
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="bg-navy text-white pb-10 pt-2">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Réservez votre chauffeur,<br />
            <span className="text-gold">en toute simplicité.</span>
          </h2>
          <p className="text-white/60 mt-3 text-sm">Un formulaire, une confirmation. Votre course est entre de bonnes mains.</p>
        </div>
      </section>

      {/* Tarifs */}
      <section className="bg-white border-b border-blue-gray">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Tarification</p>
          <h3 className="font-bold text-lg text-navy mb-4">Tarifs clairs, sans surprise</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-blue-gray rounded-lg p-4">
              <p className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1.5">
                <Car size={12} /> Trajets standards
              </p>
              <p className="font-bold text-navy text-sm">
                À partir de {formatPrice(pricing.base_fare)} + {formatPrice(pricing.price_per_km)}/km
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tarif jour 8h-20h. Majoration +{Math.round(pricing.night_surcharge * 100)}% avant 8h et après 20h
              </p>
            </div>
            <div className="border border-blue-gray rounded-lg p-4">
              <p className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1.5">
                <Clock size={12} /> Mise à disposition
              </p>
              <p className="font-bold text-navy text-sm">
                À partir de {formatPrice(pricing.dispo_2h)} pour 2h
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Journée complète {formatPrice(pricing.dispo_day)}. {pricing.km_included_dispo} km inclus
              </p>
            </div>
            <div className="border border-gold/30 bg-gold/5 rounded-lg p-4">
              <p className="text-xs font-medium text-gold mb-1 flex items-center gap-1.5">
                <Star size={12} /> Programme fidélité
              </p>
              <p className="font-bold text-navy text-sm">
                -{Math.round(pricing.loyalty_discount * 100)}% automatique
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Dès votre {pricing.loyalty_threshold}ème course effectuée
              </p>
            </div>
          </div>
          {driver.vehicle_model && (
            <p className="text-xs text-gray-400 mt-3">
              {driver.vehicle_model}{driver.vehicle_plate ? ` — ${driver.vehicle_plate}` : ''} —
              jusqu'à {driver.vehicle_capacity} passagers avec bagages
            </p>
          )}
        </div>
      </section>

      {/* Formulaire + Récapitulatif */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonne gauche : formulaire */}
          <div className="lg:col-span-2 space-y-6">

            {/* Coordonnées */}
            <div className="card p-6">
              <h4 className="font-semibold text-navy mb-4 flex items-center gap-2">
                <User size={16} /> Vos coordonnées
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="input-field" placeholder="Prénom" required
                  value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                <input className="input-field" placeholder="Nom" required
                  value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                <input className="input-field" type="tel" placeholder="Téléphone" required
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <input className="input-field" type="email" placeholder="Email" required
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>

            {/* Date, heure, passagers */}
            <div className="card p-6">
              <h4 className="font-semibold text-navy mb-4 flex items-center gap-2">
                <Clock size={16} /> Date et heure
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input className="input-field" type="date" required
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <select className="input-field" value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
                  {Array.from({ length: 48 }, (_, i) => {
                    const h = String(Math.floor(i / 2)).padStart(2, '0')
                    const m = i % 2 === 0 ? '00' : '30'
                    return `${h}:${m}`
                  }).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm text-gray-500 flex items-center gap-1.5"><Users size={14} /> Passagers</span>
                {[1, 2, 3, 4].map(n => (
                  <button key={n} type="button"
                    onClick={() => setForm(f => ({ ...f, passengers: n }))}
                    className={`w-9 h-9 rounded border text-sm font-medium transition-colors ${form.passengers === n ? 'bg-navy text-white border-navy' : 'border-blue-gray text-navy hover:border-navy'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode de course */}
            <div className="card p-6">
              <h4 className="font-semibold text-navy mb-4">Mode de course</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, rideType: 'standard' }))}
                  className={`p-4 rounded border text-left transition-colors ${form.rideType === 'standard' ? 'bg-navy text-white border-navy' : 'border-blue-gray hover:border-navy'}`}>
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Car size={14} /> Trajet simple
                  </p>
                  <p className={`text-xs mt-1 ${form.rideType === 'standard' ? 'text-white/60' : 'text-gray-400'}`}>
                    Du point A au point B
                  </p>
                </button>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, rideType: 'dispo' }))}
                  className={`p-4 rounded border text-left transition-colors ${form.rideType === 'dispo' ? 'bg-navy text-white border-navy' : 'border-blue-gray hover:border-navy'}`}>
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock size={14} /> Mise à disposition
                  </p>
                  <p className={`text-xs mt-1 ${form.rideType === 'dispo' ? 'text-white/60' : 'text-gray-400'}`}>
                    Chauffeur à votre disposition
                  </p>
                </button>
              </div>

              {form.rideType === 'standard' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={15} />
                    <input className="input-field pl-9" placeholder="Adresse de départ" required
                      value={form.pickupAddress} onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))} />
                  </div>
                  <div className="flex justify-center"><ArrowRight size={16} className="text-gray-300" /></div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-gold" size={15} />
                    <input className="input-field pl-9" placeholder="Adresse d'arrivée" required
                      value={form.dropoffAddress} onChange={e => setForm(f => ({ ...f, dropoffAddress: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Distance estimée (km)</label>
                    <input className="input-field" type="number" min="1" step="0.1" placeholder="ex: 15.5" required
                      value={form.distanceKm} onChange={e => setForm(f => ({ ...f, distanceKm: e.target.value }))} />
                    <p className="text-xs text-gray-400 mt-1">Utilisez Google Maps pour estimer la distance</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={15} />
                    <input className="input-field pl-9" placeholder="Lieu de prise en charge" required
                      value={form.pickupAddress} onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))} />
                  </div>
                  <div className="bg-gold/10 border border-gold/30 rounded p-3 text-sm text-navy">
                    Tarif : {formatPrice(pricing.dispo_2h)} pour 2h — {formatPrice(pricing.dispo_day)} journée complète
                    <br /><span className="text-xs text-gray-500">{pricing.km_included_dispo} km inclus</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="card p-6">
              <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">
                <FileText size={16} /> Note optionnelle
              </h4>
              <textarea className="input-field resize-none" rows={3}
                placeholder="Bagages, animal, demande particulière..."
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {/* Politique */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" required
                checked={form.acceptPrivacy} onChange={e => setForm(f => ({ ...f, acceptPrivacy: e.target.checked }))} />
              <span className="text-xs text-gray-500">
                J'accepte la politique de confidentialité et le traitement de mes données personnelles pour la gestion de ma réservation.
              </span>
            </label>
          </div>

          {/* Colonne droite : récapitulatif prix */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-6">
              <h4 className="font-semibold text-navy mb-4">Votre course</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1.5"><MapPin size={13} /> Distance</span>
                  <span>{form.distanceKm ? `${form.distanceKm} km` : '— km'}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1.5"><Clock size={13} /> Durée estimée</span>
                  <span>— min</span>
                </div>
                {priceInfo.total !== null && form.rideType === 'standard' && (
                  <div className="text-xs text-gray-400 pt-1 border-t border-blue-gray">
                    {priceInfo.breakdown}
                    {priceInfo.isNight && <span className="ml-1 text-amber-500">Nuit</span>}
                  </div>
                )}
              </div>
              <div className="border-t border-blue-gray mt-4 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">TOTAL</span>
                  <span className="text-2xl font-bold text-gold">
                    {form.rideType === 'standard'
                      ? (priceInfo.total !== null ? formatPrice(priceInfo.total) : '— €')
                      : `${formatPrice(pricing.dispo_2h)}+`}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Tarif tout compris — TVA non applicable, art. 293B du CGI</p>
              </div>

              <button type="submit" disabled={submitting || missingFields > 0 || !form.acceptPrivacy}
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours...</>
                  : missingFields > 0
                    ? `${missingFields} champ${missingFields > 1 ? 's' : ''} manquant${missingFields > 1 ? 's' : ''}`
                    : <><span>Envoyer ma réservation</span><ChevronRight size={16} /></>}
              </button>

              {error && <p className="text-red-500 text-xs mt-3 text-center">{error}</p>}
            </div>
          </div>
        </form>
      </section>

      <footer className="bg-navy text-white/40 text-xs text-center py-6 mt-4">
        Service propulsé par D Embassy — {driver.name}
      </footer>
    </div>
  )
}
