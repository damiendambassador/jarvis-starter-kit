'use client'

import { useEffect, useState } from 'react'
import { supabase, type Reservation } from '@/lib/supabase'
import { X, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Props = { driverId: string }

type Toast = {
  id: string
  reservation: Reservation
}

/**
 * Bip discret via Web Audio (renforcement intermittent : un signal sensoriel
 * marque l'arrivée imprévisible d'une course). Échoue silencieusement si le
 * navigateur bloque l'audio (pas d'interaction utilisateur) ou si désactivé.
 */
function playChime() {
  try {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('dvtc_notif_sound') === 'off') return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const notes = [880, 1318.5] // La5 puis Mi6, montée gratifiante
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + i * 0.12
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.24)
    })
    setTimeout(() => ctx.close().catch(() => {}), 800)
  } catch { /* audio bloqué : on ignore */ }
}

export default function RealtimeNotif({ driverId }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)
  const [unseen, setUnseen] = useState(0)

  useEffect(() => {
    setMounted(true)

    const channel = supabase
      .channel(`reservations-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const r = payload.new as Reservation
          const toast: Toast = { id: r.id, reservation: r }
          setToasts(prev => [toast, ...prev].slice(0, 3))
          playChime()
          if (document.visibilityState !== 'visible') setUnseen(n => n + 1)
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id))
          }, 10000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [driverId])

  /* Badge dans le titre de l'onglet : cue de réengagement quand l'app n'a pas le focus */
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '')
    document.title = unseen > 0 ? `(${unseen}) ${base}` : base
    const onVisible = () => { if (document.visibilityState === 'visible') setUnseen(0) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [unseen])

  if (!mounted || toasts.length === 0) return null

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 w-[320px]">
      {toasts.map(t => (
        <ToastCard key={t.id} toast={t} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const r = toast.reservation
  const date = format(new Date(r.scheduled_at), "EEE d MMM 'à' HH'h'mm", { locale: fr })
  const typeLabel = r.ride_type === 'standard' ? 'Trajet simple' : 'Mise à dispo'

  return (
    <div className="bg-[#0A1628] text-white rounded-2xl shadow-2xl px-4 py-4 border border-[#C9A84C]/30 animate-slide-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
            <Bell size={14} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-[11px] text-[#C9A84C] font-semibold tracking-[.08em] uppercase">Nouvelle réservation</p>
            <p className="text-[14px] font-bold mt-0.5">{r.client_name}</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-white/40 hover:text-white flex-shrink-0 mt-0.5">
          <X size={15} />
        </button>
      </div>
      <div className="mt-3 ml-[42px] flex flex-col gap-1">
        <p className="text-[12px] text-white/70">{date}</p>
        <p className="text-[12px] text-white/70">{typeLabel} · {r.passengers} pax</p>
        {r.price_estimate && (
          <p className="text-[15px] font-bold text-[#C9A84C] mt-0.5">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(r.price_estimate)}
          </p>
        )}
      </div>
      {/* Barre de progression */}
      <div className="mt-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-[#C9A84C]/60 rounded-full animate-shrink" />
      </div>
    </div>
  )
}
