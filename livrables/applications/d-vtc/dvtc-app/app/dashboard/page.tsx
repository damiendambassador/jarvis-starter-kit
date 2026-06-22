'use client'

import { useEffect, useState } from 'react'
import { supabase, type Reservation } from '@/lib/supabase'
import { useDriver } from './_context'
import { formatPrice } from '@/lib/pricing'
import { format, startOfWeek, startOfMonth, addWeeks, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, MapPin, Loader2, ClipboardList, ArrowUpDown, Trash2 } from 'lucide-react'

type Period    = 'week' | 'month' | 'all' | 'next_week'
type StatusTab = 'all' | 'pending' | 'accepted' | 'refused' | 'completed'

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Cette semaine', month: 'Ce mois', all: 'Tout', next_week: 'Sem. prochaine',
}

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all',       label: 'Toutes' },
  { key: 'pending',   label: 'En attente' },
  { key: 'accepted',  label: 'Acceptées' },
  { key: 'completed', label: 'Terminées' },
  { key: 'refused',   label: 'Refusées' },
]

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  accepted:  'bg-green-50 text-green-700 border border-green-200',
  refused:   'bg-red-50 text-red-500 border border-red-200',
  completed: 'bg-[#EDF3FC] text-blue border border-[#D5E2F7]',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', accepted: 'Acceptée', refused: 'Refusée', completed: 'Terminée',
}

function getPeriodBounds(period: Period): { start: Date | null; end: Date | null } {
  const now = new Date()
  if (period === 'week')      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: null }
  if (period === 'month')     return { start: startOfMonth(now), end: null }
  if (period === 'next_week') {
    const next = addWeeks(now, 1)
    return { start: startOfWeek(next, { weekStartsOn: 1 }), end: endOfWeek(next, { weekStartsOn: 1 }) }
  }
  return { start: null, end: null }
}

