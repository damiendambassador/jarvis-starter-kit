import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { adminEmail, adminPassword, driverId } = await req.json()

  if (adminEmail !== process.env.ADMIN_EMAIL || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: driver } = await db
    .from('drivers')
    .select('stripe_subscription_id')
    .eq('id', driverId)
    .single()

  if (!driver?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Aucun abonnement Stripe trouvé' }, { status: 404 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  await stripe.subscriptions.update(driver.stripe_subscription_id, {
    pause_collection: { behavior: 'void' },
  })

  await db.from('drivers').update({ subscription_status: 'paused' }).eq('id', driverId)

  return NextResponse.json({ ok: true })
}
