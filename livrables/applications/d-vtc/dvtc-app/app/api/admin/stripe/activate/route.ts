import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAdmin } from '@/lib/admin-auth'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { adminEmail, adminPassword, driverId } = await req.json()

  if (!await validateAdmin(adminEmail, adminPassword)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  await db
    .from('drivers')
    .update({
      subscription_status: 'active',
      subscription_start_at: new Date().toISOString(),
    })
    .eq('id', driverId)

  return NextResponse.json({ ok: true })
}