export default function DashboardPage() {
  const driver = useDriver()
  const [all, setAll]           = useState<Reservation[]>([])
  const [loading, setLoading]   = useState(true)
  const [period, setPeriod]     = useState<Period>('month')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [sortByTicket, setSortByTicket] = useState(false)
  const [isAdmin, setIsAdmin]   = useState(false)

  useEffect(() => { setIsAdmin(!!localStorage.getItem('admin_token')) }, [])

  async function loadData() {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('driver_id', driver.id)
      .order('scheduled_at', { ascending: false })
    setAll(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [driver.id])

  async function updateStatus(id: string, status: 'accepted' | 'refused') {
    await supabase.from('reservations').update({ status }).eq('id', id)
    setAll(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    fetch('/api/booking/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id, status }),
    }).catch(() => {})
  }

  async function deleteReservation(id: string) {
    const adminToken = localStorage.getItem('admin_token') ?? ''
    const res = await fetch('/api/admin/delete-reservation', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, reservationId: id }),
    })
    if (!res.ok) { alert('Suppression non autorisée.'); return }
    setAll(prev => prev.filter(r => r.id !== id))
  }

  /* Stats : calculées sur la période sélectionnée (hors next_week, sans intérêt pour les stats) */
  const { start: statsStart } = getPeriodBounds(period === 'next_week' ? 'all' : period)
  const statsReservations = statsStart
    ? all.filter(r => new Date(r.created_at) >= statsStart)
    : all
  const pending   = statsReservations.filter(r => r.status === 'pending')
  const completed = statsReservations.filter(r => r.status === 'completed')
  const totalRevenue = completed.reduce((s, r) => s + (r.price_estimate ?? 0), 0)
  const uberSaved    = Math.round(totalRevenue * 0.28)
  const avgTicket    = completed.length > 0 ? totalRevenue / completed.length : 0

  /* Liste filtrée par période + statut + tri */
  const { start: listStart, end: listEnd } = getPeriodBounds(period)
  const filtered = all
    .filter(r => {
      if (!listStart) return true
      const d = new Date(period === 'next_week' ? r.scheduled_at : r.created_at)
      if (listEnd) return d >= listStart && d <= listEnd
      return d >= listStart
    })
    .filter(r => statusTab === 'all' || r.status === statusTab)
    .sort((a, b) => sortByTicket
      ? (b.price_estimate ?? 0) - (a.price_estimate ?? 0)
      : new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    )

  const countByTab = (t: StatusTab) =>
    t === 'all' ? all.length : all.filter(r => r.status === t).length

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
          {(['week', 'month', 'all', 'next_week'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
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
          { label: 'CA',           value: formatPrice(totalRevenue), style: 'text-[22px] font-bold text-gold' },
          { label: 'Éco. vs Uber', value: formatPrice(uberSaved),   style: 'text-[22px] font-bold text-green-600', tooltip: 'Commission Uber/Bolt : 28%' },
          { label: 'Ticket moyen', value: formatPrice(avgTicket),   style: 'text-[22px] font-bold text-navy' },
          { label: 'Terminées',    value: completed.length,         style: 'text-[22px] font-bold text-navy' },
          { label: 'En attente',   value: pending.length,           style: 'text-[22px] font-bold text-navy', badge: pending.length > 0 ? 'URGENT' : null },
          { label: 'Total',        value: statsReservations.length, style: 'text-[22px] font-bold text-navy' },
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

      {/* Barre filtres réservations */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(t => {
            const count  = countByTab(t.key)
            const active = statusTab === t.key
            return (
              <button key={t.key} onClick={() => setStatusTab(t.key)}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[13px] font-medium transition-colors',
                  active ? 'bg-navy text-white' : 'bg-white border border-blue-gray text-[#5A6477] hover:border-navy',
                ].join(' ')}>
                {t.label}
                {count > 0 && (
                  <span className={[
                    'text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1',
                    active ? 'bg-white/20 text-white' : 'bg-[#E8EDF5] text-[#5A6477]',
                  ].join(' ')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#8A94A6]">{filtered.length} réservation(s)</span>
          <button onClick={() => setSortByTicket(v => !v)}
            title={sortByTicket ? 'Tri par date' : 'Tri par ticket €'}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-colors',
              sortByTicket
                ? 'bg-gold/10 text-[#9A7B2E] border-gold/30'
                : 'bg-white border-[#E8EDF5] text-[#8A94A6] hover:border-navy hover:text-navy',
            ].join(' ')}>
            <ArrowUpDown size={13} />
            {sortByTicket ? 'Par ticket €' : 'Par date'}
          </button>
        </div>
      </div>

      {/* Liste réservations */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#D6DEEA] rounded-2xl px-12 py-12 text-center">
          <ClipboardList className="text-[#C4CDDB] mx-auto mb-3" size={34} />
          <div className="text-[14px] text-[#8A94A6]">Aucune réservation pour ce filtre</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filtered.map(r => (
            <ResCard key={r.id} r={r}
              onAccept={r.status === 'pending' ? () => updateStatus(r.id, 'accepted') : undefined}
              onRefuse={r.status === 'pending' ? () => updateStatus(r.id, 'refused') : undefined}
              onDelete={isAdmin ? () => deleteReservation(r.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ResCard({ r, onAccept, onRefuse, onDelete }: {
  r: Reservation
  onAccept?: () => void
  onRefuse?: () => void
  onDelete?: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const dateLabel = format(new Date(r.scheduled_at), "EEE d MMM yyyy 'à' HH'h'mm", { locale: fr })
  const route = r.dropoff_address ? `${r.pickup_address} → ${r.dropoff_address}` : r.pickup_address
  const typeStyle = r.ride_type === 'standard'
    ? 'bg-[#EDF3FC] text-blue border border-[#D5E2F7]'
    : 'bg-[#FBF7EC] text-[#9A7B2E] border border-[#EAD9A8]'

  return (
    <div className="card px-5 py-5 flex gap-[18px] flex-wrap items-start justify-between">
      <div className="flex-1 min-w-[240px]">
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          <span className="text-[15px] font-bold text-navy">{r.client_name}</span>
          <span className="text-[13px] text-[#8A94A6]">{r.client_phone}</span>
          <span className={`${STATUS_STYLE[r.status]} text-[11px] font-semibold px-2 py-0.5 rounded-md`}>
            {STATUS_LABEL[r.status]}
          </span>
          <span className={`${typeStyle} text-[11px] font-semibold px-2 py-0.5 rounded-md`}>
            {r.ride_type === 'standard' ? 'Trajet simple' : 'Mise à dispo'}
          </span>
        </div>
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center gap-2.5 text-[13px] text-[#3A4456]">
            <Calendar className="text-[#A7B0BF] flex-shrink-0" size={15} />
            {dateLabel}
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-[#3A4456]">
            <MapPin className="text-[#A7B0BF] flex-shrink-0" size={15} />
            <span className="truncate max-w-[400px]">{route}</span>
          </div>
          {r.notes && (
            <div className="text-[13px] text-[#8A94A6] italic pl-[23px]">{r.notes}</div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="text-right">
          <div className="text-[20px] font-bold text-gold">
            {r.price_estimate ? formatPrice(r.price_estimate) : '—'}
          </div>
          <div className="text-[12px] text-[#A7B0BF]">{r.passengers} pax</div>
        </div>
        <div className="flex gap-2.5 items-center">
          {onAccept && onRefuse && (
            <>
              <button onClick={onRefuse}
                className="border border-[#F0C0BA] bg-white text-red-500 px-4 py-2 rounded-[9px] text-[13px] font-semibold hover:bg-red-50 transition-colors">
                Refuser
              </button>
              <button onClick={onAccept}
                className="border-none bg-navy text-white px-[18px] py-2 rounded-[9px] text-[13px] font-semibold hover:bg-navy-light transition-colors">
                Accepter
              </button>
            </>
          )}
          {onDelete && (!confirm ? (
            <button onClick={() => setConfirm(true)} title="Supprimer"
              className="p-2 rounded-[8px] text-[#C4CDDB] hover:text-red-400 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[#8A94A6]">Supprimer ?</span>
              <button onClick={onDelete} className="text-[12px] font-bold text-red-500 hover:text-red-700 transition-colors">Oui</button>
              <button onClick={() => setConfirm(false)} className="text-[12px] text-[#8A94A6] hover:text-navy transition-colors">Non</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
