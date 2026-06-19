'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ExternalLink, Users, TrendingUp, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import ViewSwitcher from '@/components/ViewSwitcher'

type DriverWithStats = {
  id: string
  name: string
  email: string
  slug: string
  created_at: string
  stats: {
    total: number
    pending: number
    accepted: number
    completed: number
    revenue: number
  }
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function AdminDashboard() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<DriverWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const email    = localStorage.getItem('admin_email')
    const password = localStorage.getItem('admin_password')
    if (!email || !password) { router.replace('/admin'); return }

    fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setDrivers(data.drivers); setLoading(false) })
      .catch(() => { router.replace('/admin') })
  }, [router])

  function logout() {
    localStorage.removeItem('admin_email')
    localStorage.removeItem('admin_password')
    router.replace('/admin')
  }

  const totalRevenue    = drivers.reduce((s, d) => s + d.stats.revenue, 0)
  const totalPending    = drivers.reduce((s, d) => s + d.stats.pending, 0)
  const totalCompleted  = drivers.reduce((s, d) => s + d.stats.completed, 0)

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#0A1628]" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      {/* Header */}
      <header className="bg-[#0A1628] text-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ViewSwitcher
            current="admin"
            driverSlug={drivers[0]?.slug}
            variant="header"
          />
          <div>
            <div className="text-[11px] uppercase tracking-[.16em] text-[#C9A84C] font-semibold">D-VTC</div>
            <div className="text-white/60 text-[12px]">Tableau de bord administrateur</div>
          </div>
        </div>
        <button onClick={logout} className="text-white/50 hover:text-white text-[13px] transition-colors">
          Déconnexion
        </button>
      </header>

      <main className="px-8 py-8 max-w-[1100px] mx-auto">
        <h1 className="font-serif text-[28px] font-bold text-[#0A1628] mb-2">Vue globale</h1>
        <p className="text-[14px] text-[#8A94A6] mb-8">{drivers.length} chauffeur{drivers.length > 1 ? 's' : ''} enregistré{drivers.length > 1 ? 's' : ''}</p>

        {/* Totaux */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'CA total (terminées)', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'text-[#C9A84C]' },
            { label: 'Réservations terminées', value: totalCompleted, icon: Users, color: 'text-green-600' },
            { label: 'En attente (tous)', value: totalPending, icon: Clock, color: totalPending > 0 ? 'text-amber-600' : 'text-[#8A94A6]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E8EDF5] px-6 py-5 flex items-center gap-4">
              <div className={`${s.color}`}><s.icon size={22} /></div>
              <div>
                <div className="text-[12px] text-[#8A94A6] font-medium">{s.label}</div>
                <div className="text-[22px] font-bold text-[#0A1628] mt-0.5">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Liste des chauffeurs */}
        <div className="flex flex-col gap-4">
          {drivers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#D6DEEA] px-12 py-12 text-center text-[14px] text-[#8A94A6]">
              Aucun chauffeur enregistré.
            </div>
          ) : drivers.map(driver => (
            <div key={driver.id} className="bg-white rounded-2xl border border-[#E8EDF5] px-6 py-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-[17px] font-bold text-[#0A1628]">{driver.name}</h2>
                    <a
                      href={`/r/${driver.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-[#0A1628]/50 hover:text-[#0A1628] transition-colors">
                      <ExternalLink size={12} />
                      /r/{driver.slug}
                    </a>
                  </div>
                  <div className="text-[13px] text-[#8A94A6]">{driver.email}</div>
                  <div className="text-[12px] text-[#A7B0BF] mt-1">
                    Inscrit le {format(new Date(driver.created_at), 'd MMMM yyyy', { locale: fr })}
                  </div>
                </div>

                <div className="flex gap-6">
                  {[
                    { label: 'Total', value: driver.stats.total },
                    { label: 'En attente', value: driver.stats.pending, alert: driver.stats.pending > 0 },
                    { label: 'Acceptées', value: driver.stats.accepted },
                    { label: 'Terminées', value: driver.stats.completed },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className={`text-[20px] font-bold ${stat.alert ? 'text-amber-600' : 'text-[#0A1628]'}`}>
                        {stat.value}
                      </div>
                      <div className="text-[11px] text-[#8A94A6]">{stat.label}</div>
                    </div>
                  ))}
                  <div className="text-center border-l border-[#E8EDF5] pl-6 ml-2">
                    <div className="text-[20px] font-bold text-[#C9A84C]">{formatPrice(driver.stats.revenue)}</div>
                    <div className="text-[11px] text-[#8A94A6]">CA terminé</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
