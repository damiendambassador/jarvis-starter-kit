'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, ExternalLink, TrendingUp, Clock, PiggyBank, BarChart3,
  Target, Plus, Pencil, Trash2, X, Check, Copy, Eye, EyeOff,
  CreditCard, AlertCircle, CheckCircle2, PauseCircle, XCircle, Receipt, RefreshCw, Send, Gift, Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import ViewSwitcher from '@/components/ViewSwitcher'

type LastInvoice = {
  id: string
  invoice_number: string
  amount_cents: number
  status: string
  paid_at: string | null
}

type DriverWithStats = {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  slug: string
  created_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  cgv_accepted_at: string | null
  subscription_start_at: string | null
  checkout_url: string | null
  parraine_par: string | null
  mois_offert_le: string | null
  referral_count: number
  last_invoice: LastInvoice | null
  stats: {
    total: number
    pending: number
    accepted: number
    completed: number
    revenue: number
  }
}

function SubStatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    active:   { label: 'Actif',      cls: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
    trialing: { label: 'Essai',      cls: 'bg-blue-100 text-blue-700',    icon: Clock },
    past_due: { label: 'En retard',  cls: 'bg-red-100 text-red-600',      icon: AlertCircle },
    paused:   { label: 'En pause',   cls: 'bg-amber-100 text-amber-700',  icon: PauseCircle },
    cancelled:{ label: 'Résilié',    cls: 'bg-[#F4F6FA] text-[#8A94A6]', icon: XCircle },
    pending:  { label: 'En attente', cls: 'bg-amber-100 text-amber-700',  icon: Clock },
  }
  const s = status ? (map[status] ?? map.pending) : map.pending
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.cls}`}>
      <Icon size={11} />
      {s.label}
    </span>
  )
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
function AddDriverModal({ onClose, onCreated, adminToken }: {
  onClose: () => void
  onCreated: () => void
  adminToken: string
}) {
  const [form, setForm] = useState({ name: '', email: '', slug: '', password: genPassword() })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ slug: string; email: string; password: string; checkoutUrl: string | null } | null>(null)

  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, slug: toSlug(name) }))
  }

  async function submit() {
    if (!form.name || !form.email || !form.password) { setError('Tous les champs sont requis.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/admin/create-driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, name: form.name, email: form.email, slug: form.slug, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setCreated({ slug: data.driver.slug, email: form.email, password: form.password, checkoutUrl: data.checkoutUrl ?? null })
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
            <CopyField
              label="Lien paiement Stripe (à envoyer au chauffeur)"
              value={created.checkoutUrl ?? '⚠ Non généré — STRIPE_SECRET_KEY invalide dans Vercel'}
            />
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
function EditDriverModal({ driver, onClose, onSaved, adminToken, allDrivers }: {
  driver: DriverWithStats
  onClose: () => void
  onSaved: () => void
  adminToken: string
  allDrivers: DriverWithStats[]
}) {
  const [form, setForm] = useState({ name: driver.name, email: driver.email, phone: driver.phone ?? '', parraine_par: driver.parraine_par ?? '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/update-driver', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, driverId: driver.id, userId: driver.user_id, ...form }),
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
          <div>
            <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">
              Parrainé par <span className="font-normal text-[#A7B0BF]">(slug du parrain, optionnel)</span>
            </label>
            <select
              className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-2.5 text-[14px] outline-none focus:border-[#0A1628] bg-white"
              value={form.parraine_par}
              onChange={e => setForm(p => ({ ...p, parraine_par: e.target.value }))}>
              <option value="">— Aucun parrain —</option>
              {allDrivers.filter(d => d.id !== driver.id).map(d => (
                <option key={d.id} value={d.slug}>{d.name} ({d.slug})</option>
              ))}
            </select>
          </div>
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

/* ─── Modal changement mot de passe ─── */
function ChangePwdModal({ adminToken, onClose }: {
  adminToken: string; onClose: () => void
}) {
  const router = useRouter()
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 8) { setError('Le nouveau mot de passe doit faire au moins 8 caractères.'); return }
    if (next !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, newPassword: next }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Erreur serveur'); return }
    /* Invalider la session locale après changement de mot de passe */
    localStorage.removeItem('admin_token')
    setSuccess(true)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F3F8]">
          <h2 className="text-[17px] font-bold text-[#0A1628]">Changer le mot de passe</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F6FA]"><X size={18} /></button>
        </div>

        {success ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
            <div className="text-[16px] font-bold text-[#0A1628] mb-1">Mot de passe mis à jour</div>
            <p className="text-[13px] text-[#8A94A6] mb-5">
              Reconnectez-vous avec votre nouveau mot de passe.
            </p>
            <button onClick={() => router.replace('/admin')} className="bg-[#0A1628] text-white rounded-[9px] px-6 py-2.5 text-[13px] font-semibold hover:opacity-90">
              Se reconnecter
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  placeholder="8 caractères minimum"
                  className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-2.5 pr-10 text-[14px] outline-none focus:border-[#0A1628]"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7B0BF] hover:text-[#5A6477]">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-2.5 text-[14px] outline-none focus:border-[#0A1628]"
              />
            </div>
            {error && <p className="text-red-500 text-[13px]">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 border border-[#D6DEEA] rounded-[9px] py-2.5 text-[13px] font-semibold text-[#5A6477] hover:bg-[#F4F6FA]">
                Annuler
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-[#0A1628] text-white rounded-[9px] py-2.5 text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        )}
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
  const [activeTab, setActiveTab] = useState<'drivers' | 'billing'>('drivers')
  const [stripeAction, setStripeAction] = useState<string | null>(null)
  const [giftingMonth, setGiftingMonth] = useState<string | null>(null)
  const [changePwdOpen, setChangePwdOpen] = useState(false)

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : ''

  async function handleStripe(action: 'pause' | 'cancel' | 'activate', driverId: string) {
    setStripeAction(driverId + action)
    await fetch(`/api/admin/stripe/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, driverId }),
    })
    setStripeAction(null)
    loadDrivers()
  }

  async function handleResendInvoice(invoiceId: string) {
    setStripeAction(invoiceId)
    await fetch('/api/admin/stripe/resend-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, invoiceId }),
    })
    setStripeAction(null)
  }

  async function handleGiftMonth(driverId: string) {
    setGiftingMonth(driverId)
    const res = await fetch('/api/admin/stripe/gift-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, driverId }),
    })
    const data = await res.json()
    setGiftingMonth(null)
    if (!res.ok) { alert(data.error ?? 'Erreur lors de l\'application du mois gratuit') }
    else { loadDrivers() }
  }

  async function handleResyncInvoice(driverId: string) {
    setStripeAction(driverId + 'resync')
    const res = await fetch('/api/admin/stripe/resync-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, driverId }),
    })
    const data = await res.json()
    setStripeAction(null)
    if (data.inserted > 0) { loadDrivers() }
    else if (data.inserted === 0) { alert('Aucune facture manquante trouvée dans Stripe.') }
  }

  async function loadDrivers() {
    const token = localStorage.getItem('admin_token')
    if (!token) { router.replace('/admin'); return }
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken: token }),
    })
    if (!res.ok) { localStorage.removeItem('admin_token'); router.replace('/admin'); return }
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
      body: JSON.stringify({ adminToken, driverId: driver.id, userId: driver.user_id }),
    })
    setDeleteId(null)
    setDeleting(false)
    loadDrivers()
  }

  function logout() {
    localStorage.removeItem('admin_token')
    router.replace('/admin')
  }

  const totalRevenue   = drivers.reduce((s, d) => s + d.stats.revenue, 0)
  const totalPending   = drivers.reduce((s, d) => s + d.stats.pending, 0)
  const totalCompleted = drivers.reduce((s, d) => s + d.stats.completed, 0)
  const totalAll       = drivers.reduce((s, d) => s + d.stats.total, 0)
  const totalSaved     = Math.round(totalRevenue * 0.28)
  const convRate       = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0

  /* Objectif rentabilité : couvrir les charges fixes en NET, après cotisations micro-BNC */
  const PRICE_PER_DRIVER = 74        // € brut / mois / chauffeur
  const COTISATION_RATE  = 0.261     // micro-BNC 2026 (~26 %)
  const FIXED_COSTS      = 1547.99   // € / mois de charges fixes à couvrir (en net)
  const NET_PER_DRIVER   = PRICE_PER_DRIVER * (1 - COTISATION_RATE)        // ≈ 54,69 €
  const GOAL_DRIVERS     = Math.ceil(FIXED_COSTS / NET_PER_DRIVER)         // ≈ 29
  const activeCount      = drivers.filter(d => d.subscription_status === 'active').length
  const mrrGross         = activeCount * PRICE_PER_DRIVER
  const mrrNet           = mrrGross * (1 - COTISATION_RATE)
  const goalReached      = mrrNet >= FIXED_COSTS
  const goalPct          = Math.min(100, Math.round((mrrNet / FIXED_COSTS) * 100))
  const remaining        = Math.max(0, GOAL_DRIVERS - activeCount)

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#0A1628]" size={32} />
    </div>
  )

  const driverToDelete = drivers.find(d => d.id === deleteId)

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      {/* Header */}
      <header className="bg-[#0A1628] text-white px-5 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ViewSwitcher current="admin" driverSlug={drivers[0]?.slug} variant="header" />
          <div>
            <div className="text-[11px] uppercase tracking-[.16em] text-[#C9A84C] font-semibold">D-VTC</div>
            <div className="text-white/60 text-[12px]">Tableau de bord administrateur</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setChangePwdOpen(true)} className="text-white/50 hover:text-white text-[13px] transition-colors">
            Mot de passe
          </button>
          <button onClick={logout} className="text-white/50 hover:text-white text-[13px] transition-colors">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="px-5 sm:px-8 py-6 sm:py-8 max-w-[1100px] mx-auto">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
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

        {/* Objectif rentabilité — toujours visible */}
        <div className="bg-white rounded-2xl border border-[#E8EDF5] px-6 py-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center ${goalReached ? 'bg-green-50' : 'bg-[#FBF7EC]'}`}>
                <Target size={18} className={goalReached ? 'text-green-600' : 'text-[#C9A84C]'} />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0A1628]">Objectif rentabilité</div>
                <div className="text-[12px] text-[#8A94A6]">
                  {goalReached
                    ? 'Charges fixes couvertes, objectif atteint'
                    : `Plus que ${remaining} chauffeur${remaining > 1 ? 's' : ''} actif${remaining > 1 ? 's' : ''} pour couvrir vos charges fixes`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[24px] font-bold text-[#0A1628] leading-none">
                {activeCount}<span className="text-[#A7B0BF] text-[16px] font-semibold"> / {GOAL_DRIVERS}</span>
              </div>
              <div className="text-[11px] text-[#A7B0BF] mt-1">chauffeurs actifs</div>
            </div>
          </div>
          <div className="h-2.5 bg-[#F0F3F8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${goalPct}%`, backgroundColor: goalReached ? '#16A34A' : '#C9A84C' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-[#8A94A6]">
              Net actuel <span className="font-semibold text-[#0A1628]">{fmtPrice(mrrNet)}</span>
            </span>
            <span className="text-[11px] text-[#8A94A6]">
              Charges fixes <span className="font-semibold text-[#0A1628]">{fmtPrice(FIXED_COSTS)}</span>/mois
            </span>
          </div>
          <p className="text-[10px] text-[#A7B0BF] mt-1.5">
            {fmtPrice(mrrGross)} brut encaissé/mois, soit {fmtPrice(mrrNet)} net après cotisations micro-BNC (~{Math.round(COTISATION_RATE * 100)} %)
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mb-8 bg-[#F4F6FA] rounded-[10px] p-1 w-fit">
          {([['drivers', 'Chauffeurs'], ['billing', 'Facturation']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors',
                activeTab === tab ? 'bg-white text-[#0A1628] shadow-sm' : 'text-[#8A94A6] hover:text-[#5A6477]',
              ].join(' ')}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'drivers' && (<>
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
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {driver.parraine_par && (
                          <span className="text-[11px] text-[#C9A84C] font-medium">
                            Parrainé par {drivers.find(d => d.slug === driver.parraine_par)?.name ?? driver.parraine_par}
                          </span>
                        )}
                        {driver.referral_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                            <Users size={10} />
                            {driver.referral_count} filleul{driver.referral_count > 1 ? 's' : ''}
                          </span>
                        )}
                        {driver.mois_offert_le && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-medium">
                            <Gift size={10} />
                            1 mois offert le {format(new Date(driver.mois_offert_le), 'd MMM yyyy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/dashboard?preview=${driver.id}`}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 border border-blue-100 hover:border-blue-400 hover:bg-blue-50 rounded-[7px] px-3 py-1.5 transition-colors">
                      <Eye size={12} />Dashboard
                    </a>
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
                <div className="px-6 py-4 grid grid-cols-3 gap-y-4 sm:flex sm:items-center sm:gap-5 sm:flex-wrap">
                  <StatPill value={driver.stats.total}     label="Demandes" />
                  <StatPill value={driver.stats.pending}   label="En attente"  alert={driver.stats.pending > 0} />
                  <StatPill value={driver.stats.accepted}  label="Acceptées" />
                  <StatPill value={driver.stats.completed} label="Terminées"   color="text-green-600" />
                  <div className="hidden sm:block w-px h-8 bg-[#E8EDF5] mx-1" />
                  <StatPill value={`${conv}%`}             label="Conversion"  color="text-blue-600" />
                  <StatPill value={fmtPrice(avgTicket)}    label="Ticket moyen" />
                  <div className="hidden sm:block w-px h-8 bg-[#E8EDF5] mx-1" />
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
        </>)}

        {activeTab === 'billing' && (() => {
          const pastDueCount  = drivers.filter(d => d.subscription_status === 'past_due').length
          const cancelledCount= drivers.filter(d => d.subscription_status === 'cancelled').length

          return (
            <>
            {/* KPIs Billing */}
            <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
              {[
                { label: 'MRR', value: fmtPrice(mrrGross), sub: `${activeCount} abonnement${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}`, icon: CreditCard, color: 'text-[#C9A84C]', bg: 'bg-[#FBF7EC]' },
                { label: 'Actifs', value: activeCount, sub: 'Abonnements en cours', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'En retard', value: pastDueCount, sub: pastDueCount > 0 ? 'Paiement échoué' : 'Aucun retard', icon: AlertCircle, color: pastDueCount > 0 ? 'text-red-600' : 'text-[#8A94A6]', bg: pastDueCount > 0 ? 'bg-red-50' : 'bg-[#F4F6FA]' },
                { label: 'Résiliés', value: cancelledCount, sub: 'Comptes fermés', icon: XCircle, color: 'text-[#8A94A6]', bg: 'bg-[#F4F6FA]' },
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

            {/* Tableau abonnements */}
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-4">Abonnements chauffeurs</h2>
            <div className="bg-white rounded-2xl border border-[#E8EDF5] overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-[#F4F6FA] border-b border-[#E8EDF5]">
                {['Chauffeur', 'Statut', 'Dernière facture', 'Début abo.', 'Actions'].map(h => (
                  <span key={h} className="text-[11px] font-semibold text-[#8A94A6] uppercase tracking-wide">{h}</span>
                ))}
              </div>

              {drivers.map((driver, i) => (
                <div key={driver.id} className={[i < drivers.length - 1 ? 'border-b border-[#F0F3F8]' : ''].join(' ')}>
                <div className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:gap-4 md:items-center md:px-6">
                  <div>
                    <div className="text-[13px] font-semibold text-[#0A1628]">{driver.name}</div>
                    <div className="text-[11px] text-[#A7B0BF]">{driver.email}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#A7B0BF] md:hidden">Statut</span>
                    <SubStatusBadge status={driver.subscription_status} />
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block text-[12px] text-[#5A6477]">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#A7B0BF] md:hidden">Dernière facture</span>
                    <span className="text-right md:text-left">
                      {driver.last_invoice
                        ? <>{driver.last_invoice.invoice_number} · {fmtPrice(driver.last_invoice.amount_cents / 100)}</>
                        : <span className="text-[#A7B0BF]">—</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block text-[12px] text-[#5A6477]">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#A7B0BF] md:hidden">Début abo.</span>
                    <span>
                      {driver.subscription_start_at
                        ? format(new Date(driver.subscription_start_at), 'd MMM yyyy', { locale: fr })
                        : <span className="text-[#A7B0BF]">—</span>}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:flex-col md:items-start md:gap-1">
                    {(!driver.subscription_status || driver.subscription_status === 'pending') && (
                      <button
                        onClick={() => handleStripe('activate', driver.id)}
                        disabled={stripeAction !== null}
                        title="Activer manuellement"
                        className="flex items-center gap-1 text-[11px] font-semibold text-green-600 border border-green-200 hover:border-green-400 rounded-[6px] px-2 py-1 transition-colors disabled:opacity-50">
                        {stripeAction === driver.id + 'activate' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                        Activer
                      </button>
                    )}
                    {driver.subscription_status !== 'paused' && driver.stripe_subscription_id && (
                      <button
                        onClick={() => handleStripe('pause', driver.id)}
                        disabled={stripeAction !== null}
                        title="Mettre en pause"
                        className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 border border-amber-200 hover:border-amber-400 rounded-[6px] px-2 py-1 transition-colors disabled:opacity-50">
                        {stripeAction === driver.id + 'pause' ? <Loader2 size={10} className="animate-spin" /> : <PauseCircle size={10} />}
                        Pause
                      </button>
                    )}
                    {driver.stripe_subscription_id && driver.subscription_status !== 'cancelled' && (
                      <button
                        onClick={() => handleStripe('cancel', driver.id)}
                        disabled={stripeAction !== null}
                        title="Résilier"
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-500 border border-red-100 hover:border-red-300 rounded-[6px] px-2 py-1 transition-colors disabled:opacity-50">
                        {stripeAction === driver.id + 'cancel' ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={10} />}
                        Résilier
                      </button>
                    )}
                    {driver.last_invoice && (
                      <button
                        onClick={() => handleResendInvoice(driver.last_invoice!.id)}
                        disabled={stripeAction !== null}
                        title="Renvoyer la dernière facture par email"
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#5A6477] border border-[#E8EDF5] hover:border-[#0A1628] rounded-[6px] px-2 py-1 transition-colors disabled:opacity-50">
                        {stripeAction === driver.last_invoice.invoice_number ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                        Email
                      </button>
                    )}
                    {driver.stripe_customer_id && (
                      <button
                        onClick={() => handleResyncInvoice(driver.id)}
                        disabled={stripeAction !== null}
                        title="Importer les factures manquantes depuis Stripe"
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 border border-blue-100 hover:border-blue-400 rounded-[6px] px-2 py-1 transition-colors disabled:opacity-50">
                        {stripeAction === driver.id + 'resync' ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                        Importer
                      </button>
                    )}
                    {driver.stripe_subscription_id && (
                      <button
                        onClick={() => handleGiftMonth(driver.id)}
                        disabled={giftingMonth !== null || stripeAction !== null}
                        title={driver.mois_offert_le ? `Dernier mois offert le ${format(new Date(driver.mois_offert_le), 'd MMM yyyy', { locale: fr })}` : 'Offrir 1 mois gratuit (parrainage)'}
                        className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 border border-purple-100 hover:border-purple-400 rounded-[6px] px-2 py-1 transition-colors disabled:opacity-50">
                        {giftingMonth === driver.id ? <Loader2 size={10} className="animate-spin" /> : <Gift size={10} />}
                        1 mois offert
                      </button>
                    )}
                  </div>
                </div>
                {(!driver.subscription_status || driver.subscription_status === 'pending') && driver.checkout_url && (
                  <div className="px-6 pb-4">
                    <CopyField label="Lien paiement Stripe — à envoyer au chauffeur" value={driver.checkout_url} />
                  </div>
                )}
                </div>
              ))}
            </div>
            </>
          )
        })()}
      </main>

      {/* Modal ajout */}
      {addOpen && (
        <AddDriverModal
          onClose={() => setAddOpen(false)}
          onCreated={loadDrivers}
          adminToken={adminToken}
        />
      )}

      {/* Modal modification */}
      {editDriver && (
        <EditDriverModal
          driver={editDriver}
          onClose={() => setEditDriver(null)}
          onSaved={loadDrivers}
          adminToken={adminToken}
          allDrivers={drivers}
        />
      )}

      {/* Modal changement mot de passe */}
      {changePwdOpen && (
        <ChangePwdModal
          adminToken={adminToken}
          onClose={() => setChangePwdOpen(false)}
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
