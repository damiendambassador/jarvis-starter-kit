import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAdmin } from '@/lib/admin-auth'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function DELETE(req: NextRequest) {
  const { adminEmail, adminPassword, reservationId } = await req.json()

  if (!await validateAdmin(adminEmail, adminPassword)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!reservationId) {
    return NextResponse.json({ error: 'reservationId manquant' }, { status: 400 })
  }

  const { error } = await admin.from('reservations').delete().eq('id', reservationId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
