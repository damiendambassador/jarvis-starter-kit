import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAdmin } from '@/lib/admin-auth'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { adminEmail, adminPassword, driverId } = await req.json()

  if (!await validateAdmin(adminEmail, adminPassword)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: driver, error } = await admin
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .single()

  if (error || !driver) {
    return NextResponse.json({ error: 'Chauffeur introuvable' }, { status: 404 })
  }

  return NextResponse.json({ driver })
}
