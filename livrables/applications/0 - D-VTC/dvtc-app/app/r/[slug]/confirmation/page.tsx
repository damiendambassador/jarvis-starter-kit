'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { supabase, type Reservation } from '@/lib/supabase'
import { formatPrice } from '@/lib/pricing'
import { CheckCircle, Copy, Check, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import ViewSwitcher from '@/components/ViewSwitcher'

export default function ConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const id = searchParams.get('id')

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    supabase.rpc('get_reservation_by_id', { p_id: id }).single()
      .then(({ data }) => { setReservation(data as Reservation | null); setLoading(false) })
  }, [id])

  function copyRefLink() {
    const link = `${window.location.origin}/r/${slug}?ref=${id?.slice(0, 8).toUpperCase()}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1628]">
      <Loader2 className="animate-spin text-gold" size={32} />
    </div>
  )

  const ref = id?.slice(0, 8).toUpperCase() ?? '—'
  const refLink = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${slug}?ref=${ref}`
    : `/r/${slug}?ref=${ref}`

  const dateLabel = reservation
    ? format(new Date(reservation.scheduled_at), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })
    : '—'
  const typeLabel = reservation?.ride_type === 'standard' ? 'Trajet simple' : 'Mise à disposition'

  return (
    <div className="min-h-screen bg-cream flex flex-col animate-fade-in">

      {/* Header */}
      <header className="bg-navy text-white px-7 py-4 flex items-center gap-3">
        <div className="w-[38px] h-[38px] rounded-[9px] bg-navy border border-gold/50 flex items-center justify-center flex-shrink-0">
          <span className="text-gold font-bold text-lg leading-none">D</span>
        </div>
        <div className="text-[11px] uppercase tracking-[.16em] text-gold font-semibold">D-VTC</div>
      </header>

      <main className="flex-1 flex justify-center px-6 py-12">
        <div className="w-full max-w-[580px] flex flex-col gap-[18px]">

          {/* Confirmation card */}
          <div className="card p-[30px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-[50px] h-[50px] rounded-[11px] bg-gold flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-white" size={26} />
              </div>
              <h1 className="font-serif text-[32px] font-bold text-navy m-0 tracking-[-0.01em]">
                Réservation enregistrée
              </h1>
            </div>
            <p className="text-[15px] text-[#5A6477] mb-6 leading-[1.55]">
              Votre chauffeur vous confirme la course rapidement.
            </p>

            {reservation && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-[22px]">
                {[
                  { label: 'Type', value: typeLabel },
                  { label: 'Date', value: dateLabel },
                  { label: 'Heure', value: format(new Date(reservation.scheduled_at), 'HH:mm') },
                  { label: 'Passagers', value: `${reservation.passengers} passager${reservation.passengers > 1 ? 's' : ''}` },
                  { label: 'Départ', value: reservation.pickup_address },
                  { label: 'Arrivée', value: reservation.dropoff_address ?? '—' },
                  { label: 'Distance', value: reservation.distance_km ? `${reservation.distance_km} km` : '—' },
                  {
                    label: 'Tarif',
                    value: reservation.price_estimate ? formatPrice(reservation.price_estimate) : '—',
                    highlight: true,
                  },
                ].map(field => (
                  <div key={field.label}>
                    <div className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#8A94A6] mb-1.5">
                      {field.label}
                    </div>
                    <div className={field.highlight
                      ? 'font-serif text-[21px] font-bold text-gold'
                      : 'text-[15px] font-semibold text-navy'}>
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-blue-gray mt-6 pt-[18px] flex items-center justify-between gap-4 flex-wrap">
              <div className="text-[13px] text-[#8A94A6]">
                Référence : <span className="text-navy font-semibold font-mono">{ref}</span>
              </div>
              <button
                onClick={() => window.location.href = `/r/${slug}`}
                className="bg-navy text-white border-none rounded-xl px-[22px] py-[13px] text-[13px] font-semibold tracking-[.03em] cursor-pointer hover:bg-navy-light transition-colors">
                NOUVELLE RÉSERVATION
              </button>
            </div>
          </div>

          {/* Referral card */}
          <div className="card p-[26px] border-[#C9A84C]">
            <div className="text-[11px] font-semibold tracking-[.14em] uppercase text-[#9A7B2E] mb-2.5">
              Parrainage
            </div>
            <h2 className="font-serif text-[25px] font-bold text-navy m-0 mb-2">
              Recommandez D·VTC à un ami
            </h2>
            <p className="text-[14px] text-[#5A6477] mb-[18px] leading-[1.55]">
              Partagez votre lien personnel. Votre filleul obtient{' '}
              <strong className="text-navy">10 € de réduction</strong> sur sa première course.
            </p>
            <div className="flex gap-2.5 flex-wrap items-center">
              <div className="flex-1 min-w-0 bg-[#F6F8FC] border border-blue-gray rounded-[9px] px-[14px] py-3 text-[13px] text-[#3A4456] font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                {refLink}
              </div>
              <button
                onClick={copyRefLink}
                className="flex items-center gap-2 bg-navy text-white border-none rounded-[9px] px-[18px] py-3 text-[13px] font-semibold cursor-pointer hover:bg-navy-light transition-colors">
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-navy text-white/40 text-center py-[18px] text-[12px]">
        Service propulsé par D Embassy
      </footer>

      <ViewSwitcher current="client" driverSlug={slug} variant="float" />
    </div>
  )
}
