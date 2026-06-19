'use client'

import { useEffect, useState } from 'react'
import { supabase, type Reservation } from '@/lib/supabase'
import { useDriver } from './_context'
import { formatPrice } from '@/lib/pricing'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, MapPin, Download, Loader2 } from 'lucide-react'

type StatusBadge = { label: string; style: string }

const STATUS_BADGE: Record<string, StatusBadge> = {
  pending:   { label: 'En attente',  style: 'bg-amber-50 text-amber-700 border border-amber-200' },
  accepted:  { label: 'Acceptée',    style: 'bg-green-50 text-green-700 border border-green-200' },
  refused:   { label: 'Refusée',     style: 'bg-red-50 text-red-500 border border-red-200' },
  completed: { label: 'Terminée',    style: 'bg-[#EDF3FC] text-blue border border-[#D5E2F7]' },
}

export default function DashboardPage() {
  const driver = useDriver()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('driver_id', driver.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false })
    setReservations(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [driver.id])

  async function updateStatus(id: string, status: 'accepted' | 'refused') {
    await supabase.from('reservations').update({ status }).eq('id', id)
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    const reservation = reservations.find(r => r.id === id)
    if (reservation) {
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: status === 'accepted' ? 'reservation_accepted' : 'reservation_refused',
          reservation: { ...reservation, status },
          driverEmail: driver.email,
          driverName: driver.name,
        }),
      })
    }
  }

  const pending   = reservations.filter(r => r.status === 'pending')
  const completed = reservations.filter(r => r.status === 'completed')
  const totalRevenue = completed.reduce((s, r) => s + (r.price_estimate ?? 0), 0)

  const stats = [
    { label: 'CA ce mois', value: formatPrice(totalRevenue), valueStyle: 'text-[22px] font-bold text-gold mt-2' },
    { label: 'Courses terminées', value: completed.length, valueStyle: 'text-[22px] font-bold text-navy mt-2' },
    { label: 'En attente', value: pending.length, valueStyle: 'text-[22px] font-bold text-navy mt-2', badge: pending.length > 0 ? 'URGENT' : null },
    { label: 'Total ce mois', value: reservations.length, valueStyle: 'text-[22px] font-bold text-navy mt-2' },
  ]

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
          <h1 className="font-serif text-[28px] font-bold text-navy m-0 tracking-[-0.01em]">
            Tableau de bord
          </h1>
          <p className="text-[14px] text-[#8A94A6] mt-1.5 m-0">Bienvenue, {driver.name}</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-[#D6DEEA] text-navy px-4 py-2.5 rounded-[9px] text-[13px] font-semibold hover:bg-cream transition-colors">
          <Download size={16} />
          Exporter le mois
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3.5 overflow-x-auto pb-1.5 mb-[30px]">
        {stats.map(s => (
          <div key={s.label} className="flex-none basis-[175px] card px-5 py-5">
            <div className="flex items-center justify-between">
              <div className="text-[12px] text-[#8A94A6] font-medium">{s.label}</div>
              {s.badge && (
                <span className="text-[10px] font-bold text-[#9A7B2E] bg-[#FBF7EC] border border-[#EAD9A8] px-1.5 py-0.5 rounded">
                  {s.badge}
                </span>
              )}
            </div>
            <div className={s.valueStyle}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pending reservations */}
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
            <PendingCard key={r.id} r={r} onAccept={() => updateStatus(r.id, 'accepted')} onRefuse={() => updateStatus(r.id, 'refused')} />
          ))}
        </div>
      )}
    </div>
  )
}

function PendingCard({ r, onAccept, onRefuse }: { r: Reservation; onAccept: () => void; onRefuse: () => void }) {
  const dateLabel = format(new Date(r.scheduled_at), "EEE d MMM 'à' HH'h'mm", { locale: fr })
  const route = r.dropoff_address ? `${r.pickup_address} → ${r.dropoff_address}` : r.pickup_address
  const typeStyle = r.ride_type === 'standard'
    ? 'bg-[#EDF3FC] text-blue border border-[#D5E2F7] text-[11px] font-semibold px-2 py-0.5 rounded-md'
    : 'bg-[#FBF7EC] text-[#9A7B2E] border border-[#EAD9A8] text-[11px] font-semibold px-2 py-0.5 rounded-md'
  const typeLabel = r.ride_type === 'standard' ? 'Trajet simple' : 'Mise à dispo'

  return (
    <div className="card px-5 py-5 flex gap-[18px] flex-wrap items-start justify-between">
      <div className="flex-1 min-w-[240px]">
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          <span className="text-[15px] font-bold text-navy">{r.client_name}</span>
          <span className="text-[13px] text-[#8A94A6]">{r.client_phone}</span>
          <span className={typeStyle}>{typeLabel}</span>
        </div>
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center gap-2.5 text-[13px] text-[#3A4456]">
            <Calendar className="text-[#A7B0BF]" size={15} />
            {dateLabel}
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-[#3A4456]">
            <MapPin className="text-[#A7B0BF]" size={15} />
            <span className="truncate max-w-[360px]">{route}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="text-right">
          <div className="text-[20px] font-bold text-gold">
            {r.price_estimate ? formatPrice(r.price_estimate) : '—'}
          </div>
          <div className="text-[12px] text-[#A7B0BF]">{r.passengers} pax</div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={onRefuse}
            className="border border-[#F0C0BA] bg-white text-red-500 px-4 py-2 rounded-[9px] text-[13px] font-semibold hover:bg-red-50 transition-colors">
            Refuser
          </button>
          <button onClick={onAccept}
            className="border-none bg-navy text-white px-[18px] py-2 rounded-[9px] text-[13px] font-semibold hover:bg-navy-light transition-colors">
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
