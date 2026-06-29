'use client'

import { useEffect, useState } from 'react'
import { useDashboard } from '../_context'
import { supabase } from '@/lib/supabase'
import { authedFetch } from '@/lib/authed-fetch'
import { Download, Loader2, Receipt, CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Invoice = {
  id: string
  invoice_number: string
  amount_cents: number
  currency: string
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'void'
  period_start: string | null
  period_end: string | null
  paid_at: string | null
  created_at: string
  pdf_storage_path: string | null
}

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const map = {
    paid:    { label: 'Payée',    cls: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
    failed:  { label: 'Échouée', cls: 'bg-red-100 text-red-600',      icon: XCircle },
    pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-700', icon: Clock },
    draft:   { label: 'Brouillon', cls: 'bg-[#F4F6FA] text-[#8A94A6]', icon: Clock },
    void:    { label: 'Annulée',  cls: 'bg-[#F4F6FA] text-[#8A94A6]',  icon: XCircle },
  }
  const { label, cls, icon: Icon } = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  )
}

function fmtAmount(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return format(new Date(d), 'd MMM yyyy', { locale: fr })
}

function DownloadBtn({ inv, downloading, onClick, className = '' }: {
  inv: Invoice; downloading: string | null; onClick: () => void; className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={!inv.pdf_storage_path || downloading === inv.id}
      title={inv.pdf_storage_path ? 'Télécharger le PDF' : 'PDF non disponible'}
      className={`inline-flex flex-shrink-0 items-center justify-center p-2 rounded-[7px] border border-[#E8EDF5] hover:bg-[#F4F6FA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${className}`}>
      {downloading === inv.id
        ? <Loader2 size={15} className="animate-spin text-[#8A94A6]" />
        : <Download size={15} className="text-[#5A6477]" />}
    </button>
  )
}

export default function FacturesPage() {
  const { driver, adminPreview } = useDashboard()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      let data: Invoice[] | null = null
      if (adminPreview) {
        const res = await authedFetch(`/api/driver/invoices?driverId=${driver.id}`, {}, { adminPreview })
        data = (await res.json()).data
      } else {
        const r = await supabase
          .from('invoices')
          .select('*')
          .eq('driver_id', driver.id)
          .order('created_at', { ascending: false })
        data = r.data as Invoice[]
      }
      setInvoices(data ?? [])
      setLoading(false)
    }
    load()
  }, [driver.id])

  async function downloadPdf(invoice: Invoice) {
    if (!invoice.pdf_storage_path) return
    setDownloading(invoice.id)
    const res = await authedFetch(`/api/driver/invoice-url?invoice_id=${invoice.id}`, {}, { adminPreview })
    const data = await res.json()
    if (data.url) {
      const a = document.createElement('a')
      a.href = data.url
      a.target = '_blank'
      a.rel = 'noopener'
      a.click()
    }
    setDownloading(null)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-[10px] bg-[#F4F6FA] flex items-center justify-center">
          <Receipt size={20} className="text-[#0A1628]" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-[#0A1628]">Mes factures</h1>
          <p className="text-[13px] text-[#8A94A6]">Historique de vos abonnements D-VTC</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#0A1628]" size={28} />
        </div>
      ) : !driver.subscription_status || driver.subscription_status === 'pending' ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#EAD9A8] px-12 py-16 text-center">
          <div className="w-12 h-12 rounded-[12px] bg-[#FBF7EC] flex items-center justify-center mx-auto mb-4">
            <CreditCard size={22} className="text-[#C9A84C]" />
          </div>
          <p className="text-[14px] font-semibold text-[#0A1628] mb-1">Abonnement non activé</p>
          <p className="text-[12px] text-[#8A94A6] mb-5">Activez votre abonnement pour accéder à D-VTC. Vos factures apparaîtront ici après chaque paiement.</p>
          {driver.checkout_url && (
            <a href={driver.checkout_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0A1628] text-white rounded-[9px] px-5 py-2.5 text-[13px] font-semibold hover:opacity-90 transition-opacity">
              Activer mon abonnement — 74€/mois →
            </a>
          )}
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D6DEEA] px-12 py-16 text-center">
          <Receipt size={32} className="text-[#D6DEEA] mx-auto mb-4" />
          <p className="text-[14px] text-[#8A94A6]">Aucune facture pour le moment.</p>
          <p className="text-[12px] text-[#A7B0BF] mt-1">Vos factures apparaîtront ici après votre premier paiement.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8EDF5] overflow-hidden">
          {/* En-tête tableau (desktop) */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-[#F4F6FA] border-b border-[#E8EDF5]">
            {['N° Facture', 'Période', 'Montant', 'Statut', ''].map(h => (
              <span key={h} className="text-[11px] font-semibold text-[#8A94A6] uppercase tracking-wide">{h}</span>
            ))}
          </div>

          {invoices.map((inv, i) => (
            <div
              key={inv.id}
              className={[
                'flex flex-col gap-2.5 px-5 py-4 md:grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:gap-4 md:items-center md:py-4 md:px-6',
                i < invoices.length - 1 ? 'border-b border-[#F0F3F8]' : '',
              ].join(' ')}>
              {/* N° facture + bouton (le bouton ne s'affiche ici que sur mobile) */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#0A1628]">{inv.invoice_number}</div>
                  <div className="text-[11px] text-[#A7B0BF]">{fmtDate(inv.created_at)}</div>
                </div>
                <DownloadBtn inv={inv} downloading={downloading} onClick={() => downloadPdf(inv)} className="md:hidden" />
              </div>
              {/* Période */}
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#A7B0BF] md:hidden">Période</span>
                <span className="text-[13px] text-[#5A6477] text-right md:text-left">
                  {inv.period_start && inv.period_end
                    ? `${fmtDate(inv.period_start)} → ${fmtDate(inv.period_end)}`
                    : '—'}
                </span>
              </div>
              {/* Montant */}
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#A7B0BF] md:hidden">Montant</span>
                <span className="text-[14px] font-bold text-[#0A1628]">{fmtAmount(inv.amount_cents)}</span>
              </div>
              {/* Statut */}
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#A7B0BF] md:hidden">Statut</span>
                <StatusBadge status={inv.status} />
              </div>
              {/* Bouton (desktop, dernière colonne) */}
              <DownloadBtn inv={inv} downloading={downloading} onClick={() => downloadPdf(inv)} className="hidden md:flex" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
