import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { validateAdminRequest } from '@/lib/admin-auth'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { invoiceId } = body

  if (!await validateAdminRequest(body)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: invoice } = await db
    .from('invoices')
    .select('*, drivers(name,email)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

  const driver = invoice.drivers as { name: string; email: string }

  /* Récupérer le PDF depuis Supabase Storage */
  let pdfBuffer: Buffer | null = null
  if (invoice.pdf_storage_path) {
    const { data: file } = await db.storage
      .from('invoices')
      .download(invoice.pdf_storage_path)
    if (file) pdfBuffer = Buffer.from(await file.arrayBuffer())
  }

  await resend.emails.send({
    from: `D-VTC <${FROM}>`,
    to:   driver.email,
    subject: `Renvoi — Facture ${invoice.invoice_number} D-VTC`,
    html: `<p>Bonjour ${driver.name.split(' ')[0]},<br><br>Veuillez trouver ci-joint votre facture <strong>${invoice.invoice_number}</strong>.</p>`,
    attachments: pdfBuffer ? [{
      filename: `${invoice.invoice_number}.pdf`,
      content:  pdfBuffer,
    }] : undefined,
  })

  return NextResponse.json({ ok: true })
}
