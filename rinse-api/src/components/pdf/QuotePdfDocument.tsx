import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { PdfBusinessLogo } from '@/components/pdf/PdfBusinessLogo'
import { INVOICE_ACCENT } from '@/lib/invoice-layout'
import type { AppSettings } from '@/lib/settings'
import type { QuoteWithRelations } from '@/lib/types'
import {
  getDocumentStrings,
  intlLocaleForDocument,
  normalizeDocumentLocale,
} from '@rinse/core'

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 80,
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
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: INVOICE_ACCENT,
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
    minWidth: 140,
  },
  docLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    color: INVOICE_ACCENT,
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 12,
    fontFamily: 'Courier',
    marginBottom: 4,
    color: '#111111',
  },
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
    marginBottom: 8,
    color: '#111111',
  },
  table: { marginTop: 18, marginBottom: 18 },
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
  colAmount: { width: '30%', textAlign: 'right', fontFamily: 'Courier' },
  summaryWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
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
  },
})

function money(n: number, localeTag = 'en-US') {
  return new Intl.NumberFormat(localeTag, { style: 'currency', currency: 'USD' }).format(n)
}

function formatDate(dateStr: string, localeTag = 'en-US') {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(localeTag, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function QuotePdfDocument({
  quote,
  settings,
  logoDataUri,
}: {
  quote: QuoteWithRelations
  settings: AppSettings
  logoDataUri?: string | null
}) {
  const locale = normalizeDocumentLocale(settings.document_locale)
  const s = getDocumentStrings(locale)
  const localeTag = intlLocaleForDocument(locale)

  const lineDesc = quote.package?.name ?? s.detailingService
  const contextParts = [quote.vehicle_type, quote.location_type].filter(Boolean).join(' · ')

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <PdfBusinessLogo logoDataUri={logoDataUri} />
            <View>
              <Text style={styles.businessName}>{settings.business_name}</Text>
              {settings.business_phone ? <Text style={styles.muted}>{settings.business_phone}</Text> : null}
              {settings.business_email ? <Text style={styles.muted}>{settings.business_email}</Text> : null}
              {settings.business_address ? <Text style={styles.muted}>{settings.business_address}</Text> : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>{s.estimate.toUpperCase()}</Text>
            <Text style={styles.docNumber}>{quote.quote_number}</Text>
            <Text style={styles.muted}>{s.issued} {formatDate(quote.date, localeTag)}</Text>
          </View>
        </View>

        <Text style={styles.label}>{s.preparedFor}</Text>
        <Text style={styles.clientName}>{quote.client?.name ?? s.client}</Text>
        {contextParts ? <Text style={styles.muted}>{contextParts}</Text> : null}
        <Text style={styles.muted}>{s.proposedDate}: {formatDate(quote.date, localeTag)}</Text>
        {quote.valid_until ? <Text style={styles.muted}>{s.validUntil}: {formatDate(quote.valid_until, localeTag)}</Text> : null}

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, styles.colDesc]}>{s.description}</Text>
            <Text style={[styles.tableHeadText, styles.colAmount]}>{s.amount}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>{lineDesc}</Text>
            <Text style={styles.colAmount}>{money(quote.subtotal, localeTag)}</Text>
          </View>
        </View>

        <View style={styles.summaryWrap}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>{s.total}</Text>
              <Text style={styles.totalValue}>{money(quote.subtotal, localeTag)}</Text>
            </View>
          </View>
        </View>

        {quote.notes ? <Text style={[styles.muted, { marginTop: 8, lineHeight: 1.4 }]}>{quote.notes}</Text> : null}

        {settings.invoice_terms_footer ? (
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>{settings.invoice_terms_footer}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
