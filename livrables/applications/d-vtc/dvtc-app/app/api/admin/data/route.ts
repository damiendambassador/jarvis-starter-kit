import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: drivers } = await admin
    .from('drivers')
    .select('id, user_id, name, email, phone, slug, created_at, stripe_customer_id, stripe_subscription_id, subscription_status, cgv_accepted_at, subscription_start_at')
    .order('created_at', { ascending: false })

  const driversWithStats = await Promise.all(
    (drivers ?? []).map(async (driver) => {
      const [{ data: reservations }, { data: lastInvoice }] = await Promise.all([
        admin.from('reservations').select('status, price_estimate').eq('driver_id', driver.id),
        admin.from('invoices').select('id, invoice_number, amount_cents, status, paid_at').eq('driver_id', driver.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      const all = reservations ?? []
      const pending   = all.filter(r => r.status === 'pending').length
      const accepted  = all.filter(r => r.status === 'accepted').length
      const completed = all.filter(r => r.status === 'completed').length
      const revenue   = all
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.price_estimate ?? 0), 0)

      return { ...driver, stats: { total: all.length, pending, accepted, completed, revenue }, last_invoice: lastInvoice ?? null }
    })
  )

  return NextResponse.json({ drivers: driversWithStats })
}
