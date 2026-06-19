import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function DELETE(req: NextRequest) {
  const { adminEmail, adminPassword, driverId, userId } = await req.json()

  if (adminEmail !== process.env.ADMIN_EMAIL || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  await admin.from('pricing').delete().eq('driver_id', driverId)
  await admin.from('unavailabilities').delete().eq('driver_id', driverId)
  await admin.from('reservations').delete().eq('driver_id', driverId)
  await admin.from('drivers').delete().eq('id', driverId)
  await admin.auth.admin.deleteUser(userId)

  return NextResponse.json({ success: true })
}
