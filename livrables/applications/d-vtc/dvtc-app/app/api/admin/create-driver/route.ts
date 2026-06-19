import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const BASE   = 'https://dvtc-app.vercel.app'

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

  /* ── Email de bienvenue ── */
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

  return NextResponse.json({ driver })
}
