import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveActor, type Actor } from '@/lib/actor-auth'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

/** driver_id autorisé : celui du chauffeur connecté, ou celui demandé si admin. */
function targetDriver(actor: Actor, requested: string | null): string | null {
  return actor.kind === 'admin' ? requested : actor.driverId
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor(req)
  if (!actor) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const driverId = targetDriver(actor, searchParams.get('driverId'))
  const from     = searchParams.get('from')
  const to       = searchParams.get('to')
  if (!driverId || !from || !to) {
    return NextResponse.json({ error: 'Params manquants' }, { status: 400 })
  }
  const { data, error } = await db
    .from('unavailabilities')
    .select('*')
    .eq('driver_id', driverId)
    .gte('date', from)
    .lte('date', to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor(req)
  if (!actor) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const driverId = targetDriver(actor, body.driverId)
  const { date, startTime, endTime, label } = body
  if (!driverId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const { data, error } = await db
    .from('unavailabilities')
    .insert({
      driver_id:  driverId,
      date,
      start_time: startTime,
      end_time:   endTime,
      label:      label || 'Indisponible',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveActor(req)
  if (!actor) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const driverId = targetDriver(actor, body.driverId)
  const { unavailId } = body
  if (!unavailId || !driverId) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const { error } = await db
    .from('unavailabilities')
    .delete()
    .eq('id', unavailId)
    .eq('driver_id', driverId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
