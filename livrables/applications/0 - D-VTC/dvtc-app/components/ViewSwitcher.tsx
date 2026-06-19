'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ExternalLink, ChevronDown } from 'lucide-react'

type View = 'admin' | 'driver' | 'client'

const VIEWS: { key: View; label: string; description: string; href: string | null }[] = [
  { key: 'admin',  label: 'Administrateur', description: 'Tous les chauffeurs',   href: '/admin/dashboard' },
  { key: 'driver', label: 'Chauffeur',       description: 'Dashboard conducteur', href: '/dashboard' },
  { key: 'client', label: 'Réservation',     description: 'Vue client publique',  href: null },
]

type Props = {
  current: View
  driverSlug?: string
  variant?: 'sidebar' | 'header'
}

export default function ViewSwitcher({ current, driverSlug, variant = 'sidebar' }: Props) {
  const router = useRouter()
  const [isAdmin, setIsAdmin]   = useState(false)
  const [open, setOpen]         = useState(false)
  const ref                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('admin_email'))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function navigate(view: typeof VIEWS[0]) {
    setOpen(false)
    if (view.key === 'client') {
      if (driverSlug) router.push(`/r/${driverSlug}`)
      return
    }
    if (view.href) router.push(view.href)
  }

  const isSidebar = variant === 'sidebar'

  /* ─── Bouton D de base (sans switcher) ─── */
  if (!isAdmin) {
    return (
      <div className={isSidebar
        ? 'w-[34px] h-[34px] rounded-[9px] bg-navy flex items-center justify-center flex-shrink-0'
        : 'w-[38px] h-[38px] rounded-[9px] bg-navy border border-[#C9A84C]/50 flex items-center justify-center flex-shrink-0'
      }>
        <span className="text-[#C9A84C] font-bold text-[16px] leading-none">D</span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Changer de vue"
        className={[
          'flex items-center gap-1 transition-opacity hover:opacity-80',
          isSidebar
            ? 'w-[34px] h-[34px] rounded-[9px] bg-navy justify-center'
            : 'w-[38px] h-[38px] rounded-[9px] bg-navy border border-[#C9A84C]/50 justify-center',
        ].join(' ')}>
        <span className="text-[#C9A84C] font-bold text-[16px] leading-none">D</span>
        <ChevronDown size={9} className="text-[#C9A84C] absolute bottom-[3px] right-[3px]" />
      </button>

      {open && (
        <div className={[
          'absolute z-50 bg-white rounded-xl shadow-xl border border-[#E8EDF5] py-1.5 min-w-[200px]',
          isSidebar ? 'left-0 top-[calc(100%+6px)]' : 'left-0 top-[calc(100%+8px)]',
        ].join(' ')}>
          <div className="px-3 py-1.5 mb-1">
            <p className="text-[10px] font-semibold tracking-[.1em] uppercase text-[#A7B0BF]">Changer de vue</p>
          </div>
          {VIEWS.map(view => {
            if (view.key === 'client' && !driverSlug) return null
            const active = view.key === current
            return (
              <button
                key={view.key}
                onClick={() => navigate(view)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  active ? 'bg-[#F0F3F8]' : 'hover:bg-[#F8F9FB]',
                ].join(' ')}>
                <div className={[
                  'w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0',
                  active ? 'bg-navy' : 'bg-[#EDF1F7]',
                ].join(' ')}>
                  {view.key === 'admin'  && <ShieldCheck size={13} className={active ? 'text-white' : 'text-[#8A94A6]'} />}
                  {view.key === 'driver' && <span className={`text-[11px] font-bold ${active ? 'text-white' : 'text-[#8A94A6]'}`}>C</span>}
                  {view.key === 'client' && <ExternalLink size={13} className={active ? 'text-white' : 'text-[#8A94A6]'} />}
                </div>
                <div>
                  <div className={`text-[13px] font-semibold ${active ? 'text-navy' : 'text-[#3A4456]'}`}>{view.label}</div>
                  <div className="text-[11px] text-[#A7B0BF]">{view.description}</div>
                </div>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-navy" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
