'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, ExternalLink, TrendingUp, Clock, PiggyBank, BarChart3,
  Target, Plus, Pencil, Trash2, X, Check, Copy, Eye, EyeOff,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import ViewSwitcher from '@/components/ViewSwitcher'

type DriverWithStats = {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
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

function fmtPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function toSlug(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function genPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/* ─── Composant StatPill ─── */
function StatPill({ value, label, color = 'text-[#0A1628]', alert = false }: {
  value: string | number; label: string; color?: string; alert?: boolean
}) {
  return (
    <div className="text-center min-w-[60px]">
      <div className={`text-[18px] font-bold ${alert ? 'text-amber-600' : color}`}>{value}</div>
      <div className="text-[10px] text-[#A7B0BF] mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  )
}

/* ─── Composant CopyField ─── */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div>
      <div className="text-[11px] text-[#8A94A6] mb-1">{label}</div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 bg-[#F4F6FA] border border-[#E8EDF5] rounded-[7px] px-3 py-2 text-[13px] font-mono text-[#3A4456] truncate">
          {value}
        </div>
        <button onClick={copy} className="p-2 rounded-[7px] border border-[#E8EDF5] hover:bg-[#F4F6FA] transition-colors">
          {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} className="text-[#8A94A6]" />}
        </button>
      </div>
    </div>
  )
}

/* ─── Modal Ajouter chauffeur ─── */
function AddDriverModal({ onClose, onCreated, adminEmail, adminPassword }: {
  onClose: () => void
  onCreated: () => void
  adminEmail: string
  adminPassword: string
}) {
  const [form, setForm] = useState({ name: '', email: '', slug: '', password: genPassword() })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ slug: string; email: string; password: string } | null>(null)

  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, slug: toSlug(name) }))
  }

  async function submit() {
    if (!form.name || !form.email || !form.password) { setError('Tous les champs sont requis.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/admin/create-driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, adminPassword, name: form.name, email: form.email, slug: form.slug, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setCreated({ slug: data.driver.slug, email: form.email, password: form.password })
    setLoading(false)
    onCreated()
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dvtc-app.vercel.app'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F3F8]">
          <h2 className="text-[17px] font-bold text-[#0A1628]">
            {created ? 'Chauffeur créé' : 'Ajouter un chauffeur'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F6FA]"><X size={18} /></button>
        </div>

        {!created ? (
          <div className="px-6 py-5 flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Nom complet</label>
              <input
                className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-2.5 text-[14px] outline-none focus:border-[#0A1628]"
                placeholder="Jean Dupont"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Email</label>
              <input
                type="email"
                className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-2.5 text-[14px] outline-none focus:border-[#0A1628]"
                placeholder="jean@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">
                Slug (URL de réservation)
              </label>
              <div className="flex items-center border border-[#D6DEEA] rounded-[9px] overflow-hidden focus-within:border-[#0A1628]">
                <span className="px-3 py-2.5 bg-[#F4F6FA] text-[12px] text-[#8A94A6] border-r border-[#D6DEEA] whitespace-nowrap">/r/</span>
                <input
                  className="flex-1 px-3 py-2.5 text-[14px] outline-none"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                />
              </div>
              <p className="text-[11px] text-[#A7B0BF] mt-1">Généré automatiquement depuis le nom</p>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Mot de passe temporaire</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-[#D6DEEA] rounded-[9px] overflow-hidden focus-within:border-[#0A1628]">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="flex-1 px-4 py-2.5 text-[14px] outline-none font-mono"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="px-3 text-[#8A94A6]">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, password: genPassword() }))}
                  className="px-3 py-2.5 border border-[#D6DEEA] rounded-[9px] text-[11px] font-semibold text-[#5A6477] hover:bg-[#F4F6FA] transition-colors whitespace-nowrap">
                  Regénérer
                </button>
              </div>
              <p className="text-[11px] text-[#A7B0BF] mt-1">Le chauffeur pourra le changer depuis ses paramètres</p>
            </div>
            {error && <p className="text-red-500 text-[13px]">{error}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-[#0A1628] text-white rounded-[9px] py-3 text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Création en cours…' : 'Créer le compte chauffeur'}
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <Check size={18} className="text-green-600 flex-shrink-0" />
              <p className="text-[13px] text-green-800 font-medium">Compte créé avec succès. Transmettez ces informations au chauffeur.</p>
            </div>
            <CopyField label="Page de réservation (à partager aux clients)" value={`${baseUrl}/r/${created.slug}`} />
            <CopyField label="Accès tableau de bord" value={`${baseUrl}/dashboard`} />
            <CopyField label="Email de connexion" value={created.email} />
            <CopyField label="Mot de passe temporaire" value={created.password} />
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-[12px] text-amber-800">Le chauffeur peut changer son mot de passe depuis Paramètres → Sécurité une fois connecté.</p>
            </div>
            <button onClick={onClose} className="w-full bg-[#0A1628] text-white rounded-[9px] py-3 text-[14px] font-semibold hover:opacity-90">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Modal Modifier chauffeur ─── */
function EditDriverModal({ driver, onClose, onSaved, adminEmail, adminPassword }: {
  driver: DriverWithStats
  onClose: () => void
  onSaved: () => void
  adminEmail: string
  adminPassword: string
}) {
  const [form, setForm] = useState({ name: driver.name, email: driver.email, phone: driver.phone ?? '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/update-driver', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, adminPassword, driverId: driver.id, userId: driver.user_id, ...form }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F3F8]">
          <h2 className="text-[17px] font-bold text-[#0A1628]">Modifier {driver.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F6FA]"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {[
            { key: 'name',  label: 'Nom complet',  type: 'text',  placeholder: 'Jean Dupont' },
            { key: 'email', label: 'Email',         type: 'email', placeholder: 'jean@email.com' },
            { key: 'phone', label: 'Téléphone',     type: 'tel',   placeholder: '06 12 34 56 78' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">{f.label}</label>
              <input
                type={f.type}
                className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-2.5 text-[14px] outline-none focus:border-[#0A1628]"
                placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          {error && <p className="text-red-500 text-[13px]">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-[#D6DEEA] rounded-[9px] py-2.5 text-[13px] font-semibold text-[#5A6477] hover:bg-[#F4F6FA]">
              Annuler
            </button>
            <button onClick={submit} disabled={loading} className="flex-1 bg-[#0A1628] text-white rounded-[9px] py-2.5 text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Page principale ─── */
export default function AdminDashboard() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<DriverWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editDriver, setEditDriver] = useState<DriverWithStats | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const adminEmail    = typeof window !== 'undefined' ? localStorage.getItem('admin_email') ?? '' : ''
  const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('admin_password') ?? '' : ''

  async function loadDrivers() {
    const email    = localStorage.getItem('admin_email')
    const password = localStorage.getItem('admin_password')
    if (!email || !password) { router.replace('/admin'); return }
    const res  = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) { router.replace('/admin'); return }
    const data = await res.json()
    setDrivers(data.drivers)
    setLoading(false)
  }

  useEffect(() => { loadDrivers() }, [router])

  async function handleDelete(driver: DriverWithStats) {
    setDeleting(true)
    await fetch('/api/admin/delete-driver', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, adminPassword, driverId: driver.id, userId: driver.user_id }),
    })
    setDeleteId(null)
    setDeleting(false)
    loadDrivers()
  }

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
  const convRate       = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#0A1628]" size={32} />
    </div>
  )

  const driverToDelete = drivers.find(d => d.id === deleteId)

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
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-[#0A1628] text-white px-4 py-2.5 rounded-[10px] text-[13px] font-semibold hover:opacity-90 transition-opacity">
            <Plus size={16} />
            Ajouter un chauffeur
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
          {[
            { label: 'CA total généré', value: fmtPrice(totalRevenue), sub: 'Toutes courses terminées', icon: TrendingUp, color: 'text-[#C9A84C]', bg: 'bg-[#FBF7EC]' },
            { label: 'Économisé vs Uber', value: fmtPrice(totalSaved), sub: 'Commission Uber/Bolt 28%', icon: PiggyBank, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Taux de conversion', value: `${convRate}%`, sub: `${totalCompleted} terminées / ${totalAll} demandes`, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'En attente', value: totalPending, sub: totalPending > 0 ? 'Action requise' : 'Aucune en attente', icon: Clock, color: totalPending > 0 ? 'text-amber-600' : 'text-[#8A94A6]', bg: totalPending > 0 ? 'bg-amber-50' : 'bg-[#F4F6FA]' },
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

        {totalCompleted > 0 && (
          <div className="bg-[#0A1628] rounded-2xl px-6 py-4 mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-[#C9A84C]" />
              <div>
                <div className="text-white font-semibold text-[15px]">Valeur moyenne par course</div>
                <div className="text-white/50 text-[12px]">Calculée sur les courses terminées</div>
              </div>
            </div>
            <div className="text-[28px] font-bold text-[#C9A84C]">{fmtPrice(totalRevenue / totalCompleted)}</div>
          </div>
        )}

        {/* Liste chauffeurs */}
        <h2 className="text-[16px] font-bold text-[#0A1628] mb-4">Chauffeurs</h2>
        <div className="flex flex-col gap-4">
          {drivers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#D6DEEA] px-12 py-16 text-center">
              <p className="text-[14px] text-[#8A94A6] mb-4">Aucun chauffeur enregistré.</p>
              <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 bg-[#0A1628] text-white px-5 py-2.5 rounded-[9px] text-[13px] font-semibold hover:opacity-90">
                <Plus size={15} />Ajouter le premier chauffeur
              </button>
            </div>
          ) : drivers.map(driver => {
            const uberSaved = Math.round(driver.stats.revenue * 0.28)
            const avgTicket = driver.stats.completed > 0 ? driver.stats.revenue / driver.stats.completed : 0
            const conv      = driver.stats.total > 0 ? Math.round((driver.stats.completed / driver.stats.total) * 100) : 0

            return (
              <div key={driver.id} className="bg-white rounded-2xl border border-[#E8EDF5] overflow-hidden">
                {/* Identité */}
                <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-wrap border-b border-[#F0F3F8]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A1628] flex items-center justify-center text-[#C9A84C] font-bold text-[16px] flex-shrink-0">
                      {driver.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[16px] font-bold text-[#0A1628]">{driver.name}</h3>
                        <a href={`/r/${driver.slug}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-[#0A1628]/40 hover:text-[#0A1628] transition-colors">
                          <ExternalLink size={11} />/r/{driver.slug}
                        </a>
                      </div>
                      <div className="text-[12px] text-[#8A94A6]">{driver.email}</div>
                      {driver.phone && <div className="text-[12px] text-[#A7B0BF]">{driver.phone}</div>}
                      <div className="text-[11px] text-[#A7B0BF] mt-0.5">
                        Inscrit le {format(new Date(driver.created_at), 'd MMMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditDriver(driver)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-[#5A6477] border border-[#E8EDF5] hover:border-[#0A1628] hover:text-[#0A1628] rounded-[7px] px-3 py-1.5 transition-colors">
                      <Pencil size={12} />Modifier
                    </button>
                    <button onClick={() => setDeleteId(driver.id)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-red-400 border border-red-100 hover:border-red-300 hover:text-red-600 rounded-[7px] px-3 py-1.5 transition-colors">
                      <Trash2 size={12} />Supprimer
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 flex items-center gap-5 flex-wrap">
                  <StatPill value={driver.stats.total}     label="Demandes" />
                  <StatPill value={driver.stats.pending}   label="En attente"  alert={driver.stats.pending > 0} />
                  <StatPill value={driver.stats.accepted}  label="Acceptées" />
                  <StatPill value={driver.stats.completed} label="Terminées"   color="text-green-600" />
                  <div className="w-px h-8 bg-[#E8EDF5] mx-1" />
                  <StatPill value={`${conv}%`}             label="Conversion"  color="text-blue-600" />
                  <StatPill value={fmtPrice(avgTicket)}    label="Ticket moyen" />
                  <div className="w-px h-8 bg-[#E8EDF5] mx-1" />
                  <StatPill value={fmtPrice(driver.stats.revenue)} label="CA terminé"    color="text-[#C9A84C]" />
                  <StatPill value={fmtPrice(uberSaved)}             label="Éco. vs Uber" color="text-green-600" />
                </div>

                {/* Barre conversion */}
                <div className="px-6 pb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-[#A7B0BF]">Taux de conversion</span>
                    <span className="text-[11px] font-semibold text-[#0A1628]">{conv}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F0F3F8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0A1628] rounded-full transition-all" style={{ width: `${conv}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Modal ajout */}
      {addOpen && (
        <AddDriverModal
          onClose={() => setAddOpen(false)}
          onCreated={loadDrivers}
          adminEmail={adminEmail}
          adminPassword={adminPassword}
        />
      )}

      {/* Modal modification */}
      {editDriver && (
        <EditDriverModal
          driver={editDriver}
          onClose={() => setEditDriver(null)}
          onSaved={loadDrivers}
          adminEmail={adminEmail}
          adminPassword={adminPassword}
        />
      )}

      {/* Confirmation suppression */}
      {deleteId && driverToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] px-6 py-6">
            <h2 className="text-[17px] font-bold text-[#0A1628] mb-2">Supprimer {driverToDelete.name} ?</h2>
            <p className="text-[13px] text-[#5A6477] mb-5">
              Cette action est irréversible. Le compte, toutes les réservations et l'historique seront définitivement supprimés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#D6DEEA] rounded-[9px] py-2.5 text-[13px] font-semibold text-[#5A6477] hover:bg-[#F4F6FA]">
                Annuler
              </button>
              <button onClick={() => handleDelete(driverToDelete)} disabled={deleting}
                className="flex-1 bg-red-500 text-white rounded-[9px] py-2.5 text-[13px] font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
