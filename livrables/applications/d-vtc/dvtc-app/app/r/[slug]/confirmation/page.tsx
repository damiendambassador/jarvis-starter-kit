'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { supabase, type Reservation } from '@/lib/supabase'
import { formatPrice } from '@/lib/pricing'
import { CheckCircle, Copy, Check, Loader2, Share2, ShieldCheck, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import ViewSwitcher from '@/components/ViewSwitcher'
import { useLanguage } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function ConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const id = searchParams.get('id')

  const { lang, setLang, t, dateFnsLocale } = useLanguage()

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    supabase.rpc('get_reservation_by_id', { p_id: id }).single()
      .then(({ data }) => { setReservation(data as Reservation | null); setLoading(false) })
  }, [id])

  /* Mémorise le dernier trajet pour le rebooking en 1 clic (réduction de friction) */
  useEffect(() => {
    if (!reservation) return
    try {
      localStorage.setItem('dvtc_last_trip', JSON.stringify({
        rideType: reservation.ride_type,
        pickupAddress: reservation.pickup_address,
        dropoffAddress: reservation.dropoff_address ?? '',
        passengers: reservation.passengers,
      }))
    } catch { /* localStorage indisponible : on ignore */ }
  }, [reservation])

  function copyRefLink() {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareRefLink() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'D·VTC', text: t.referral_heading, url: refLink }).catch(() => {})
    } else {
      copyRefLink()
    }
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
    ? format(new Date(reservation.scheduled_at), t.date_format_long, { locale: dateFnsLocale })
    : '—'
  const typeLabel = reservation?.ride_type === 'standard' ? t.ride_standard : t.ride_dispo

  return (
    <div className="min-h-screen bg-cream flex flex-col animate-fade-in">

      {/* Header */}
      <header className="bg-navy text-white px-7 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[9px] bg-navy border border-gold/50 flex items-center justify-center flex-shrink-0">
            <span className="text-gold font-bold text-lg leading-none">D</span>
          </div>
          <div className="text-[11px] uppercase tracking-[.16em] text-gold font-semibold">D-VTC</div>
        </div>
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </header>

      <main className="flex-1 flex justify-center px-6 py-12">
        <div className="w-full max-w-[580px] flex flex-col gap-[18px]">

          {/* Confirmation card */}
          <div className="card p-[30px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-[50px] h-[50px] rounded-[11px] bg-gold flex items-center justify-center flex-shrink-0 animate-check-pop">
                <CheckCircle className="text-white" size={26} />
              </div>
              <h1 className="font-serif text-[32px] font-bold text-navy m-0 tracking-[-0.01em]">
                {t.confirm_title}
              </h1>
            </div>
            <p className="text-[15px] text-[#5A6477] mb-4 leading-[1.55]">
              {t.confirm_desc}
            </p>

            {/* Statut "client direct privilégié" (récompense identitaire) */}
            <div className="flex items-center gap-2.5 bg-[#F6F8FC] border border-blue-gray rounded-[10px] px-3.5 py-3 mb-6">
              <ShieldCheck size={18} className="text-gold-dark flex-shrink-0" />
              <div>
                <span className="text-[13px] font-bold text-navy">{t.direct_badge}</span>
                <span className="text-[13px] text-[#5A6477]"> · {t.direct_desc}</span>
              </div>
            </div>

            {reservation && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-[22px]">
                {[
                  { label: t.confirm_type,      value: typeLabel },
                  { label: t.confirm_date,      value: dateLabel },
                  { label: t.confirm_time,      value: format(new Date(reservation.scheduled_at), 'HH:mm') },
                  { label: t.confirm_passengers, value: `${reservation.passengers} ${reservation.passengers > 1 ? t.passenger_plural : t.passenger}` },
                  { label: t.confirm_pickup,    value: reservation.pickup_address },
                  { label: t.confirm_dropoff,   value: reservation.dropoff_address ?? '—' },
                  { label: t.confirm_distance,  value: reservation.distance_km ? `${reservation.distance_km} km` : '—' },
                  { label: t.confirm_fare,      value: reservation.price_estimate ? formatPrice(reservation.price_estimate) : '—', highlight: true },
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
                {t.confirm_ref} <span className="text-navy font-semibold font-mono">{ref}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => window.location.href = `/r/${slug}?rebook=1`}
                  className="flex items-center gap-2 bg-white text-navy border border-blue-gray rounded-xl px-[18px] py-[13px] text-[13px] font-semibold cursor-pointer hover:border-navy transition-colors">
                  <RotateCcw size={14} />
                  {t.confirm_rebook}
                </button>
                <button
                  onClick={() => window.location.href = `/r/${slug}`}
                  className="bg-navy text-white border-none rounded-xl px-[22px] py-[13px] text-[13px] font-semibold tracking-[.03em] cursor-pointer hover:bg-navy-light transition-colors">
                  {t.confirm_new_booking}
                </button>
              </div>
            </div>
          </div>

          {/* Referral card */}
          <div className="card p-[26px] border-[#C9A84C]">
            <div className="text-[11px] font-semibold tracking-[.14em] uppercase text-[#9A7B2E] mb-2.5">
              {t.referral_label}
            </div>
            <h2 className="font-serif text-[25px] font-bold text-navy m-0 mb-2">
              {t.referral_heading}
            </h2>
            <p className="text-[14px] text-[#5A6477] mb-[18px] leading-[1.55]">
              {t.referral_desc_before}{' '}
              <strong className="text-navy">{t.referral_discount}</strong>{' '}
              {t.referral_desc_after}
            </p>
            <div className="flex gap-2.5 flex-wrap items-center">
              <div className="flex-1 min-w-0 bg-[#F6F8FC] border border-blue-gray rounded-[9px] px-[14px] py-3 text-[13px] text-[#3A4456] font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                {refLink}
              </div>
              <button
                onClick={copyRefLink}
                className="flex items-center gap-2 bg-white text-navy border border-blue-gray rounded-[9px] px-[16px] py-3 text-[13px] font-semibold cursor-pointer hover:border-navy transition-colors">
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? t.btn_copied : t.btn_copy}
              </button>
              <button
                onClick={shareRefLink}
                className="flex items-center gap-2 bg-navy text-white border-none rounded-[9px] px-[18px] py-3 text-[13px] font-semibold cursor-pointer hover:bg-navy-light transition-colors">
                <Share2 size={15} />
                {t.btn_share}
              </button>
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-navy text-white/40 text-center py-[18px] text-[12px]">
        {t.footer}
      </footer>

      <ViewSwitcher current="client" driverSlug={slug} variant="float" />
    </div>
  )
}
