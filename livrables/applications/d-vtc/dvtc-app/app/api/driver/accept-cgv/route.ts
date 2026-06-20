import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { driverId } = await req.json()
  if (!driverId) return NextResponse.json({ error: 'driverId requis' }, { status: 400 })

  const { error } = await db
    .from('drivers')
    .update({ cgv_accepted_at: new Date().toISOString() })
    .eq('id', driverId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
