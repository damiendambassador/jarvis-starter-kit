import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import Stripe from 'stripe'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const BASE   = 'https://d-vtc.fr'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

function toSlug(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
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
    email, password, email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const userId = authData.user.id

  const { data: driver, error: driverError } = await admin.from('drivers').insert({
    user_id: userId, name, email, slug: finalSlug, vehicle_capacity: 4, is_active: true,
  }).select().single()

  if (driverError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: driverError.message }, { status: 400 })
  }

  const { error: pricingError } = await admin.from('pricing').insert({
    driver_id: driver.id,
    base_fare: 8.00, price_per_km: 1.80, night_surcharge: 0.20,
    dispo_2h: 80.00, dispo_day: 280.00, km_included_dispo: 50,
    loyalty_threshold: 5, loyalty_discount: 0.10,
  })

  if (pricingError) {
    await admin.from('drivers').delete().eq('id', driver.id)
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: pricingError.message }, { status: 400 })
  }

  /* ── Stripe : customer + checkout session ── */
  let stripeCustomerId: string | null = null
  let checkoutUrl: string | null = null

  if (stripe && process.env.STRIPE_PRICE_ID) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { driver_id: driver.id },
      })
      stripeCustomerId = customer.id

      await admin.from('drivers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', driver.id)

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
        success_url: `${BASE}/dashboard?subscription=success`,
        cancel_url:  `${BASE}/dashboard?subscription=cancelled`,
        metadata: { driver_id: driver.id },
      })
      checkoutUrl = session.url

      if (checkoutUrl) {
        await admin.from('drivers').update({ checkout_url: checkoutUrl }).eq('id', driver.id)
      }
    } catch (err) {
      console.error('[create-driver] Stripe error:', err)
    }
  }

  /* ── Email 1 : activation abonnement (sans identifiants) ── */
  const ctaSection = checkoutUrl
    ? `<div style="text-align:center;margin:0 0 24px">
        <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#0A1628">74 €/mois</p>
        <p style="margin:0 0 16px;font-size:13px;color:#8A94A6">Sans engagement · TVA non applicable (art. 293B CGI)</p>
        <a href="${esc(checkoutUrl)}" style="display:inline-block;background:#0A1628;color:white;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none">
          Activer mon abonnement →
        </a>
      </div>`
    : `<div style="background:#F8F9FB;border:1px solid #E8EDF5;border-radius:10px;padding:22px 22px 8px;margin:0 0 24px">
        <p style="margin:0 0 18px;font-size:11px;font-weight:700;color:#8A94A6;text-transform:uppercase;letter-spacing:.08em">Prochaines étapes</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px">
          <tr>
            <td style="width:30px;vertical-align:top;padding-top:1px">
              <div style="width:22px;height:22px;border-radius:50%;background:#0A1628;color:white;font-size:11px;font-weight:700;text-align:center;line-height:22px">1</div>
            </td>
            <td style="padding-left:10px">
              <div style="font-size:13px;font-weight:600;color:#0A1628;margin-bottom:4px">Recevoir votre lien de paiement</div>
              <div style="font-size:12px;color:#5A6477;line-height:1.6">Je vous l'enverrai directement par email. En cas de problème : <a href="mailto:damiendambassador@gmail.com" style="color:#0A1628">damiendambassador@gmail.com</a></div>
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px">
          <tr>
            <td style="width:30px;vertical-align:top;padding-top:1px">
              <div style="width:22px;height:22px;border-radius:50%;background:#0A1628;color:white;font-size:11px;font-weight:700;text-align:center;line-height:22px">2</div>
            </td>
            <td style="padding-left:10px">
              <div style="font-size:13px;font-weight:600;color:#0A1628;margin-bottom:4px">Activer votre abonnement (74€/mois)</div>
              <div style="font-size:12px;color:#5A6477;line-height:1.6">Renseignez votre carte bancaire via le lien Stripe reçu par email.</div>
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px">
          <tr>
            <td style="width:30px;vertical-align:top;padding-top:1px">
              <div style="width:22px;height:22px;border-radius:50%;background:#0A1628;color:white;font-size:11px;font-weight:700;text-align:center;line-height:22px">3</div>
            </td>
            <td style="padding-left:10px">
              <div style="font-size:13px;font-weight:600;color:#0A1628;margin-bottom:4px">Accéder à votre tableau de bord</div>
              <div style="font-size:12px;color:#5A6477;line-height:1.6">Un email avec votre lien d'accès vous sera envoyé dès la confirmation du paiement.</div>
            </td>
          </tr>
        </table>
      </div>`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Activez votre accès D-VTC, ${esc(name.split(' ')[0])}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0A1628">
        <div style="background:#0A1628;color:white;padding:28px 24px;border-radius:10px 10px 0 0">
          <p style="margin:0 0 6px;font-size:11px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase">D-VTC — Inscription</p>
          <h1 style="margin:0;font-size:24px;font-weight:700">Bienvenue, ${esc(name.split(' ')[0])} !</h1>
        </div>
        <div style="background:white;border:1px solid #E8EDF5;border-top:none;padding:28px 24px;border-radius:0 0 10px 10px">
          <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 24px">
            Votre espace chauffeur D-VTC est prêt. Pour y accéder, activez votre abonnement en cliquant ci-dessous.
          </p>

          <div style="background:#F4F6FA;border-radius:10px;padding:24px;margin:0 0 20px">
            ${ctaSection}
          </div>

          <div style="background:#F4F6FA;border-radius:8px;padding:18px;margin:0 0 20px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#8A94A6;text-transform:uppercase;letter-spacing:.08em">Votre page de réservation client</p>
            <p style="margin:0 0 8px;font-size:12px;color:#5A6477">Partagez ce lien à vos clients dès maintenant :</p>
            <a href="${BASE}/r/${finalSlug}" style="font-size:14px;font-weight:700;color:#0A1628;word-break:break-all">${BASE}/r/${finalSlug}</a>
          </div>

          <a href="https://d-vtc.fr/cgv" style="display:inline-block;font-size:12px;font-weight:600;color:#8A94A6;text-decoration:underline">Lire les CGV complètes →</a>
        </div>
      </div>`,
  }).catch((err) => console.error('[create-driver] Resend email error:', err))

  return NextResponse.json({ driver, checkoutUrl })
}
