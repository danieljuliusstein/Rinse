import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { PdfBusinessLogo } from '@/components/pdf/PdfBusinessLogo'
import {
  INVOICE_ACCENT,
  buildInvoiceViewModel,
  formatInvoiceMoney,
} from '@/lib/invoice-layout'
import type { AppSettings } from '@/lib/settings'
import type { Invoice, JobWithRelations } from '@/lib/types'

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 100,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111111',
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    flex: 1,
    maxWidth: '58%',
  },
  logo: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    objectFit: 'contain',
    padding: 4,
  },
  businessName: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111111',
  },
  muted: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
    lineHeight: 1.35,
  },
  headerRight: {
    alignItems: 'flex-end',
    minWidth: 150,
  },
  invoiceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    color: INVOICE_ACCENT,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    fontFamily: 'Courier',
    marginBottom: 4,
    color: '#111111',
  },
  issuedDate: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 8,
  },
  statusChip: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    color: '#ffffff',
  },
  statusPaid: { backgroundColor: INVOICE_ACCENT },
  statusSent: { backgroundColor: '#3b82f6' },
  statusOverdue: { backgroundColor: '#ef4444' },
  statusDraft: { backgroundColor: '#888888' },
  statusPartial: { backgroundColor: '#f59e0b' },
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 22,
  },
  col: { flex: 1 },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111111',
  },
  serviceContext: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
    lineHeight: 1.4,
  },
  table: { marginBottom: 18 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeadText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.6,
    color: '#888888',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  colDesc: { width: '70%' },
  colAmount: { width: '30%', textAlign: 'right' },
  lineNote: { fontSize: 9, color: '#888888', marginTop: 3 },
  summaryWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  summaryBox: { width: 220 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 10, color: '#666666' },
  summaryValue: { fontSize: 10, color: '#111111', fontFamily: 'Courier' },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    marginVertical: 8,
  },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#111111' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#111111', fontFamily: 'Courier' },
  balanceDue: { color: '#ef4444' },
  balanceZero: { color: INVOICE_ACCENT },
  paymentsSection: { marginBottom: 16 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.45,
    marginBottom: 4,
  },
  portalLink: {
    fontSize: 10,
    color: INVOICE_ACCENT,
    marginTop: 6,
    textDecoration: 'none',
  },
  signatureSection: { marginBottom: 16 },
  signatureImage: { width: 180, height: 56, objectFit: 'contain' },
  signatureDate: { fontSize: 9, color: '#666666', marginTop: 4 },
})

function statusStyle(tone: string) {
  switch (tone) {
    case 'paid':
      return styles.statusPaid
    case 'overdue':
      return styles.statusOverdue
    case 'sent':
      return styles.statusSent
    case 'partial':
      return styles.statusPartial
    default:
      return styles.statusDraft
  }
}

interface Props {
  job: JobWithRelations
  invoice: Invoice
  settings: AppSettings
  logoDataUri?: string | null
  portalUrl?: string
}

export default function InvoicePdfDocument({ job, invoice, settings, logoDataUri, portalUrl }: Props) {
  const vm = buildInvoiceViewModel(job, invoice, settings, { portalUrl })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <PdfBusinessLogo logoDataUri={logoDataUri} />
            <View>
              <Text style={styles.businessName}>{vm.businessName}</Text>
              {vm.businessPhone ? <Text style={styles.muted}>{vm.businessPhone}</Text> : null}
              {vm.businessEmail ? <Text style={styles.muted}>{vm.businessEmail}</Text> : null}
              {vm.businessAddress ? <Text style={styles.muted}>{vm.businessAddress}</Text> : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{vm.invoiceNumber}</Text>
            <Text style={styles.issuedDate}>Issued {vm.issuedDateLabel}</Text>
            <Text style={[styles.statusChip, statusStyle(vm.statusTone)]}>{vm.statusLabel}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.clientName}>{vm.billToName}</Text>
            {vm.billToPhone ? <Text style={styles.muted}>{vm.billToPhone}</Text> : null}
            {vm.billToEmail ? <Text style={styles.muted}>{vm.billToEmail}</Text> : null}
            {vm.billToAddress ? <Text style={styles.muted}>{vm.billToAddress}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Service details</Text>
            <Text style={styles.muted}>Date: {vm.serviceDateLabel}</Text>
            <Text style={styles.muted}>Vehicle: {vm.vehicleLabel}</Text>
            <Text style={styles.muted}>Location: {vm.locationLabel}</Text>
            <Text style={styles.serviceContext}>{vm.serviceContextLine}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeadText, styles.colAmount]}>Amount</Text>
          </View>
          {vm.lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text>{item.description}</Text>
                {item.note ? <Text style={styles.lineNote}>{item.note}</Text> : null}
              </View>
              <Text style={styles.colAmount}>{formatInvoiceMoney(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryWrap}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatInvoiceMoney(vm.subtotal)}</Text>
            </View>
            {vm.showTip ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tip</Text>
                <Text style={styles.summaryValue}>{formatInvoiceMoney(vm.tip)}</Text>
              </View>
            ) : null}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatInvoiceMoney(vm.total)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Balance due</Text>
              <Text
                style={[
                  styles.summaryValue,
                  vm.balanceDue > 0 ? styles.balanceDue : styles.balanceZero,
                ]}
              >
                {formatInvoiceMoney(vm.balanceDue)}
              </Text>
            </View>
          </View>
        </View>

        {vm.showPayments ? (
          <View style={styles.paymentsSection}>
            <Text style={styles.label}>Payments</Text>
            {vm.payments.map((p, i) => (
              <View key={i} style={styles.paymentRow}>
                <Text style={styles.muted}>
                  {p.method} · {p.date}
                </Text>
                <Text style={styles.summaryValue}>{formatInvoiceMoney(p.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {vm.showSignature && vm.signatureUrl ? (
          <View style={styles.signatureSection}>
            <Text style={styles.label}>Client signature</Text>
            <Image src={vm.signatureUrl} style={styles.signatureImage} />
            {vm.signedAtLabel ? (
              <Text style={styles.signatureDate}>Signed {vm.signedAtLabel}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          {vm.termsFooter ? <Text style={styles.footerText}>{vm.termsFooter}</Text> : null}
          {vm.questionsLine ? <Text style={styles.footerText}>{vm.questionsLine}</Text> : null}
          {vm.portalUrl ? (
            <Link src={vm.portalUrl} style={styles.portalLink}>
              View your invoice online
            </Link>
          ) : null}
        </View>
      </Page>
    </Document>
  )
}
