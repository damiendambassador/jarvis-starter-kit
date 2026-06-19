'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase, type Reservation } from '@/lib/supabase'
import { useDriver } from '../_context'
import { formatPrice } from '@/lib/pricing'
import {
  format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isSameDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

const STATUS_COLOR: Record<string, { dot: string; label: string; legend: string }> = {
  pending:   { dot: 'bg-amber-400', label: 'En attente',  legend: 'bg-amber-400 w-3 h-3 rounded-full' },
  accepted:  { dot: 'bg-green-500', label: 'Acceptée',    legend: 'bg-green-500 w-3 h-3 rounded-full' },
  completed: { dot: 'bg-blue',      label: 'Terminée',    legend: 'bg-blue w-3 h-3 rounded-full' },
  refused:   { dot: 'bg-red-400',   label: 'Refusée',     legend: 'bg-red-400 w-3 h-3 rounded-full' },
}

export default function CalendarPage() {
  const driver = useDriver()
  const [viewDate, setViewDate] = useState(() => new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Reservation | null>(null)

  useEffect(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const from = new Date(year, month, 1).toISOString()
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    setLoading(true)
    supabase.from('reservations')
      .select('*')
      .eq('driver_id', driver.id)
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)
      .then(({ data }) => { setReservations(data ?? []); setLoading(false) })
  }, [driver.id, viewDate.getMonth(), viewDate.getFullYear()])

  const cells = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let offset = getDay(startOfMonth(viewDate)) - 1
    if (offset < 0) offset = 6
    const days = getDaysInMonth(viewDate)
    type Cell = {
      day: number | null; date: Date | null; isToday: boolean; isOtherMonth: boolean
      events: Reservation[]
    }
    const result: Cell[] = []
    for (let i = 0; i < offset; i++) result.push({ day: null, date: null, isToday: false, isOtherMonth: true, events: [] })
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d)
      const events = reservations.filter(r => isSameDay(new Date(r.scheduled_at), date))
      result.push({ day: d, date, isToday: isSameDay(date, today), isOtherMonth: false, events })
    }
    return result
  }, [viewDate, reservations])

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
                  'min-h-[80px] rounded-xl p-2 border transition-colors',
                  !cell.day ? 'invisible' : '',
                  cell.isToday ? 'bg-[#EDF3FC] border-[#D5E2F7]' : 'bg-white border-blue-gray hover:border-[#C4CDDB]',
                ].join(' ')}>
                {cell.day && (
                  <>
                    <div className={[
                      'text-[12px] font-bold mb-1',
                      cell.isToday ? 'text-blue' : 'text-[#5A6477]',
                    ].join(' ')}>
                      {cell.day}
                    </div>
                    <div className="flex flex-col gap-1">
                      {cell.events.slice(0, 3).map(ev => (
                        <button key={ev.id} onClick={() => setDetail(ev)}
                          className={[
                            'w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded truncate',
                            ev.status === 'pending'   ? 'bg-amber-100 text-amber-700' : '',
                            ev.status === 'accepted'  ? 'bg-green-50 text-green-700' : '',
                            ev.status === 'completed' ? 'bg-[#EDF3FC] text-blue' : '',
                            ev.status === 'refused'   ? 'bg-red-50 text-red-400' : '',
                          ].join(' ')}>
                          {format(new Date(ev.scheduled_at), 'HH:mm')} {ev.client_name.split(' ')[0]}
                        </button>
                      ))}
                      {cell.events.length > 3 && (
                        <div className="text-[10px] text-[#8A94A6] pl-1">+{cell.events.length - 3} de plus</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-[18px] flex-wrap mt-[18px]">
        {Object.entries(STATUS_COLOR).map(([key, { dot, label }]) => (
          <div key={key} className="flex items-center gap-2 text-[12px] text-[#5A6477]">
            <span className={`${dot} w-3 h-3 rounded-full flex-shrink-0`} />
            {label}
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-navy/40 z-50 flex items-center justify-center px-4 animate-fade-in"
          onClick={() => setDetail(null)}>
          <div className="card max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[16px] font-bold text-navy">{detail.client_name}</div>
                <div className="text-[13px] text-[#8A94A6] mt-1">{detail.client_phone}</div>
              </div>
              <button onClick={() => setDetail(null)} className="text-[#A7B0BF] hover:text-navy transition-colors">
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2.5 text-[13px] text-[#3A4456]">
              <div><span className="text-[#8A94A6]">Date :</span> {format(new Date(detail.scheduled_at), "EEE d MMM 'à' HH'h'mm", { locale: fr })}</div>
              <div><span className="text-[#8A94A6]">Départ :</span> {detail.pickup_address}</div>
              {detail.dropoff_address && <div><span className="text-[#8A94A6]">Arrivée :</span> {detail.dropoff_address}</div>}
              {detail.price_estimate && (
                <div><span className="text-[#8A94A6]">Tarif :</span> <span className="font-bold text-gold">{formatPrice(detail.price_estimate)}</span></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
