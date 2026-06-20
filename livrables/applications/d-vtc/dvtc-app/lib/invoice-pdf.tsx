import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

const navy  = '#0A1628'
const gold  = '#C9A84C'
const gray  = '#5A6477'
const light = '#F4F6FA'

const s = StyleSheet.create({
  page:       { fontFamily: 'Helvetica', fontSize: 10, color: navy, padding: 40, backgroundColor: '#ffffff' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  brand:      { fontSize: 18, fontFamily: 'Helvetica-Bold', color: navy },
  subtitle:   { fontSize: 9, color: gray, marginTop: 3 },
  badge:      { backgroundColor: navy, color: '#ffffff', fontSize: 9, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-end' },
  section:    { marginBottom: 20 },
  label:      { fontSize: 8, color: gold, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  value:      { fontSize: 10, color: navy },
  row:        { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E8EDF5', paddingVertical: 8 },
  rowHeader:  { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: light, padding: 8, marginBottom: 0 },
  rowLabel:   { fontSize: 9, color: gray, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  total:      { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: navy, padding: 12, borderRadius: 6, marginTop: 8 },
  totalLabel: { color: '#ffffff', fontSize: 12, fontFamily: 'Helvetica-Bold' },
  totalValue: { color: gold, fontSize: 14, fontFamily: 'Helvetica-Bold' },
  footer:     { position: 'absolute', bottom: 28, left: 40, right: 40 },
  footerText: { fontSize: 8, color: '#A7B0BF', textAlign: 'center' },
  divider:    { borderBottomWidth: 1, borderBottomColor: '#E8EDF5', marginVertical: 16 },
  twoCol:     { flexDirection: 'row', gap: 24 },
  col:        { flex: 1 },
})

export type InvoiceData = {
  invoiceNumber:   string
  driverName:      string
  driverEmail:     string
  amountCents:     number
  periodStart:     string
  periodEnd:       string
  paidAt:          string
  stripeInvoiceId: string
}

function fmt(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function fmtAmount(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
}

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const today = new Date().toLocaleDateString('fr-FR')
  const periodLabel = data.periodStart && data.periodEnd
    ? `${fmt(data.periodStart)} au ${fmt(data.periodEnd)}`
    : ''

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>D-VTC</Text>
            <Text style={s.subtitle}>Service numérique pour chauffeurs VTC</Text>
          </View>
          <View>
            <Text style={[s.badge, { marginBottom: 4 }]}>FACTURE ACQUITTÉE</Text>
            <Text style={[s.value, { textAlign: 'right', fontSize: 9, color: gray }]}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Émetteur + Destinataire */}
        <View style={[s.twoCol, { marginBottom: 24 }]}>
          <View style={s.col}>
            <Text style={s.label}>Émetteur</Text>
            <Text style={[s.value, { fontFamily: 'Helvetica-Bold', marginBottom: 2 }]}>D Embassy</Text>
            <Text style={s.value}>Damien</Text>
            <Text style={s.value}>Micro-entrepreneur</Text>
            <Text style={s.value}>SIRET : 10073363300018</Text>
            <Text style={s.value}>Code APE : 7022Z</Text>
            <Text style={s.value}>Ivry-sur-Seine (94200)</Text>
          </View>
          <View style={s.col}>
            <Text style={s.label}>Destinataire</Text>
            <Text style={[s.value, { fontFamily: 'Helvetica-Bold', marginBottom: 2 }]}>{data.driverName}</Text>
            <Text style={s.value}>Chauffeur VTC indépendant</Text>
            <Text style={s.value}>{data.driverEmail}</Text>
          </View>
        </View>

        {/* Infos facture */}
        <View style={[s.twoCol, { marginBottom: 24 }]}>
          <View style={s.col}>
            <Text style={s.label}>Date d'émission</Text>
            <Text style={s.value}>{today}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.label}>Date de paiement</Text>
            <Text style={s.value}>{data.paidAt}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.label}>Référence Stripe</Text>
            <Text style={[s.value, { fontSize: 8, color: gray }]}>{data.stripeInvoiceId}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Tableau prestation */}
        <View style={s.rowHeader}>
          <Text style={[s.rowLabel, { flex: 3 }]}>Description</Text>
          <Text style={[s.rowLabel, { flex: 1, textAlign: 'right' }]}>Qté</Text>
          <Text style={[s.rowLabel, { flex: 1, textAlign: 'right' }]}>Prix unitaire</Text>
          <Text style={[s.rowLabel, { flex: 1, textAlign: 'right' }]}>Total HT</Text>
        </View>

        <View style={s.row}>
          <View style={{ flex: 3 }}>
            <Text style={[s.value, { fontFamily: 'Helvetica-Bold' }]}>Abonnement mensuel D-VTC</Text>
            <Text style={[s.value, { fontSize: 9, color: gray, marginTop: 2 }]}>
              Accès plateforme de réservation chauffeur
              {periodLabel ? `\nPériode : ${periodLabel}` : ''}
            </Text>
          </View>
          <Text style={[s.value, { flex: 1, textAlign: 'right' }]}>1</Text>
          <Text style={[s.value, { flex: 1, textAlign: 'right' }]}>{fmtAmount(data.amountCents)}</Text>
          <Text style={[s.value, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{fmtAmount(data.amountCents)}</Text>
        </View>

        {/* Mention TVA */}
        <View style={{ marginTop: 8, marginBottom: 8 }}>
          <Text style={[s.value, { fontSize: 9, color: gray, fontStyle: 'italic' }]}>
            TVA non applicable — Art. 293B du CGI
          </Text>
        </View>

        {/* Total */}
        <View style={s.total}>
          <Text style={s.totalLabel}>TOTAL TTC</Text>
          <Text style={s.totalValue}>{fmtAmount(data.amountCents)}</Text>
        </View>

        {/* Paiement */}
        <View style={{ marginTop: 16, backgroundColor: '#F0FDF4', borderRadius: 6, padding: 10 }}>
          <Text style={[s.value, { fontSize: 9, color: '#166534' }]}>
            Paiement reçu par prélèvement automatique par carte bancaire.
          </Text>
        </View>

        {/* Pied de page */}
        <View style={s.footer}>
          <View style={{ borderTopWidth: 1, borderTopColor: '#E8EDF5', paddingTop: 10 }}>
            <Text style={s.footerText}>
              D Embassy — Micro-entrepreneur — SIRET : 10073363300018 — Code APE : 7022Z
            </Text>
            <Text style={[s.footerText, { marginTop: 2 }]}>
              TVA non applicable, art. 293B du CGI — Dispensé d'immatriculation au RCS et au répertoire des métiers
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const buffer = await renderToBuffer(<InvoiceDocument data={data} />)
  return Buffer.from(buffer)
}
