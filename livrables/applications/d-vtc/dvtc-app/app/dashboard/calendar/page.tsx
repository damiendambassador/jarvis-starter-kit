'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase, type Reservation, type Unavailability } from '@/lib/supabase'
import { useDriver } from '../_context'
import { formatPrice } from '@/lib/pricing'
import {
  format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isSameDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react'

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

const STATUS: Record<string, { dot: string; label: string; pill: string }> = {
  pending:   { dot: 'bg-amber-400', label: 'En attente',  pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted:  { dot: 'bg-green-500', label: 'Acceptée',    pill: 'bg-green-50 text-green-700 border-green-200' },
  completed: { dot: 'bg-blue',      label: 'Terminée',    pill: 'bg-[#EDF3FC] text-blue border-[#D5E2F7]' },
  refused:   { dot: 'bg-red-400',   label: 'Refusée',     pill: 'bg-red-50 text-red-500 border-red-200' },
}

const EVENT_BG: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  accepted:  'bg-green-50 text-green-700',
  completed: 'bg-[#EDF3FC] text-blue',
  refused:   'bg-red-50 text-red-400',
}

export default function CalendarPage() {
  const driver = useDriver()
  const [viewDate, setViewDate]         = useState(() => new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [unavails, setUnavails]         = useState<Unavailability[]>([])
  const [loading, setLoading]           = useState(true)
  const [detail, setDetail]             = useState<Reservation | null>(null)
  const [addDate, setAddDate]           = useState<Date | null>(null)
  const [unavailForm, setUnavailForm]   = useState({ startTime: '09:00', endTime: '17:00', label: 'Indisponible' })
  const [saving, setSaving]             = useState(false)

  useEffect(() => {
    const year  = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const from  = new Date(year, month, 1).toISOString()
    const to    = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    const dFrom = format(new Date(year, month, 1), 'yyyy-MM-dd')
    const dTo   = format(new Date(year, month + 1, 0), 'yyyy-MM-dd')
    setLoading(true)
    Promise.all([
      supabase.from('reservations')
        .select('*').eq('driver_id', driver.id)
        .gte('scheduled_at', from).lte('scheduled_at', to),
      supabase.from('unavailabilities')
        .select('*').eq('driver_id', driver.id)
        .gte('date', dFrom).lte('date', dTo),
    ]).then(([{ data: res }, { data: u }]) => {
      setReservations(res ?? [])
      setUnavails(u ?? [])
      setLoading(false)
    })
  }, [driver.id, viewDate.getMonth(), viewDate.getFullYear()])

  // Écoute les suppressions en temps réel (admin depuis la vue Réservations)
  useEffect(() => {
    const channel = supabase
      .channel(`calendar-deletes-${driver.id}`)
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reservations', filter: `driver_id=eq.${driver.id}` },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setReservations(prev => prev.filter(r => r.id !== deletedId))
          setDetail(prev => prev?.id === deletedId ? null : prev)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [driver.id])

  const cells = useMemo(() => {
    const year  = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let offset  = getDay(startOfMonth(viewDate)) - 1
    if (offset < 0) offset = 6
    const days = getDaysInMonth(viewDate)
    type Cell = {
      day: number | null; date: Date | null; isToday: boolean
      events: Reservation[]; blocks: Unavailability[]
    }
    const result: Cell[] = []
    for (let i = 0; i < offset; i++)
      result.push({ day: null, date: null, isToday: false, events: [], blocks: [] })
    for (let d = 1; d <= days; d++) {
      const date    = new Date(year, month, d)
      const dateStr = format(date, 'yyyy-MM-dd')
      result.push({
        day: d, date, isToday: isSameDay(date, today),
        events: reservations.filter(r => isSameDay(new Date(r.scheduled_at), date)),
        blocks: unavails.filter(u => u.date === dateStr),
      })
    }
    return result
  }, [viewDate, reservations, unavails])

  async function updateStatus(id: string, status: 'accepted' | 'refused' | 'pending' | 'completed') {
    await supabase.from('reservations').update({ status }).eq('id', id)
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setDetail(prev => prev?.id === id ? { ...prev, status } : prev)
    if (status === 'pending') return
    const reservation = reservations.find(r => r.id === id)
    if (reservation && (status === 'accepted' || status === 'refused')) {
      fetch('/api/booking/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id, status }),
      }).catch(err => console.error('[calendar status notify]', err))
    }
  }

  async function addUnavail() {
    if (!addDate) return
    setSaving(true)
    const { data } = await supabase.from('unavailabilities').insert({
      driver_id:  driver.id,
      date:       format(addDate, 'yyyy-MM-dd'),
      start_time: unavailForm.startTime,
      end_time:   unavailForm.endTime,
      label:      unavailForm.label || 'Indisponible',
    }).select().single()
    if (data) setUnavails(prev => [...prev, data])
    setSaving(false)
    setAddDate(null)
    setUnavailForm({ startTime: '09:00', endTime: '17:00', label: 'Indisponible' })
  }

  async function deleteUnavail(id: string) {
    await supabase.from('unavailabilities').delete().eq('id', id)
    setUnavails(prev => prev.filter(u => u.id !== id))
  }

  return (
    <div>
      <h1 className="font-serif text-[28px] font-bold text-navy m-0 mb-5 tracking-[-0.01em]">Calendrier</h1>

      <div className="card px-[22px] py-[22px]">
        {/* Nav */}
        <div className="flex items-center justify-center gap-[18px] mb-[18px]">
          <button onClick={() => setViewDate(d => subMonths(d, 1))}
            className="w-[34px] h-[34px] border border-blue-gray bg-white rounded-[9px] flex items-center justify-center text-[#5A6477] hover:border-navy transition-colors">
            <ChevronLeft size={17} />
          </button>
          <div className="text-[17px] font-bold text-navy min-w-[150px] text-center capitalize">
            {format(viewDate, 'MMMM yyyy', { locale: fr })}
          </div>
          <button onClick={() => setViewDate(d => addMonths(d, 1))}
            className="w-[34px] h-[34px] border border-blue-gray bg-white rounded-[9px] flex items-center justify-center text-[#5A6477] hover:border-navy transition-colors">
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="text-center text-[11px] font-semibold text-[#A7B0BF] uppercase tracking-[.05em] py-1">{wd}</div>
          ))}
        </div>

        {/* Cells */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-navy" size={24} /></div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell, i) => (
              <div key={i}
                className={[
                  'min-h-[90px] rounded-xl p-1.5 border transition-colors relative group',
                  !cell.day ? 'invisible' : '',
                  cell.isToday ? 'bg-[#EDF3FC] border-[#D5E2F7]' : 'bg-white border-blue-gray hover:border-[#C4CDDB]',
                ].join(' ')}>
                {cell.day && (
                  <>
                    <div className="flex items-start justify-between mb-1">
                      <span className={[
                        'text-[12px] font-bold pl-0.5',
                        cell.isToday ? 'text-blue' : 'text-[#5A6477]',
                      ].join(' ')}>
                        {cell.day}
                      </span>
                      <button
                        onClick={() => {
                          setAddDate(cell.date!)
                          setUnavailForm({ startTime: '09:00', endTime: '17:00', label: 'Indisponible' })
                        }}
                        title="Bloquer un créneau"
                        className="opacity-0 group-hover:opacity-100 w-[18px] h-[18px] rounded flex items-center justify-center text-[#A7B0BF] hover:text-navy hover:bg-[#F0F3F8] transition-all flex-shrink-0">
                        <Plus size={11} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-[3px]">
                      {/* Blocs d'indisponibilité */}
                      {cell.blocks.map(b => (
                        <div key={b.id}
                          className="flex items-center justify-between gap-1 bg-[#F0F3F8] rounded px-1.5 py-0.5 group/b">
                          <span className="text-[10px] text-[#8A94A6] font-medium truncate">
                            {b.start_time.slice(0,5)}–{b.end_time.slice(0,5)}
                          </span>
                          <button onClick={() => deleteUnavail(b.id)}
                            className="opacity-0 group-hover/b:opacity-100 text-red-400 hover:text-red-600 transition-all flex-shrink-0">
                            <X size={9} />
                          </button>
                        </div>
                      ))}

                      {/* Réservations */}
                      {cell.events.slice(0, 3).map(ev => (
                        <button key={ev.id} onClick={() => setDetail(ev)}
                          className={[
                            'w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded truncate',
                            EVENT_BG[ev.status] ?? '',
                          ].join(' ')}>
                          {format(new Date(ev.scheduled_at), 'HH:mm')} {ev.client_name.split(' ')[0]}
                        </button>
                      ))}
                      {cell.events.length > 3 && (
                        <div className="text-[10px] text-[#8A94A6] pl-1">+{cell.events.length - 3}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex gap-[18px] flex-wrap mt-[18px] items-center">
        {Object.entries(STATUS).map(([key, { dot, label }]) => (
          <div key={key} className="flex items-center gap-2 text-[12px] text-[#5A6477]">
            <span className={`${dot} w-3 h-3 rounded-full flex-shrink-0`} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-2 text-[12px] text-[#5A6477]">
          <span className="w-3 h-3 rounded flex-shrink-0 bg-[#E8EDF5]" />
          Indisponible
        </div>
      </div>

      {/* Modal détail réservation */}
      {detail && (
        <div className="fixed inset-0 bg-navy/40 z-50 flex items-center justify-center px-4"
          onClick={() => setDetail(null)}>
          <div className="card max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[16px] font-bold text-navy">{detail.client_name}</div>
                <div className="text-[13px] text-[#8A94A6] mt-1">{detail.client_phone}</div>
              </div>
              <button onClick={() => setDetail(null)} className="text-[#A7B0BF] hover:text-navy transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-[13px] text-[#3A4456] mb-5">
              <div>
                <span className="text-[#8A94A6]">Date : </span>
                {format(new Date(detail.scheduled_at), "EEE d MMM 'à' HH'h'mm", { locale: fr })}
              </div>
              <div><span className="text-[#8A94A6]">Départ : </span>{detail.pickup_address}</div>
              {detail.dropoff_address && (
                <div><span className="text-[#8A94A6]">Arrivée : </span>{detail.dropoff_address}</div>
              )}
              {detail.price_estimate && (
                <div>
                  <span className="text-[#8A94A6]">Tarif : </span>
                  <span className="font-bold text-gold">{formatPrice(detail.price_estimate)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[#8A94A6]">Statut : </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${STATUS[detail.status]?.pill ?? ''}`}>
                  {STATUS[detail.status]?.label ?? detail.status}
                </span>
              </div>
            </div>

            {/* Actions selon le statut */}
            {detail.status === 'pending' && (
              <div className="flex gap-2.5">
                <button onClick={() => updateStatus(detail.id, 'refused')}
                  className="flex-1 border border-[#F0C0BA] bg-white text-red-500 py-2.5 rounded-[9px] text-[13px] font-semibold hover:bg-red-50 transition-colors">
                  Refuser
                </button>
                <button onClick={() => updateStatus(detail.id, 'accepted')}
                  className="flex-1 bg-navy text-white border-none py-2.5 rounded-[9px] text-[13px] font-semibold hover:opacity-90 transition-opacity">
                  Accepter
                </button>
              </div>
            )}
            {detail.status === 'accepted' && (
              <div className="flex gap-2.5">
                <button onClick={() => updateStatus(detail.id, 'refused')}
                  className="flex-1 border border-[#F0C0BA] bg-white text-red-500 py-2.5 rounded-[9px] text-[13px] font-semibold hover:bg-red-50 transition-colors">
                  Annuler
                </button>
                <button onClick={() => updateStatus(detail.id, 'completed')}
                  className="flex-1 bg-green-600 text-white border-none py-2.5 rounded-[9px] text-[13px] font-semibold hover:opacity-90 transition-opacity">
                  Marquer terminée
                </button>
              </div>
            )}
            {detail.status === 'refused' && (
              <button onClick={() => updateStatus(detail.id, 'accepted')}
                className="w-full bg-navy text-white border-none py-2.5 rounded-[9px] text-[13px] font-semibold hover:opacity-90 transition-opacity">
                Accepter quand même
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal ajout indisponibilité */}
      {addDate && (
        <div className="fixed inset-0 bg-navy/40 z-50 flex items-center justify-center px-4"
          onClick={() => setAddDate(null)}>
          <div className="card max-w-[340px] w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[16px] font-bold text-navy">Bloquer un créneau</div>
              <button onClick={() => setAddDate(null)} className="text-[#A7B0BF] hover:text-navy transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="text-[13px] text-[#8A94A6] mb-5 capitalize">
              {format(addDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">De</span>
                  <input type="time" className="input-field" value={unavailForm.startTime}
                    onChange={e => setUnavailForm(f => ({ ...f, startTime: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">À</span>
                  <input type="time" className="input-field" value={unavailForm.endTime}
                    onChange={e => setUnavailForm(f => ({ ...f, endTime: e.target.value }))} />
                </label>
              </div>
              <label className="block">
                <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">Motif (optionnel)</span>
                <input type="text" className="input-field" placeholder="Indisponible"
                  value={unavailForm.label}
                  onChange={e => setUnavailForm(f => ({ ...f, label: e.target.value }))} />
              </label>
              <button onClick={addUnavail} disabled={saving}
                className="w-full bg-navy text-white border-none rounded-[9px] py-[11px] text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
