'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { supabase, type Reservation } from '@/lib/supabase'
import { formatPrice } from '@/lib/pricing'
import { CheckCircle, Clock, MapPin, Phone, Car, Calendar, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const id = searchParams.get('id')

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setReservation(data)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-navy" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-gold font-medium uppercase tracking-widest">Service privé VTC</p>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Confirmation checkmark */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-navy">Réservation envoyée</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Votre chauffeur va examiner votre demande et vous confirmer sous peu.
            </p>
          </div>

          {/* Récapitulatif */}
          {reservation && (
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-navy text-sm uppercase tracking-wide">Récapitulatif</h2>

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-sm font-medium text-navy">
                    {format(new Date(reservation.scheduled_at), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-0.5 shrink-0" size={16} />
                <div className="text-sm">
                  <p className="text-navy font-medium">{reservation.pickup_address}</p>
                  {reservation.dropoff_address && (
                    <p className="text-gray-400 mt-0.5">→ {reservation.dropoff_address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Car className="text-gray-400 shrink-0" size={16} />
                <p className="text-sm text-navy">
                  {reservation.ride_type === 'standard' ? 'Trajet simple' : 'Mise à disposition'} —
                  {reservation.passengers} passager{reservation.passengers > 1 ? 's' : ''}
                </p>
              </div>

              {reservation.price_estimate && (
                <div className="border-t border-blue-gray pt-4 flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">Estimation</span>
                  <span className="text-xl font-bold text-gold">{formatPrice(reservation.price_estimate)}</span>
                </div>
              )}
            </div>
          )}

          {/* Prochaines étapes */}
          <div className="mt-6 bg-navy/5 border border-navy/10 rounded-lg p-5">
            <h3 className="font-semibold text-navy text-sm mb-3 flex items-center gap-2">
              <Clock size={14} /> Prochaines étapes
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium shrink-0">1</span>
                Votre chauffeur examine votre demande
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium shrink-0">2</span>
                Vous recevez un email de confirmation
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium shrink-0">3</span>
                Le jour J, votre chauffeur est à l'heure
              </li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <a href={`/r/${slug}`} className="text-sm text-navy underline underline-offset-4 hover:text-gold transition-colors">
              Faire une nouvelle réservation
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-navy text-white/40 text-xs text-center py-5">
        Service propulsé par D Embassy
      </footer>
    </div>
  )
}
