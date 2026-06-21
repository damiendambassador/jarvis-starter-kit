import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const driverId = searchParams.get('driverId')
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
  const { driverId, date, startTime, endTime, label } = await req.json()
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
  const { unavailId, driverId } = await req.json()
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
