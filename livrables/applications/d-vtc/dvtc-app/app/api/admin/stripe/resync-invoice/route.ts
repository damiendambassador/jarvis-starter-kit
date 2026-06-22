import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { generateInvoicePDF } from '@/lib/invoice-pdf'
import { validateAdmin } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { adminEmail, adminPassword, driverId } = await req.json()

  if (!await validateAdmin(adminEmail, adminPassword)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: driver } = await db
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .single()

  if (!driver) return NextResponse.json({ error: 'Chauffeur introuvable' }, { status: 404 })
  if (!driver.stripe_customer_id) return NextResponse.json({ error: 'Aucun client Stripe associé' }, { status: 400 })

  /* Récupère toutes les invoices payées depuis Stripe */
  const stripeInvoices = await stripe.invoices.list({
    customer: driver.stripe_customer_id,
    status: 'paid',
    limit: 100,
  })

  let inserted = 0

  for (const inv of stripeInvoices.data) {
    /* Idempotence : ignorer si déjà en base */
    const { data: existing } = await db
      .from('invoices')
      .select('id')
      .eq('stripe_invoice_id', inv.id)
      .single()
    if (existing) continue

    const { data: numRow } = await db.rpc('next_invoice_number')
    const invoiceNumber = numRow as string

    const lineItem  = inv.lines?.data?.[0]
    const periodStart = lineItem?.period?.start
      ? new Date(lineItem.period.start * 1000).toISOString().slice(0, 10)
      : null
    const periodEnd = lineItem?.period?.end
      ? new Date(lineItem.period.end * 1000).toISOString().slice(0, 10)
      : null

    let pdfPath: string | null = null
    try {
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber,
        driverName:      driver.name,
        driverEmail:     driver.email,
        amountCents:     inv.amount_paid,
        periodStart:     periodStart ?? '',
        periodEnd:       periodEnd ?? '',
        paidAt:          new Date(inv.status_transitions?.paid_at
          ? inv.status_transitions.paid_at * 1000
          : Date.now()).toLocaleDateString('fr-FR'),
        stripeInvoiceId: inv.id,
      })
      pdfPath = `${driver.id}/${invoiceNumber}.pdf`
      await db.storage.from('invoices').upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })
    } catch { /* PDF non bloquant */ }

    await db.from('invoices').insert({
      driver_id:         driver.id,
      stripe_invoice_id: inv.id,
      invoice_number:    invoiceNumber,
      amount_cents:      inv.amount_paid,
      currency:          inv.currency,
      status:            'paid',
      period_start:      periodStart,
      period_end:        periodEnd,
      pdf_storage_path:  pdfPath,
      paid_at:           new Date(inv.status_transitions?.paid_at
        ? inv.status_transitions.paid_at * 1000
        : Date.now()).toISOString(),
      due_date:          periodEnd,
    })
    inserted++
  }

  return NextResponse.json({ ok: true, inserted })
}
