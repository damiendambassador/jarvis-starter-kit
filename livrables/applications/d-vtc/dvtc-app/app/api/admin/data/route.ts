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
    .select('id, name, email, slug, created_at')
    .order('created_at', { ascending: false })

  const driversWithStats = await Promise.all(
    (drivers ?? []).map(async (driver) => {
      const { data: reservations } = await admin
        .from('reservations')
        .select('status, price_estimate')
        .eq('driver_id', driver.id)

      const all = reservations ?? []
      const pending   = all.filter(r => r.status === 'pending').length
      const accepted  = all.filter(r => r.status === 'accepted').length
      const completed = all.filter(r => r.status === 'completed').length
      const revenue   = all
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.price_estimate ?? 0), 0)

      return { ...driver, stats: { total: all.length, pending, accepted, completed, revenue } }
    })
  )

  return NextResponse.json({ drivers: driversWithStats })
}
