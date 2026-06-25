import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveActor } from '@/lib/actor-auth'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const actor = await resolveActor(req)
  if (!actor) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const invoiceId = req.nextUrl.searchParams.get('invoice_id')
  if (!invoiceId) return NextResponse.json({ error: 'invoice_id requis' }, { status: 400 })

  const { data: invoice } = await db
    .from('invoices')
    .select('pdf_storage_path, driver_id')
    .eq('id', invoiceId)
    .single()

  if (!invoice?.pdf_storage_path) {
    return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 })
  }

  // Un chauffeur ne peut récupérer que ses propres factures.
  if (actor.kind === 'driver' && invoice.driver_id !== actor.driverId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data } = await db.storage
    .from('invoices')
    .createSignedUrl(invoice.pdf_storage_path, 3600)

  if (!data?.signedUrl) {
    return NextResponse.json({ error: 'Impossible de générer le lien' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
