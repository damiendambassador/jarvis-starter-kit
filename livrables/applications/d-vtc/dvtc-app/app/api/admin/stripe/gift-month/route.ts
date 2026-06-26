import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAdminRequest } from '@/lib/admin-auth'
import Stripe from 'stripe'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { driverId } = body

  if (!await validateAdminRequest(body)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
  }

  const { data: driver, error } = await admin
    .from('drivers')
    .select('stripe_subscription_id, mois_offert_le')
    .eq('id', driverId)
    .single()

  if (error || !driver) {
    return NextResponse.json({ error: 'Chauffeur introuvable' }, { status: 404 })
  }

  if (driver.mois_offert_le) {
    return NextResponse.json({ error: 'Un mois gratuit a déjà été offert à ce chauffeur.' }, { status: 400 })
  }

  if (!driver.stripe_subscription_id) {
    return NextResponse.json({ error: "Ce chauffeur n'a pas d'abonnement Stripe actif." }, { status: 400 })
  }

  try {
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once',
      name: 'Parrainage — 1 mois offert',
    })

    await stripe.subscriptions.update(driver.stripe_subscription_id, {
      coupon: coupon.id,
    })

    await admin
      .from('drivers')
      .update({ mois_offert_le: new Date().toISOString() })
      .eq('id', driverId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[gift-month]', err)
    return NextResponse.json({ error: 'Erreur Stripe lors de l\'application du coupon' }, { status: 500 })
  }
}
