'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase, type Driver } from '@/lib/supabase'
import { authedFetch } from '@/lib/authed-fetch'
import { DashboardContext } from './_context'
import Sidebar, { MobileTopBar, MobileBottomNav } from './_sidebar'
import RealtimeNotif from './_notif'
import { Loader2, FileText, CreditCard, ShieldCheck } from 'lucide-react'

function PaymentWall({ driver }: { driver: Driver }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF5] w-full max-w-[460px] p-10 text-center">
        <div className="w-14 h-14 rounded-[14px] bg-[#FBF7EC] border border-[#EAD9A8] flex items-center justify-center mx-auto mb-6">
          <CreditCard size={24} className="text-[#C9A84C]" />
        </div>
        <h2 className="text-[20px] font-bold text-[#0A1628] mb-2">Abonnement non activé</h2>
        <p className="text-[13px] text-[#5A6477] leading-[1.6] mb-7">
          Votre espace D-VTC est prêt. Pour y accéder, activez votre abonnement mensuel via le lien reçu dans votre email de bienvenue.
        </p>
        {driver.checkout_url && (
          <a
            href={driver.checkout_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#0A1628] text-white rounded-[10px] py-3.5 text-[14px] font-semibold hover:opacity-90 transition-opacity mb-4">
            Activer mon abonnement — 74€/mois →
          </a>
        )}
        <p className="text-[11px] text-[#A7B0BF]">
          Vous recevrez un email d'accès dès votre paiement confirmé.
          <br />Une question ? <a href="mailto:damiendambassador@gmail.com" className="underline">damiendambassador@gmail.com</a>
        </p>
      </div>
    </div>
  )
}

function CGVModal({ driver, onAccepted }: { driver: Driver; onAccepted: () => void }) {
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  async function accept() {
    if (!checked) return
    setLoading(true)
    await authedFetch('/api/driver/accept-cgv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: driver.id }),
    })
    setLoading(false)
    onAccepted()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[580px] max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-[#F0F3F8] flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-[9px] bg-[#F4F6FA] flex items-center justify-center">
            <FileText size={18} className="text-[#0A1628]" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-[#0A1628]">Conditions Générales de Vente</h2>
            <p className="text-[12px] text-[#8A94A6]">Veuillez lire et accepter les CGV pour accéder à votre espace</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 text-[13px] leading-[1.7] text-[#3A4456] space-y-4">
          <p><strong className="text-[#0A1628]">Art. 1 — Objet :</strong> D-VTC est une plateforme SaaS permettant aux chauffeurs VTC indépendants de gérer leurs réservations directes et leur clientèle.</p>
          <p><strong className="text-[#0A1628]">Art. 2 — Prestataire :</strong> D Embassy, micro-entrepreneur, SIRET 10073363300018, APE 7022Z, Ivry-sur-Seine (94200).</p>
          <p><strong className="text-[#0A1628]">Art. 3 — Prix :</strong> Abonnement mensuel de <strong>74,00 €</strong>. TVA non applicable (art. 293B CGI). Facture émise automatiquement à chaque paiement.</p>
          <p><strong className="text-[#0A1628]">Art. 4 — Paiement :</strong> Prélèvement mensuel automatique par carte bancaire via Stripe. En cas d'échec répété, l'accès est suspendu.</p>
          <p><strong className="text-[#0A1628]">Art. 5 — Résiliation :</strong> Sans engagement. Résiliation possible à tout moment par email. Prise d'effet en fin de période, sans remboursement au prorata.</p>
          <p><strong className="text-[#0A1628]">Art. 6 — Service :</strong> Disponibilité cible 99%/mois. Support email sous 48h ouvrées.</p>
          <p><strong className="text-[#0A1628]">Art. 7 — Obligations :</strong> Utilisation conforme à la loi française. Compte non cessible. Données exactes.</p>
          <p><strong className="text-[#0A1628]">Art. 8 — RGPD :</strong> Données hébergées dans l'UE (Supabase EU). Droits d'accès, rectification et effacement sur demande.</p>
          <p><strong className="text-[#0A1628]">Art. 9 — Responsabilité :</strong> Limitée aux 12 derniers mois d'abonnement. Pas de responsabilité sur les revenus du chauffeur.</p>
          <p><strong className="text-[#0A1628]">Art. 10 — Droit applicable :</strong> Droit français. Tribunal d'Ivry-sur-Seine.</p>
          <a href="/cgv" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#0A1628] font-semibold underline underline-offset-2 text-[13px]">
            <FileText size={13} />Lire les CGV complètes
          </a>
        </div>

        <div className="px-6 py-5 border-t border-[#F0F3F8] flex-shrink-0 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#0A1628] cursor-pointer"
            />
            <span className="text-[13px] text-[#3A4456] leading-[1.5]">
              J'ai lu et j'accepte les Conditions Générales de Vente de D-VTC, ainsi que l'abonnement mensuel de 74 € prélevé automatiquement.
            </span>
          </label>
          <button
            onClick={accept}
            disabled={!checked || loading}
            className="w-full bg-[#0A1628] text-white rounded-[9px] py-3 text-[14px] font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Confirmer et accéder à mon espace
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [cgvAccepted, setCgvAccepted] = useState(true)
  const [subscriptionPending, setSubscriptionPending] = useState(false)
  const [adminPreview, setAdminPreview] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/dashboard/login') return

    const previewDriverId = new URLSearchParams(window.location.search).get('preview')

    if (previewDriverId) {
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) { router.replace('/dashboard/login'); return }

      fetch('/api/admin/get-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken, driverId: previewDriverId }),
      })
        .then(r => r.json())
        .then(({ driver: data }) => {
          if (!data) { router.replace('/admin/dashboard'); return }
          setDriver(data)
          setAdminPreview(true)
          setLoading(false)
        })
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/dashboard/login'); return }
      supabase.from('drivers').select('*').eq('user_id', session.user.id).single()
        .then(({ data }) => {
          if (!data) { router.replace('/dashboard/login'); return }
          setDriver(data)
          setCgvAccepted(!!data.cgv_accepted_at)
          setSubscriptionPending(!data.subscription_status || data.subscription_status === 'pending')
          setLoading(false)
        })
    })
  }, [])

  if (pathname === '/dashboard/login') return <>{children}</>

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Loader2 className="animate-spin text-navy" size={32} />
    </div>
  )

  if (!driver) return null

  if (subscriptionPending && !adminPreview) return <PaymentWall driver={driver} />

  return (
    <DashboardContext.Provider value={{ driver, adminPreview }}>
      {adminPreview && (
        <div className="bg-amber-400 text-[#0A1628] text-center py-2 text-[12px] font-semibold flex items-center justify-center gap-3 sticky top-0 z-50">
          <ShieldCheck size={13} />
          Vue admin — Tableau de bord de {driver.name}
          <a href="/admin/dashboard" className="underline underline-offset-2 hover:opacity-70 transition-opacity">
            ← Retour admin
          </a>
        </div>
      )}
      <div className="flex min-h-[100dvh]">
        <Sidebar driver={driver} />
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileTopBar driver={driver} />
          <main className="flex-1 min-w-0 w-full max-w-[1080px] mx-auto px-4 md:px-[34px] py-5 md:py-[30px] pb-[calc(72px_+_env(safe-area-inset-bottom))] md:pb-[60px] animate-fade-soft">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
      {!adminPreview && <RealtimeNotif driverId={driver.id} />}
      {!cgvAccepted && !adminPreview && (
        <CGVModal driver={driver} onAccepted={() => setCgvAccepted(true)} />
      )}
    </DashboardContext.Provider>
  )
}
