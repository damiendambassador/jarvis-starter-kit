import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAdminRequest } from '@/lib/admin-auth'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { driverId, userId, name, email, phone, parraine_par } = body

  if (!await validateAdminRequest(body)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const updates: Record<string, unknown> = { name, email, phone: phone || null }
  if (parraine_par !== undefined) updates.parraine_par = parraine_par || null

  const { error: dbError } = await admin.from('drivers').update(updates).eq('id', driverId)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { email })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
