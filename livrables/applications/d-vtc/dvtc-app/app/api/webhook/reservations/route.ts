import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const SECRET  = process.env.SUPABASE_WEBHOOK_SECRET

// Client admin (service role) — uniquement utilisé côté serveur, jamais exposé
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  const incoming = req.headers.get('x-webhook-secret')
  if (!SECRET || incoming !== SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json()
  const { type, record: r, old_record } = body

  if (!r?.driver_id) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { data: driver } = await admin
    .from('drivers').select('name, email').eq('id', r.driver_id).single()

  if (!driver) return NextResponse.json({ error: 'Chauffeur introuvable' }, { status: 404 })

  const date = format(new Date(r.scheduled_at), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })

  try {
    /* ── Nouvelle réservation ── */
    if (type === 'INSERT') {
      await resend.emails.send({
        from: `D-VTC <${FROM}>`,
        to: driver.email,
        subject: `Nouvelle réservation — ${esc(r.client_name)}`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0A1628">
            <div style="background:#0A1628;color:white;padding:24px;border-radius:8px 8px 0 0">
              <p style="margin:0;font-size:12px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase">D-VTC — Nouvelle réservation</p>
              <h1 style="margin:8px 0 0;font-size:22px">Demande de ${esc(r.client_name)}</h1>
            </div>
            <div style="background:white;border:1px solid #E8EDF5;border-top:none;padding:24px;border-radius:0 0 8px 8px">
              <table style="width:100%;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#666">Date</td><td style="padding:8px 0;font-weight:600">${date}</td></tr>
                <tr><td style="padding:8px 0;color:#666">Téléphone</td><td style="padding:8px 0">${esc(r.client_phone)}</td></tr>
                <tr><td style="padding:8px 0;color:#666">Départ</td><td style="padding:8px 0">${esc(r.pickup_address)}</td></tr>
                ${r.dropoff_address ? `<tr><td style="padding:8px 0;color:#666">Arrivée</td><td style="padding:8px 0">${esc(r.dropoff_address)}</td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#666">Type</td><td style="padding:8px 0">${r.ride_type === 'standard' ? 'Trajet simple' : 'Mise à disposition'}</td></tr>
                <tr><td style="padding:8px 0;color:#666">Passagers</td><td style="padding:8px 0">${Number(r.passengers)}</td></tr>
                ${r.price_estimate ? `<tr><td style="padding:8px 0;color:#666">Estimation</td><td style="padding:8px 0;font-weight:700;color:#C9A84C;font-size:18px">${Number(r.price_estimate).toFixed(2)} €</td></tr>` : ''}
                ${r.notes ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top">Notes</td><td style="padding:8px 0;font-style:italic">${esc(r.notes)}</td></tr>` : ''}
              </table>
              <p style="margin:20px 0 0;font-size:13px;color:#888">Connectez-vous à votre dashboard pour accepter ou refuser cette demande.</p>
            </div>
          </div>`,
      })

      await resend.emails.send({
        from: `D-VTC <${FROM}>`,
        to: r.client_email,
        subject: 'Réservation reçue — confirmation sous peu',
        html: `
          <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0A1628">
            <div style="background:#0A1628;color:white;padding:24px;border-radius:8px 8px 0 0">
              <p style="margin:0;font-size:12px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase">D-VTC — ${esc(driver.name)}</p>
              <h1 style="margin:8px 0 0;font-size:22px">Demande bien reçue, ${esc(r.client_name.split(' ')[0])}</h1>
            </div>
            <div style="background:white;border:1px solid #E8EDF5;border-top:none;padding:24px;border-radius:0 0 8px 8px">
              <p style="font-size:14px;color:#444">Votre demande a été transmise à <strong>${esc(driver.name)}</strong>. Il vous confirme très prochainement.</p>
              <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin:16px 0;font-size:14px">
                <p style="margin:0 0 6px;color:#666">Course prévue le :</p>
                <p style="margin:0;font-weight:700;font-size:16px">${date}</p>
              </div>
              <p style="font-size:13px;color:#888">Paiement à bord. Tarif TVA non applicable (art. 293B du CGI).</p>
            </div>
          </div>`,
      })
    }

    /* ── Changement de statut ── */
    if (type === 'UPDATE') {
      const oldStatus = old_record?.status
      const newStatus = r.status
      if (oldStatus === newStatus) return NextResponse.json({ skipped: true })

      if (newStatus === 'accepted') {
        await resend.emails.send({
          from: `D-VTC <${FROM}>`,
          to: r.client_email,
          subject: 'Course confirmée',
          html: `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0A1628">
              <div style="background:#0A1628;color:white;padding:24px;border-radius:8px 8px 0 0">
                <h1 style="margin:0;font-size:22px">Votre course est confirmée</h1>
              </div>
              <div style="background:white;border:1px solid #E8EDF5;border-top:none;padding:24px;border-radius:0 0 8px 8px">
                <p style="font-size:14px"><strong>${esc(driver.name)}</strong> a accepté votre réservation du <strong>${date}</strong>.</p>
                <p style="font-size:14px;color:#444">Votre chauffeur sera à l'heure au point de prise en charge.</p>
              </div>
            </div>`,
        })
      }

      if (newStatus === 'refused') {
        await resend.emails.send({
          from: `D-VTC <${FROM}>`,
          to: r.client_email,
          subject: 'Course non disponible',
          html: `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0A1628">
              <div style="background:#0A1628;color:white;padding:24px;border-radius:8px 8px 0 0">
                <h1 style="margin:0;font-size:22px">Course non disponible</h1>
              </div>
              <div style="background:white;border:1px solid #E8EDF5;border-top:none;padding:24px;border-radius:0 0 8px 8px">
                <p style="font-size:14px">${esc(driver.name)} n'est malheureusement pas disponible pour votre demande du ${date}.</p>
                <p style="font-size:14px;color:#444">N'hésitez pas à faire une nouvelle demande pour une autre date.</p>
              </div>
            </div>`,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Webhook email error:', err)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
