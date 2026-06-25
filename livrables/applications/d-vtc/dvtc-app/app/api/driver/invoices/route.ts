import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveActor, type Actor } from '@/lib/actor-auth'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function targetDriver(actor: Actor, requested: string | null): string | null {
  return actor.kind === 'admin' ? requested : actor.driverId
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor(req)
  if (!actor) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const driverId = targetDriver(actor, new URL(req.url).searchParams.get('driverId'))
  if (!driverId) return NextResponse.json({ error: 'driverId requis' }, { status: 400 })

  const { data, error } = await db
    .from('invoices')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
