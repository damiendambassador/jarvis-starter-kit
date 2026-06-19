'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ExternalLink, TrendingUp, Clock, CheckCircle, PiggyBank, BarChart3, Target } from 'lucide-react'
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

function StatPill({ value, label, color = 'text-[#0A1628]', alert = false }: {
  value: string | number
  label: string
  color?: string
  alert?: boolean
}) {
  return (
    <div className="text-center min-w-[64px]">
      <div className={`text-[19px] font-bold ${alert ? 'text-amber-600' : color}`}>{value}</div>
      <div className="text-[10px] text-[#A7B0BF] mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  )
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

  const totalRevenue   = drivers.reduce((s, d) => s + d.stats.revenue, 0)
  const totalPending   = drivers.reduce((s, d) => s + d.stats.pending, 0)
  const totalCompleted = drivers.reduce((s, d) => s + d.stats.completed, 0)
  const totalAll       = drivers.reduce((s, d) => s + d.stats.total, 0)
  const totalSaved     = Math.round(totalRevenue * 0.28)
  const conversionRate = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0

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
          <ViewSwitcher current="admin" driverSlug={drivers[0]?.slug} variant="header" />
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
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-[28px] font-bold text-[#0A1628] m-0">Vue globale</h1>
            <p className="text-[14px] text-[#8A94A6] mt-1">{drivers.length} chauffeur{drivers.length > 1 ? 's' : ''} enregistré{drivers.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* KPIs globaux */}
        <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
          {[
            {
              label: 'CA total généré',
              value: formatPrice(totalRevenue),
              sub: 'Toutes courses terminées',
              icon: TrendingUp,
              color: 'text-[#C9A84C]',
              bg: 'bg-[#FBF7EC]',
            },
            {
              label: 'Économisé vs Uber',
              value: formatPrice(totalSaved),
              sub: 'Commission Uber/Bolt 28%',
              icon: PiggyBank,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Taux de conversion',
              value: `${conversionRate}%`,
              sub: `${totalCompleted} terminées / ${totalAll} demandes`,
              icon: Target,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'En attente',
              value: totalPending,
              sub: totalPending > 0 ? 'Action requise' : 'Aucune en attente',
              icon: Clock,
              color: totalPending > 0 ? 'text-amber-600' : 'text-[#8A94A6]',
              bg: totalPending > 0 ? 'bg-amber-50' : 'bg-[#F4F6FA]',
            },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E8EDF5] px-5 py-5">
              <div className={`w-9 h-9 rounded-[9px] ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div className="text-[22px] font-bold text-[#0A1628]">{s.value}</div>
              <div className="text-[12px] font-medium text-[#5A6477] mt-0.5">{s.label}</div>
              <div className="text-[11px] text-[#A7B0BF] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Valeur moyenne globale */}
        {totalCompleted > 0 && (
          <div className="bg-[#0A1628] rounded-2xl px-6 py-4 mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-[#C9A84C]" />
              <div>
                <div className="text-white font-semibold text-[15px]">Valeur moyenne par course</div>
                <div className="text-white/50 text-[12px]">Calculée sur les courses terminées</div>
              </div>
            </div>
            <div className="text-[28px] font-bold text-[#C9A84C]">
              {formatPrice(totalRevenue / totalCompleted)}
            </div>
          </div>
        )}

        {/* Liste des chauffeurs */}
        <h2 className="text-[16px] font-bold text-[#0A1628] mb-4">Chauffeurs</h2>
        <div className="flex flex-col gap-4">
          {drivers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#D6DEEA] px-12 py-12 text-center text-[14px] text-[#8A94A6]">
              Aucun chauffeur enregistré.
            </div>
          ) : drivers.map(driver => {
            const uberSaved    = Math.round(driver.stats.revenue * 0.28)
            const avgTicket    = driver.stats.completed > 0 ? driver.stats.revenue / driver.stats.completed : 0
            const conv         = driver.stats.total > 0 ? Math.round((driver.stats.completed / driver.stats.total) * 100) : 0

            return (
              <div key={driver.id} className="bg-white rounded-2xl border border-[#E8EDF5] overflow-hidden">
                {/* Identité */}
                <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-wrap border-b border-[#F0F3F8]">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-9 h-9 rounded-full bg-[#0A1628] flex items-center justify-center text-[#C9A84C] font-bold text-[15px]">
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-[#0A1628]">{driver.name}</h3>
                        <div className="text-[12px] text-[#8A94A6]">{driver.email}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#A7B0BF] mt-2">
                      Inscrit le {format(new Date(driver.created_at), 'd MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                  <a
                    href={`/r/${driver.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-[#0A1628]/40 hover:text-[#0A1628] border border-[#E8EDF5] hover:border-[#0A1628] rounded-[7px] px-3 py-1.5 transition-colors">
                    <ExternalLink size={12} />
                    Voir sa page
                  </a>
                </div>

                {/* Stats chiffrées */}
                <div className="px-6 py-4 flex items-center gap-5 flex-wrap">
                  <StatPill value={driver.stats.total}     label="Demandes" />
                  <StatPill value={driver.stats.pending}   label="En attente" alert={driver.stats.pending > 0} />
                  <StatPill value={driver.stats.accepted}  label="Acceptées" />
                  <StatPill value={driver.stats.completed} label="Terminées" color="text-green-600" />

                  <div className="w-px h-8 bg-[#E8EDF5] mx-1" />

                  <StatPill value={`${conv}%`}              label="Conversion" color="text-blue-600" />
                  <StatPill value={formatPrice(avgTicket)}  label="Ticket moyen" color="text-[#0A1628]" />

                  <div className="w-px h-8 bg-[#E8EDF5] mx-1" />

                  <StatPill value={formatPrice(driver.stats.revenue)} label="CA terminé"   color="text-[#C9A84C]" />
                  <StatPill value={formatPrice(uberSaved)}            label="Éco. vs Uber" color="text-green-600" />
                </div>

                {/* Barre de progression conversion */}
                <div className="px-6 pb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-[#A7B0BF]">Taux de conversion</span>
                    <span className="text-[11px] font-semibold text-[#0A1628]">{conv}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F0F3F8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0A1628] rounded-full transition-all"
                      style={{ width: `${conv}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
