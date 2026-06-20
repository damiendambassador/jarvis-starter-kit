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

  // Essaie d'abord avec les colonnes Stripe (après migration), sinon fallback colonnes de base
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let drivers: any[] | null = null

  const { data: fullDrivers, error: driversError } = await admin
    .from('drivers')
    .select('id, user_id, name, email, phone, slug, created_at, stripe_customer_id, stripe_subscription_id, subscription_status, cgv_accepted_at, subscription_start_at')
    .order('created_at', { ascending: false })

  if (driversError) {
    const { data: basicDrivers } = await admin
      .from('drivers')
      .select('id, user_id, name, email, phone, slug, created_at')
      .order('created_at', { ascending: false })
    drivers = basicDrivers
  } else {
    drivers = fullDrivers
  }

  const driversWithStats = await Promise.all(
    (drivers ?? []).map(async (driver) => {
      const { data: reservations } = await admin
        .from('reservations')
        .select('status, price_estimate')
        .eq('driver_id', driver.id)

      // Tente de récupérer la dernière facture — la table peut ne pas encore exister
      let lastInvoice = null
      try {
        const { data } = await admin
          .from('invoices')
          .select('id, invoice_number, amount_cents, status, paid_at')
          .eq('driver_id', driver.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        lastInvoice = data
      } catch { /* table invoices pas encore créée */ }

      const all = reservations ?? []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pending   = all.filter((r: any) => r.status === 'pending').length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accepted  = all.filter((r: any) => r.status === 'accepted').length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completed = all.filter((r: any) => r.status === 'completed').length
      const revenue   = all
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((r: any) => r.status === 'completed')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce((sum: number, r: any) => sum + (r.price_estimate ?? 0), 0)

      return { ...driver, stats: { total: all.length, pending, accepted, completed, revenue }, last_invoice: lastInvoice ?? null }
    })
  )

  return NextResponse.json({ drivers: driversWithStats })
}
