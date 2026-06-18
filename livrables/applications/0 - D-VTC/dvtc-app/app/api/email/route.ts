import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, reservation, driverEmail, driverName } = body

  if (type !== 'new_reservation' && type !== 'reservation_accepted' && type !== 'reservation_refused') {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  const dateFormatted = format(
    new Date(reservation.scheduled_at),
    "EEEE d MMMM yyyy 'à' HH'h'mm",
    { locale: fr }
  )

  try {
    if (type === 'new_reservation') {
      // Email au chauffeur
      await resend.emails.send({
        from: 'D-VTC <notifications@dvtc.app>',
        to: driverEmail,
        subject: `Nouvelle réservation — ${reservation.client_name}`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; color: #0A1628;">
            <div style="background: #0A1628; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <p style="margin: 0; font-size: 12px; color: #C9A84C; letter-spacing: 2px; text-transform: uppercase;">D-VTC — Nouvelle réservation</p>
              <h1 style="margin: 8px 0 0; font-size: 22px;">Demande de ${reservation.client_name}</h1>
            </div>
            <div style="background: white; border: 1px solid #E8EDF5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0; font-weight: 600;">${dateFormatted}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Téléphone</td><td style="padding: 8px 0;"><a href="tel:${reservation.client_phone}">${reservation.client_phone}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Départ</td><td style="padding: 8px 0;">${reservation.pickup_address}</td></tr>
                ${reservation.dropoff_address ? `<tr><td style="padding: 8px 0; color: #666;">Arrivée</td><td style="padding: 8px 0;">${reservation.dropoff_address}</td></tr>` : ''}
                <tr><td style="padding: 8px 0; color: #666;">Type</td><td style="padding: 8px 0;">${reservation.ride_type === 'standard' ? 'Trajet simple' : 'Mise à disposition'}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Passagers</td><td style="padding: 8px 0;">${reservation.passengers}</td></tr>
                ${reservation.price_estimate ? `<tr><td style="padding: 8px 0; color: #666;">Estimation</td><td style="padding: 8px 0; font-weight: 700; color: #C9A84C; font-size: 18px;">${reservation.price_estimate.toFixed(2)} €</td></tr>` : ''}
                ${reservation.notes ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Notes</td><td style="padding: 8px 0; font-style: italic;">${reservation.notes}</td></tr>` : ''}
              </table>
              <p style="margin: 20px 0 0; font-size: 13px; color: #888;">Connectez-vous à votre dashboard pour accepter ou refuser cette demande.</p>
            </div>
          </div>
        `,
      })

      // Email de confirmation au client
      await resend.emails.send({
        from: 'D-VTC <noreply@dvtc.app>',
        to: reservation.client_email,
        subject: 'Réservation reçue — confirmation sous peu',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; color: #0A1628;">
            <div style="background: #0A1628; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <p style="margin: 0; font-size: 12px; color: #C9A84C; letter-spacing: 2px; text-transform: uppercase;">D-VTC — ${driverName}</p>
              <h1 style="margin: 8px 0 0; font-size: 22px;">Demande bien reçue, ${reservation.client_name.split(' ')[0]}</h1>
            </div>
            <div style="background: white; border: 1px solid #E8EDF5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 14px; color: #444;">Votre demande de réservation a été transmise à <strong>${driverName}</strong>. Il vous confirme votre course très prochainement.</p>
              <div style="background: #F8F9FA; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px;">
                <p style="margin: 0 0 6px; color: #666;">Course prévue le :</p>
                <p style="margin: 0; font-weight: 700; font-size: 16px;">${dateFormatted}</p>
              </div>
              <p style="font-size: 13px; color: #888;">Paiement à bord, en espèces ou CB. Tarif TVA non applicable (art. 293B du CGI).</p>
            </div>
          </div>
        `,
      })
    }

    if (type === 'reservation_accepted') {
      await resend.emails.send({
        from: 'D-VTC <noreply@dvtc.app>',
        to: reservation.client_email,
        subject: 'Course confirmée',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; color: #0A1628;">
            <div style="background: #0A1628; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 22px;">Votre course est confirmée</h1>
            </div>
            <div style="background: white; border: 1px solid #E8EDF5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 14px;"><strong>${driverName}</strong> a accepté votre réservation du <strong>${dateFormatted}</strong>.</p>
              <p style="font-size: 14px; color: #444;">Votre chauffeur sera à l'heure au point de prise en charge.</p>
              ${driverEmail ? `<p style="font-size: 13px; color: #888;">En cas de besoin, contactez directement votre chauffeur.</p>` : ''}
            </div>
          </div>
        `,
      })
    }

    if (type === 'reservation_refused') {
      await resend.emails.send({
        from: 'D-VTC <noreply@dvtc.app>',
        to: reservation.client_email,
        subject: 'Course non disponible',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; color: #0A1628;">
            <div style="background: #0A1628; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 22px;">Course non disponible</h1>
            </div>
            <div style="background: white; border: 1px solid #E8EDF5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 14px;">${driverName} n'est malheureusement pas disponible pour votre demande du ${dateFormatted}.</p>
              <p style="font-size: 14px; color: #444;">N'hésitez pas à faire une nouvelle demande pour une autre date.</p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur envoi email:', err)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
