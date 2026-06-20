export const runtime = 'nodejs'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not available in production', { status: 403 })
  }

  const { generateInvoicePDF } = await import('@/lib/invoice-pdf')

  const pdf = await generateInvoicePDF({
    invoiceNumber:   'DVTC-2026-001',
    driverName:      'Jean Dupont (TEST)',
    driverEmail:     'jean.dupont@test.com',
    amountCents:     7400,
    periodStart:     '2026-06-01',
    periodEnd:       '2026-06-30',
    paidAt:          '01/06/2026',
    stripeInvoiceId: 'in_test_00000000000000',
  })

  return new Response(pdf, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'inline; filename="test-invoice.pdf"',
    },
  })
}
