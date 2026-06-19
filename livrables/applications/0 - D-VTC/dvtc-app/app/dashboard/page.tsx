'use client'

import { useEffect, useState } from 'react'
import { supabase, type Reservation } from '@/lib/supabase'
import { useDriver } from './_context'
import { formatPrice } from '@/lib/pricing'
import { format, startOfWeek, startOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, MapPin, Loader2 } from 'lucide-react'

type Period = 'week' | 'month' | 'all'

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  pending:   { label: 'En attente', style: 'bg-amber-50 text-amber-700 border border-amber-200' },
  accepted:  { label: 'Acceptée',   style: 'bg-green-50 text-green-700 border border-green-200' },
  refused:   { label: 'Refusée',    style: 'bg-red-50 text-red-500 border border-red-200' },
  completed: { label: 'Terminée',   style: 'bg-[#EDF3FC] text-blue border border-[#D5E2F7]' },
}

function getPeriodStart(period: Period): Date | null {
  const now = new Date()
  if (period === 'week')  return startOfWeek(now, { weekStartsOn: 1 })
  if (period === 'month') return startOfMonth(now)
  return null
}

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Cette semaine', month: 'Ce mois', all: 'Tout',
}

export default function DashboardPage() {
  const driver = useDriver()
  const [all, setAll]       = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')

  async function loadData() {
    let q = supabase
      .from('reservations').select('*')
      .eq('driver_id', driver.id)
      .order('scheduled_at', { ascending: false })
    const { data } = await q
    setAll(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [driver.id])

  /* Filtrage côté client selon période */
  const start       = getPeriodStart(period)
  const reservations = start
    ? all.filter(r => new Date(r.created_at) >= start)
    : all

  const pending    = reservations.filter(r => r.status === 'pending')
  const completed  = reservations.filter(r => r.status === 'completed')
  const totalRevenue = completed.reduce((s, r) => s + (r.price_estimate ?? 0), 0)
  const uberSaved    = Math.round(totalRevenue * 0.28)
  const avgTicket    = completed.length > 0 ? totalRevenue / completed.length : 0

  async function updateStatus(id: string, status: 'accepted' | 'refused') {
    await supabase.from('reservations').update({ status }).eq('id', id)
    setAll(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-navy" size={28} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-[26px]">
        <div>
          <h1 className="font-serif text-[28px] font-bold text-navy m-0 tracking-[-0.01em]">Tableau de bord</h1>
          <p className="text-[14px] text-[#8A94A6] mt-1.5 m-0">Bienvenue, {driver.name}</p>
        </div>

        {/* Filtres période */}
        <div className="flex items-center gap-1.5 bg-white border border-[#E8EDF5] rounded-[10px] p-1">
          {(['week', 'month', 'all'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                'px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold transition-colors',
                period === p ? 'bg-navy text-white' : 'text-[#8A94A6] hover:text-navy',
              ].join(' ')}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3.5 overflow-x-auto pb-1.5 mb-[30px] items-stretch">
        {[
          { label: 'CA',              value: formatPrice(totalRevenue), style: 'text-[22px] font-bold text-gold' },
          { label: 'Éco. vs Uber',    value: formatPrice(uberSaved),    style: 'text-[22px] font-bold text-green-600', tooltip: 'Commission Uber/Bolt : 28%' },
          { label: 'Ticket moyen',    value: formatPrice(avgTicket),    style: 'text-[22px] font-bold text-navy' },
          { label: 'Terminées',       value: completed.length,          style: 'text-[22px] font-bold text-navy' },
          { label: 'En attente',      value: pending.length,            style: 'text-[22px] font-bold text-navy', badge: pending.length > 0 ? 'URGENT' : null },
          { label: 'Total',           value: reservations.length,       style: 'text-[22px] font-bold text-navy' },
        ].map(s => (
          <div key={s.label} className="flex-none basis-[150px] card px-5 py-4 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-1">
              <div className="text-[12px] text-[#8A94A6] font-medium">{s.label}</div>
              {'badge' in s && s.badge && (
                <span className="text-[10px] font-bold text-[#9A7B2E] bg-[#FBF7EC] border border-[#EAD9A8] px-1.5 py-0.5 rounded whitespace-nowrap">{s.badge}</span>
              )}
              {'tooltip' in s && s.tooltip && (
                <span title={s.tooltip} className="text-[10px] text-[#A7B0BF] cursor-help flex-shrink-0">ⓘ</span>
              )}
            </div>
            <div className={s.style}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Réservations en attente */}
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className="text-[16px] font-bold text-navy m-0">Réservations en attente</h2>
        {pending.length > 0 && (
          <span className="bg-red-500 text-white text-[11px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
            {pending.length}
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="bg-white border border-dashed border-[#D6DEEA] rounded-2xl px-12 py-12 text-center">
          <Calendar className="text-[#C4CDDB] mx-auto mb-3" size={34} />
          <div className="text-[14px] text-[#8A94A6]">Aucune réservation en attente</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {pending.map(r => (
            <PendingCard key={r.id} r={r}
              onAccept={() => updateStatus(r.id, 'accepted')}
              onRefuse={() => updateStatus(r.id, 'refused')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PendingCard({ r, onAccept, onRefuse }: { r: Reservation; onAccept: () => void; onRefuse: () => void }) {
  const dateLabel = format(new Date(r.scheduled_at), "EEE d MMM 'à' HH'h'mm", { locale: fr })
  const route     = r.dropoff_address ? `${r.pickup_address} → ${r.dropoff_address}` : r.pickup_address
  const typeStyle = r.ride_type === 'standard'
    ? 'bg-[#EDF3FC] text-blue border border-[#D5E2F7] text-[11px] font-semibold px-2 py-0.5 rounded-md'
    : 'bg-[#FBF7EC] text-[#9A7B2E] border border-[#EAD9A8] text-[11px] font-semibold px-2 py-0.5 rounded-md'

  return (
    <div className="card px-5 py-5 flex gap-[18px] flex-wrap items-start justify-between">
      <div className="flex-1 min-w-[240px]">
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          <span className="text-[15px] font-bold text-navy">{r.client_name}</span>
          <span className="text-[13px] text-[#8A94A6]">{r.client_phone}</span>
          <span className={typeStyle}>{r.ride_type === 'standard' ? 'Trajet simple' : 'Mise à dispo'}</span>
        </div>
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center gap-2.5 text-[13px] text-[#3A4456]">
            <Calendar className="text-[#A7B0BF]" size={15} />{dateLabel}
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-[#3A4456]">
            <MapPin className="text-[#A7B0BF]" size={15} />
            <span className="truncate max-w-[360px]">{route}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="text-right">
          <div className="text-[20px] font-bold text-gold">{r.price_estimate ? formatPrice(r.price_estimate) : '—'}</div>
          <div className="text-[12px] text-[#A7B0BF]">{r.passengers} pax</div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={onRefuse} className="border border-[#F0C0BA] bg-white text-red-500 px-4 py-2 rounded-[9px] text-[13px] font-semibold hover:bg-red-50 transition-colors">
            Refuser
          </button>
          <button onClick={onAccept} className="border-none bg-navy text-white px-[18px] py-2 rounded-[9px] text-[13px] font-semibold hover:bg-navy-light transition-colors">
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
