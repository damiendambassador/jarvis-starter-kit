'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Receipt } from 'lucide-react'
import { supabase, type Driver } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', short: 'Accueil', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/clients', label: 'Clients', short: 'Clients', icon: Users, exact: false },
  { href: '/dashboard/calendar', label: 'Calendrier', short: 'Agenda', icon: Calendar, exact: false },
  { href: '/dashboard/factures', label: 'Mes factures', short: 'Factures', icon: Receipt, exact: false },
  { href: '/dashboard/settings', label: 'Paramètres', short: 'Réglages', icon: Settings, exact: false },
]

function useIsActive() {
  const pathname = usePathname()
  return (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)
}

function useLogout() {
  const router = useRouter()
  return async () => {
    await supabase.auth.signOut()
    router.replace('/dashboard/login')
  }
}

/* ------------------------------------------------------------------ */
/* Sidebar — visible sur desktop (≥ md) uniquement                     */
/* ------------------------------------------------------------------ */

export default function Sidebar({ driver }: { driver: Driver }) {
  const isActive = useIsActive()
  const handleLogout = useLogout()

  return (
    <aside className="hidden md:flex w-[236px] flex-shrink-0 bg-white border-r border-blue-gray flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-5 py-[22px] flex items-center gap-[11px] border-b border-[#F0F3F8]">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-navy flex items-center justify-center flex-shrink-0">
          <span className="text-[#C9A84C] font-bold text-[16px] leading-none">D</span>
        </div>
        <div>
          <div className="text-[14px] font-bold text-navy tracking-[.02em]">D-VTC</div>
          <div className="text-[10px] text-[#A7B0BF] truncate max-w-[140px]">{driver.name}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3.5 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className={[
                'flex items-center gap-2.5 px-[13px] py-[11px] rounded-[9px] text-[14px] font-medium transition-colors',
                active
                  ? 'bg-navy text-white'
                  : 'text-[#5A6477] hover:bg-[#F0F3F8] hover:text-navy',
              ].join(' ')}>
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3.5 border-t border-[#F0F3F8]">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-[11px] px-[13px] py-[11px] rounded-[9px] text-[#8A94A6] text-[14px] font-medium hover:bg-[#F0F3F8] hover:text-navy transition-colors">
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Barre du haut — mobile (< md) : logo + nom + déconnexion            */
/* ------------------------------------------------------------------ */

export function MobileTopBar({ driver }: { driver: Driver }) {
  const handleLogout = useLogout()

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-blue-gray px-4 h-[58px] flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-[32px] h-[32px] rounded-[8px] bg-navy flex items-center justify-center flex-shrink-0">
          <span className="text-[#C9A84C] font-bold text-[15px] leading-none">D</span>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-navy tracking-[.02em] leading-tight">D-VTC</div>
          <div className="text-[10px] text-[#A7B0BF] truncate">{driver.name}</div>
        </div>
      </div>
      <button onClick={handleLogout}
        title="Déconnexion"
        className="flex-shrink-0 w-9 h-9 rounded-[9px] flex items-center justify-center text-[#8A94A6] hover:bg-[#F0F3F8] hover:text-navy transition-colors">
        <LogOut size={18} />
      </button>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Barre de navigation du bas — mobile (< md)                          */
/* ------------------------------------------------------------------ */

export function MobileBottomNav() {
  const isActive = useIsActive()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-blue-gray pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        {NAV.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
                active ? 'text-navy' : 'text-[#A7B0BF]',
              ].join(' ')}>
              <span className={[
                'flex items-center justify-center w-[40px] h-[26px] rounded-full transition-colors',
                active ? 'bg-[#EDF3FC]' : '',
              ].join(' ')}>
                <item.icon size={19} />
              </span>
              <span className="leading-none">{item.short}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
