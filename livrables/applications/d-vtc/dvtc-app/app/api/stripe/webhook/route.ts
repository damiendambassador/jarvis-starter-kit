import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import Stripe from 'stripe'
import { generateInvoicePDF } from '@/lib/invoice-pdf'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function mapStripeStatus(s: string): string {
  const map: Record<string, string> = {
    trialing: 'trialing',
    active:   'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    paused:   'paused',
  }
  return map[s] ?? 'pending'
}

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer())
  const sig     = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Missing signature or Stripe config' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      await db.from('drivers')
        .update({
          stripe_subscription_id: sub.id,
          subscription_status:    mapStripeStatus(sub.status),
          subscription_start_at:  new Date(sub.start_date * 1000).toISOString(),
        })
        .eq('stripe_customer_id', sub.customer as string)

      if (sub.status === 'active' || sub.status === 'trialing') {
        const { data: driver } = await db
          .from('drivers')
          .select('name, email, slug')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (driver) {
          const { data: linkData } = await db.auth.admin.generateLink({
            type: 'magiclink',
            email: driver.email,
            options: { redirectTo: 'https://d-vtc.fr/dashboard' },
          })
          const magicLink = (linkData as { properties?: { action_link?: string } })?.properties?.action_link ?? 'https://d-vtc.fr/dashboard'
          const firstName = driver.name.split(' ')[0]

          await resend.emails.send({
            from: FROM,
            to: driver.email,
            subject: `Votre accès D-VTC est activé, ${firstName} !`,
            html: `
              <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0A1628">
                <div style="background:#0A1628;color:white;padding:28px 24px;border-radius:10px 10px 0 0">
                  <p style="margin:0 0 6px;font-size:11px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase">D-VTC — Accès activé</p>
                  <h1 style="margin:0;font-size:24px;font-weight:700">Bienvenue, ${firstName} !</h1>
                </div>
                <div style="background:white;border:1px solid #E8EDF5;border-top:none;padding:28px 24px;border-radius:0 0 10px 10px">
                  <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 24px">
                    Votre abonnement D-VTC est actif. Cliquez ci-dessous pour accéder à votre tableau de bord en un clic, sans mot de passe.
                  </p>
                  <div style="text-align:center;margin:0 0 24px">
                    <a href="${magicLink}" style="display:inline-block;background:#0A1628;color:white;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none">
                      Accéder à mon tableau de bord →
                    </a>
                    <p style="font-size:11px;color:#A7B0BF;margin:10px 0 0">Ce lien est à usage unique et expire dans 24h.</p>
                  </div>
                  <div style="background:#F4F6FA;border-radius:8px;padding:18px;margin:0 0 20px">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#8A94A6;text-transform:uppercase;letter-spacing:.08em">Votre page de réservation client</p>
                    <a href="https://d-vtc.fr/r/${driver.slug}" style="font-size:14px;font-weight:700;color:#0A1628;word-break:break-all">https://d-vtc.fr/r/${driver.slug}</a>
                  </div>
                  <p style="font-size:12px;color:#8A94A6;line-height:1.5">
                    Une fois connecté, rendez-vous dans <strong>Paramètres → Sécurité</strong> pour définir votre mot de passe et sécuriser votre compte.
                  </p>
                </div>
              </div>`,
          }).catch((err) => console.error('[webhook] Email 2 error:', err))
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await db.from('drivers')
        .update({
          stripe_subscription_id: sub.id,
          subscription_status:    mapStripeStatus(sub.status),
          subscription_start_at:  new Date(sub.start_date * 1000).toISOString(),
        })
        .eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await db.from('drivers')
        .update({ subscription_status: 'cancelled', is_active: false })
        .eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'invoice.payment_succeeded': {
      const inv = event.data.object as Stripe.Invoice
      if (!(inv as { subscription?: unknown }).subscription) break

      /* Idempotence : ne pas traiter deux fois la même facture Stripe */
      const { data: existing } = await db
        .from('invoices')
        .select('id')
        .eq('stripe_invoice_id', inv.id)
        .single()
      if (existing) break

      const { data: driver } = await db
        .from('drivers')
        .select('*')
        .eq('stripe_customer_id', inv.customer as string)
        .single()
      if (!driver) break

      /* Numéro de facture séquentiel */
      const { data: numRow } = await db.rpc('next_invoice_number')
      const invoiceNumber = numRow as string

      /* Période couverte */
      const lineItem  = inv.lines?.data?.[0]
      const periodStart = lineItem?.period?.start
        ? new Date(lineItem.period.start * 1000).toISOString().slice(0, 10)
        : null
      const periodEnd = lineItem?.period?.end
        ? new Date(lineItem.period.end * 1000).toISOString().slice(0, 10)
        : null

      /* Générer le PDF */
      let pdfBuffer: Buffer | null = null
      let pdfPath: string | null = null
      try {
        pdfBuffer = await generateInvoicePDF({
          invoiceNumber,
          driverName:  driver.name,
          driverEmail: driver.email,
          amountCents: inv.amount_paid,
          periodStart: periodStart ?? '',
          periodEnd:   periodEnd ?? '',
          paidAt:      new Date(inv.status_transitions?.paid_at
            ? inv.status_transitions.paid_at * 1000
            : Date.now()).toLocaleDateString('fr-FR'),
          stripeInvoiceId: inv.id,
        })

        /* Upload vers Supabase Storage */
        pdfPath = `${driver.id}/${invoiceNumber}.pdf`
        await db.storage.from('invoices').upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        })
      } catch { /* PDF non-bloquant */ }

      /* Insérer la facture en base */
      await db.from('invoices').insert({
        driver_id:        driver.id,
        stripe_invoice_id: inv.id,
        invoice_number:   invoiceNumber,
        amount_cents:     inv.amount_paid,
        currency:         inv.currency,
        status:           'paid',
        period_start:     periodStart,
        period_end:       periodEnd,
        pdf_storage_path: pdfPath,
        paid_at:          new Date().toISOString(),
        due_date:         periodEnd,
      })

      /* Email avec PDF en pièce jointe */
      const periodLabel = periodStart && periodEnd
        ? `du ${new Date(periodStart).toLocaleDateString('fr-FR')} au ${new Date(periodEnd).toLocaleDateString('fr-FR')}`
        : ''

      await resend.emails.send({
        from: FROM,
        to:   driver.email,
        subject: `Facture ${invoiceNumber} — Abonnement D-VTC`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0A1628">
            <div style="background:#0A1628;color:white;padding:24px;border-radius:10px 10px 0 0">
              <p style="margin:0 0 4px;font-size:11px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase">D-VTC — Facturation</p>
              <h1 style="margin:0;font-size:20px;font-weight:700">Votre facture ${invoiceNumber}</h1>
            </div>
            <div style="background:white;border:1px solid #E8EDF5;border-top:none;padding:24px;border-radius:0 0 10px 10px">
              <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 16px">
                Bonjour ${driver.name.split(' ')[0]}, votre paiement mensuel D-VTC a bien été reçu.
              </p>
              <div style="background:#F4F6FA;border-radius:8px;padding:16px;margin-bottom:16px">
                <div style="font-size:12px;color:#8A94A6;margin-bottom:4px">Montant prélevé</div>
                <div style="font-size:24px;font-weight:700;color:#0A1628">74,00 €</div>
                <div style="font-size:12px;color:#8A94A6;margin-top:4px">Abonnement mensuel D-VTC ${periodLabel}</div>
              </div>
              <p style="font-size:13px;color:#5A6477">La facture PDF est jointe à cet email. Vous pouvez également la retrouver dans votre tableau de bord, section <strong>Mes factures</strong>.</p>
            </div>
          </div>`,
        attachments: pdfBuffer ? [{
          filename: `${invoiceNumber}.pdf`,
          content:  pdfBuffer,
        }] : undefined,
      }).catch(() => null)

      break
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice

      await db.from('drivers')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', inv.customer as string)

      const { data: driver } = await db
        .from('drivers')
        .select('name,email')
        .eq('stripe_customer_id', inv.customer as string)
        .single()

      await resend.emails.send({
        from: FROM,
        to:   ADMIN_EMAIL,
        subject: `[ALERTE] Échec de paiement — ${driver?.name ?? 'Inconnu'}`,
        html: `<p>Le prélèvement Stripe a échoué pour <strong>${driver?.name}</strong> (${driver?.email}).<br>Montant : ${(inv.amount_due / 100).toFixed(2)} €.<br>Vérifiez le dashboard Stripe.</p>`,
      }).catch(() => null)

      break
    }
  }

  return NextResponse.json({ received: true })
}
