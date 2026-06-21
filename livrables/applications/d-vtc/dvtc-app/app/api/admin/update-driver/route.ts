import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAdmin } from '@/lib/admin-auth'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function PATCH(req: NextRequest) {
  const { adminEmail, adminPassword, driverId, userId, name, email, phone } = await req.json()

  if (!await validateAdmin(adminEmail, adminPassword)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { error: dbError } = await admin.from('drivers').update({ name, email, phone: phone || null }).eq('id', driverId)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { email })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
