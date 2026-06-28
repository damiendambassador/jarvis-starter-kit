'use client'

import { useEffect, useState } from 'react'
import { type Reservation } from '@/lib/supabase'
import { formatPrice } from '@/lib/pricing'
import { useCountUp } from '@/lib/useCountUp'
import { startOfMonth, subMonths } from 'date-fns'
import { Target, CheckCircle2, TrendingUp, TrendingDown, Trophy, X } from 'lucide-react'

/** Prix de l'abonnement mensuel D-VTC (objectif de rentabilité). */
const ABONNEMENT_EUR = 74
/** Commission moyenne Uber/Bolt épargnée en direct. */
const UBER_COMMISSION = 0.28

/* ------------------------------------------------------------------ */
/* 1.6 + 1.5 + 1.7 — Quête de rentabilité + récap mensuel             */
/* ------------------------------------------------------------------ */

export function MonthQuest({ reservations }: { reservations: Reservation[] }) {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))

  const completedThisMonth = reservations.filter(
    r => r.status === 'completed' && new Date(r.scheduled_at) >= monthStart
  )
  const caMonth = completedThisMonth.reduce((s, r) => s + (r.price_estimate ?? 0), 0)
  const caLastMonth = reservations
    .filter(r => r.status === 'completed' && new Date(r.scheduled_at) >= lastMonthStart && new Date(r.scheduled_at) < monthStart)
    .reduce((s, r) => s + (r.price_estimate ?? 0), 0)

  const uberSavedMonth = Math.round(caMonth * UBER_COMMISSION)
  const reached = caMonth >= ABONNEMENT_EUR
  const remaining = Math.max(0, ABONNEMENT_EUR - caMonth)
  const avgTicket = completedThisMonth.length ? caMonth / completedThisMonth.length : 0
  const ridesLeft = avgTicket > 0 ? Math.ceil(remaining / avgTicket) : null
  const pct = Math.min(100, Math.round((caMonth / ABONNEMENT_EUR) * 100))
  const trend = caLastMonth > 0 ? Math.round(((caMonth - caLastMonth) / caLastMonth) * 100) : null

  const animatedCa = useCountUp(caMonth)

  return (
    <div className="card p-5 mb-[26px] overflow-hidden">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0 ${reached ? 'bg-green-50' : 'bg-gold/10'}`}>
            {reached
              ? <CheckCircle2 size={22} className="text-green-600" />
              : <Target size={22} className="text-gold-dark" />}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[.1em] font-semibold text-[#8A94A6]">
              {reached ? 'Abonnement rentabilisé' : 'Objectif du mois'}
            </p>
            <p className="text-[16px] font-bold text-navy mt-0.5">
              {reached
                ? <>Tes 74 € sont couverts · <span className="text-green-600">{formatPrice(caMonth - ABONNEMENT_EUR)} au-dessus</span></>
                : <>Encore <span className="text-gold-dark">{formatPrice(remaining)}</span>{ridesLeft ? <span className="text-[#8A94A6] font-medium"> ≈ {ridesLeft} course{ridesLeft > 1 ? 's' : ''}</span> : null} pour couvrir ton abonnement</>}
            </p>
          </div>
        </div>

        {/* Récap mensuel : CA, gain vs Uber, tendance */}
        <div className="flex items-center gap-5 text-right">
          <div>
            <p className="text-[11px] text-[#8A94A6] font-medium">CA du mois</p>
            <p className="text-[18px] font-bold text-navy">{formatPrice(animatedCa)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#8A94A6] font-medium">Gardé vs Uber</p>
            <p className="text-[18px] font-bold text-green-600">{formatPrice(uberSavedMonth)}</p>
          </div>
          {trend !== null && (
            <div>
              <p className="text-[11px] text-[#8A94A6] font-medium">vs mois dernier</p>
              <p className={`text-[18px] font-bold flex items-center gap-1 justify-end ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {trend >= 0 ? '+' : ''}{trend}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Barre de progression (endowed progress / goal gradient) */}
      <div className="mt-4 h-2 bg-[#EEF2F8] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${reached ? 'bg-green-500' : 'bg-gold'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1.4 — Paliers de réussite (milestones)                             */
/* ------------------------------------------------------------------ */

type Milestone = { key: string; label: string }

function computeMilestones(reservations: Reservation[]): Milestone[] {
  const completed = reservations.filter(r => r.status === 'completed')
  const count = completed.length
  const maxTicket = completed.reduce((m, r) => Math.max(m, r.price_estimate ?? 0), 0)

  const out: Milestone[] = []
  for (const n of [1, 10, 25, 50, 100, 250]) {
    if (count >= n) out.push({ key: `rides_${n}`, label: n === 1 ? 'Ta toute première course validée' : `${n}e course validée` })
  }
  for (const t of [100, 150, 200]) {
    if (maxTicket >= t) out.push({ key: `ticket_${t}`, label: `Premier ticket à +${t} €` })
  }
  return out
}

export function MilestoneWatcher({ reservations, driverId }: { reservations: Reservation[]; driverId: string }) {
  const [queue, setQueue] = useState<Milestone[]>([])

  useEffect(() => {
    const storeKey = `dvtc_milestones_${driverId}`
    const current = computeMilestones(reservations)
    const raw = localStorage.getItem(storeKey)

    // Premier lancement : on enregistre l'acquis sans rien fêter (pas de rafale rétroactive).
    if (raw === null) {
      localStorage.setItem(storeKey, JSON.stringify(current.map(m => m.key)))
      return
    }

    const known = new Set<string>(JSON.parse(raw))
    const fresh = current.filter(m => !known.has(m.key))
    if (fresh.length > 0) {
      setQueue(prev => [...prev, ...fresh])
      localStorage.setItem(storeKey, JSON.stringify(current.map(m => m.key)))
    }
  }, [reservations, driverId])

  // Défilement de la file : un palier à la fois, 4,5 s chacun.
  useEffect(() => {
    if (queue.length === 0) return
    const id = setTimeout(() => setQueue(prev => prev.slice(1)), 4500)
    return () => clearTimeout(id)
  }, [queue])

  if (queue.length === 0) return null
  const m = queue[0]

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-celebrate">
      <div className="bg-navy text-white rounded-2xl shadow-2xl border border-gold/50 px-6 py-4 flex items-center gap-4 min-w-[320px]">
        <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 animate-check-pop">
          <Trophy size={24} className="text-gold" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-[.1em] text-gold font-semibold">Palier atteint</p>
          <p className="text-[15px] font-bold mt-0.5">{m.label}</p>
        </div>
        <button onClick={() => setQueue(prev => prev.slice(1))} className="text-white/40 hover:text-white flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
