'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Users, Calendar, Settings, LogOut } from 'lucide-react'
import { supabase, type Driver } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/reservations', label: 'Réservations', icon: ClipboardList, exact: false },
  { href: '/dashboard/clients', label: 'Clients', icon: Users, exact: false },
  { href: '/dashboard/calendar', label: 'Calendrier', icon: Calendar, exact: false },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, exact: false },
]

export default function Sidebar({ driver }: { driver: Driver }) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/dashboard/login')
  }

  return (
    <aside className="w-[236px] flex-shrink-0 bg-white border-r border-blue-gray flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-5 py-[22px] flex items-center gap-[11px] border-b border-[#F0F3F8]">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-navy flex items-center justify-center flex-shrink-0">
          <span className="text-gold font-bold text-[16px] leading-none">D</span>
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
