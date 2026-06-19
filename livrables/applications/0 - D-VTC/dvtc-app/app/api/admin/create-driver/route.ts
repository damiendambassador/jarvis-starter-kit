import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function toSlug(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  const { adminEmail, adminPassword, name, email, slug, password } = await req.json()

  if (adminEmail !== process.env.ADMIN_EMAIL || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const finalSlug = slug || toSlug(name)

  const { data: existing } = await admin.from('drivers').select('id').eq('slug', finalSlug).single()
  if (existing) return NextResponse.json({ error: 'Ce slug est déjà utilisé. Choisissez-en un autre.' }, { status: 400 })

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const userId = authData.user.id

  const { data: driver, error: driverError } = await admin.from('drivers').insert({
    user_id: userId,
    name,
    email,
    slug: finalSlug,
    vehicle_capacity: 4,
    is_active: true,
  }).select().single()

  if (driverError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: driverError.message }, { status: 400 })
  }

  const { error: pricingError } = await admin.from('pricing').insert({
    driver_id: driver.id,
    base_fare: 8.00,
    price_per_km: 1.80,
    night_surcharge: 0.20,
    dispo_2h: 80.00,
    dispo_day: 280.00,
    km_included_dispo: 50,
    loyalty_threshold: 5,
    loyalty_discount: 0.10,
  })

  if (pricingError) {
    await admin.from('drivers').delete().eq('id', driver.id)
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: pricingError.message }, { status: 400 })
  }

  return NextResponse.json({ driver })
}
