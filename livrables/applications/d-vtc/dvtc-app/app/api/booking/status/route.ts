import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'D-VTC <reservations@d-vtc.fr>'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  const { reservationId, status } = await req.json()
  if (!reservationId || !status) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { data: r } = await admin.from('reservations').select('*').eq('id', reservationId).single()
  if (!r) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

  const { data: driver } = await admin.from('drivers').select('name, email').eq('id', r.driver_id).single()
  if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 })

  const date = format(new Date(r.scheduled_at), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })

  try {
    if (status === 'accepted') {
      await resend.emails.send({
        from: FROM,
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

    if (status === 'refused') {
      await resend.emails.send({
        from: FROM,
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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[booking/status] Email error:', err)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }
}
