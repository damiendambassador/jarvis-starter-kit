'use client'

import { useEffect, useState } from 'react'
import { supabase, type Reservation } from '@/lib/supabase'
import { useDriver } from '../_context'
import { formatPrice } from '@/lib/pricing'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, MapPin, ClipboardList, Loader2, Trash2 } from 'lucide-react'

type Tab = 'all' | 'pending' | 'accepted' | 'refused' | 'completed'

const TABS: { key: Tab; label: string }[] = [
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

export default function ReservationsPage() {
  const driver = useDriver()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('admin_email'))
  }, [])

  async function load() {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('driver_id', driver.id)
      .order('scheduled_at', { ascending: false })
    setReservations(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [driver.id])

  async function updateStatus(id: string, status: 'accepted' | 'refused') {
    await supabase.from('reservations').update({ status }).eq('id', id)
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    fetch('/api/booking/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id, status }),
    }).catch(err => console.error('[status notify]', err))
  }

  async function deleteReservation(id: string) {
    const adminEmail    = localStorage.getItem('admin_email') ?? ''
    const adminPassword = localStorage.getItem('admin_password') ?? ''
    const res = await fetch('/api/admin/delete-reservation', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, adminPassword, reservationId: id }),
    })
    if (!res.ok) { alert('Suppression non autorisée.'); return }
    setReservations(prev => prev.filter(r => r.id !== id))
  }

  const filtered = tab === 'all' ? reservations : reservations.filter(r => r.status === tab)
  const countByTab = (t: Tab) => t === 'all' ? reservations.length : reservations.filter(r => r.status === t).length

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-navy" size={28} /></div>
  )

  return (
    <div>
      <h1 className="font-serif text-[28px] font-bold text-navy m-0 mb-5 tracking-[-0.01em]">Réservations</h1>

      {/* Tabs + count */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => {
            const count = countByTab(t.key)
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
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
        <div className="text-[13px] text-[#8A94A6]">{filtered.length} réservation(s)</div>
      </div>

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
            <button onClick={() => setConfirm(true)}
              title="Supprimer"
              className="p-2 rounded-[8px] text-[#C4CDDB] hover:text-red-400 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[#8A94A6]">Supprimer ?</span>
              <button onClick={onDelete}
                className="text-[12px] font-bold text-red-500 hover:text-red-700 transition-colors">
                Oui
              </button>
              <button onClick={() => setConfirm(false)}
                className="text-[12px] text-[#8A94A6] hover:text-navy transition-colors">
                Non
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
