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
        consent_collection: { terms_of_service: 'required' },
      })
      checkoutUrl = session.url
    } catch {
      /* Stripe non-bloquant — le chauffeur pourra payer plus tard */
    }
  }

  /* ── Email de bienvenue ── */
  const checkoutSection = checkoutUrl ? `
    <div style="background:#F4F6FA;border-radius:8px;padding:18px;margin:0 0 20px;border:1px solid #E8EDF5">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#8A94A6;text-transform:uppercase;letter-spacing:.08em">Activer votre abonnement (74€/mois)</p>
      <p style="margin:0 0 12px;font-size:13px;color:#5A6477;line-height:1.5">Cliquez sur le lien ci-dessous pour renseigner votre carte bancaire et activer votre accès complet.</p>
      <a href="${esc(checkoutUrl)}" style="display:inline-block;background:#0A1628;color:white;font-size:14px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none">
        Activer mon abonnement D-VTC →
      </a>
    </div>` : ''

  await resend.emails.send({
    from: `D-VTC <${FROM}>`,
    to: email,
    subject: `Bienvenue sur D-VTC, ${esc(name.split(' ')[0])} — vos accès`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0A1628">
        <div style="background:#0A1628;color:white;padding:28px 24px;border-radius:10px 10px 0 0">
          <p style="margin:0 0 6px;font-size:11px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase">D-VTC — Bienvenue</p>
          <h1 style="margin:0;font-size:24px;font-weight:700">Bienvenue, ${esc(name.split(' ')[0])} !</h1>
        </div>
        <div style="background:white;border:1px solid #E8EDF5;border-top:none;padding:28px 24px;border-radius:0 0 10px 10px">
          <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 20px">
            Votre espace chauffeur D-VTC est prêt. Partagez votre lien de réservation à vos clients et gérez tout depuis votre tableau de bord.
          </p>

          ${checkoutSection}

          <div style="background:#F8F9FB;border:1px solid #E8EDF5;border-radius:8px;padding:18px;margin:0 0 20px">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#8A94A6;text-transform:uppercase;letter-spacing:.08em">Conditions Générales de Vente — Résumé</p>
            <p style="margin:0 0 6px;font-size:12px;color:#3A4456;line-height:1.6"><strong>Art. 1 — Objet :</strong> D-VTC est une plateforme SaaS de gestion de réservations pour chauffeurs VTC indépendants (D Embassy, micro-entrepreneur, SIRET 10073363300018).</p>
            <p style="margin:0 0 6px;font-size:12px;color:#3A4456;line-height:1.6"><strong>Art. 3 — Prix :</strong> Abonnement mensuel de <strong>74,00 €</strong>. TVA non applicable (art. 293B CGI). Facture émise automatiquement à chaque paiement.</p>
            <p style="margin:0 0 6px;font-size:12px;color:#3A4456;line-height:1.6"><strong>Art. 4 — Paiement :</strong> Prélèvement automatique mensuel par carte bancaire via Stripe. En cas d'échec répété (3 tentatives), l'accès est suspendu.</p>
            <p style="margin:0 0 10px;font-size:12px;color:#3A4456;line-height:1.6"><strong>Art. 5 — Résiliation :</strong> Sans engagement. Résiliation par email à damiendambassador@gmail.com. Prise d'effet en fin de période mensuelle, sans remboursement au prorata.</p>
            <a href="https://d-vtc.fr/cgv" style="display:inline-block;font-size:12px;font-weight:600;color:#0A1628;text-decoration:underline">Lire les CGV complètes sur d-vtc.fr/cgv →</a>
          </div>

          <div style="background:#F4F6FA;border-radius:8px;padding:18px;margin:0 0 20px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#8A94A6;text-transform:uppercase;letter-spacing:.08em">Votre page de réservation</p>
            <a href="${BASE}/r/${finalSlug}" style="font-size:15px;font-weight:700;color:#0A1628;word-break:break-all">${BASE}/r/${finalSlug}</a>
          </div>

          <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px">
            <tr>
              <td style="padding:10px 0;color:#666;border-bottom:1px solid #F0F3F8;width:40%">Tableau de bord</td>
              <td style="padding:10px 0;border-bottom:1px solid #F0F3F8">
                <a href="${BASE}/dashboard" style="color:#0A1628;font-weight:600">${BASE}/dashboard</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#666;border-bottom:1px solid #F0F3F8">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #F0F3F8;font-family:monospace">${esc(email)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#666">Mot de passe temporaire</td>
              <td style="padding:10px 0;font-family:monospace;font-weight:700;color:#C9A84C">${esc(password)}</td>
            </tr>
          </table>

          <div style="background:#FBF7EC;border:1px solid #EAD9A8;border-radius:8px;padding:14px 16px;font-size:13px;color:#7A6020">
            Pensez à changer votre mot de passe depuis <strong>Paramètres → Sécurité</strong> une fois connecté.
          </div>
        </div>
      </div>`,
  }).catch(() => null) /* non-bloquant */

  return NextResponse.json({ driver, checkoutUrl })
}
