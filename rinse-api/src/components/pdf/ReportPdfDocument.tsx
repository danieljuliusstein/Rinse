import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PLReport } from '@/lib/api/aggregates'
import { INVOICE_ACCENT } from '@/lib/invoice-layout'
import { EXPENSE_LABELS, EXPENSE_ORDER } from '@/lib/reports-metrics'

const ACCENT_DIM = '#ecfdf3'
const EXPENSE_RED = '#b91c1c'
const MUTED = '#6b7280'
const BORDER = '#e5e7eb'
const INK = '#111827'

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: INK,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    flex: 1,
    maxWidth: '68%',
  },
  logo: {
    width: 56,
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    objectFit: 'contain',
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: INK,
    letterSpacing: -0.3,
  },
  docType: {
    fontSize: 11,
    fontWeight: 'bold',
    color: INVOICE_ACCENT,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  periodLabel: {
    fontSize: 11,
    color: MUTED,
  },
  headerBadge: {
    backgroundColor: ACCENT_DIM,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'flex-end',
    minWidth: 120,
  },
  badgeLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  badgeValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: INVOICE_ACCENT,
    fontFamily: 'Courier',
  },
  badgeSub: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  accentRule: {
    height: 3,
    backgroundColor: INVOICE_ACCENT,
    borderRadius: 2,
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  kpiCardHighlight: {
    backgroundColor: ACCENT_DIM,
    borderColor: INVOICE_ACCENT,
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: MUTED,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: INK,
  },
  kpiValueGreen: {
    color: INVOICE_ACCENT,
  },
  kpiValueRed: {
    color: EXPENSE_RED,
  },
  kpiSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: MUTED,
    marginBottom: 10,
  },
  expenseTable: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 18,
  },
  expenseHead: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  expenseHeadText: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: MUTED,
  },
  expenseRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseRowAlt: {
    backgroundColor: '#fafafa',
  },
  expenseRowTotal: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 0,
  },
  colCategory: { width: '62%' },
  colAmount: { width: '38%', textAlign: 'right', fontFamily: 'Courier' },
  expenseLabel: { fontSize: 10, color: INK },
  expenseAmount: { fontSize: 10, color: EXPENSE_RED, fontFamily: 'Courier' },
  expenseTotalLabel: { fontSize: 10, fontWeight: 'bold', color: INK },
  profitPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ACCENT_DIM,
    borderWidth: 1,
    borderColor: INVOICE_ACCENT,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  profitLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: INK,
  },
  profitValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: INVOICE_ACCENT,
    fontFamily: 'Courier',
  },
  profitMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItem: {
    fontSize: 9,
    color: MUTED,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: MUTED,
  },
})

function money(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

interface Props {
  report: PLReport
  periodLabel: string
  businessName: string
  logoDataUri?: string
}

export default function ReportPdfDocument({ report, periodLabel, businessName, logoDataUri }: Props) {
  const expenseRows = EXPENSE_ORDER.map((key) => ({
    label: EXPENSE_LABELS[key],
    amount: report.expenses[key],
  })).filter((r) => r.amount > 0)

  const profitPositive = report.netProfit >= 0

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {logoDataUri ? <Image src={logoDataUri} style={styles.logo} /> : null}
            <View>
              <Text style={styles.businessName}>{businessName}</Text>
              <Text style={styles.docType}>Profit &amp; Loss Report</Text>
              <Text style={styles.periodLabel}>{periodLabel}</Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.badgeLabel}>Net profit</Text>
            <Text style={styles.badgeValue}>{money(report.netProfit)}</Text>
            <Text style={styles.badgeSub}>{report.marginPct}% margin</Text>
          </View>
        </View>

        <View style={styles.accentRule} />

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Revenue</Text>
            <Text style={styles.kpiValue}>{money(report.revenue)}</Text>
            <Text style={styles.kpiSub}>{report.jobCount} job{report.jobCount === 1 ? '' : 's'}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Expenses</Text>
            <Text style={[styles.kpiValue, styles.kpiValueRed]}>{money(report.totalExpenses)}</Text>
            <Text style={styles.kpiSub}>{expenseRows.length} categories</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
            <Text style={styles.kpiLabel}>Net profit</Text>
            <Text style={[styles.kpiValue, styles.kpiValueGreen]}>{money(report.netProfit)}</Text>
            <Text style={styles.kpiSub}>{profitPositive ? 'Profitable period' : 'Loss period'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Expense breakdown</Text>
        <View style={styles.expenseTable}>
          <View style={styles.expenseHead}>
            <Text style={[styles.expenseHeadText, styles.colCategory]}>Category</Text>
            <Text style={[styles.expenseHeadText, styles.colAmount]}>Amount</Text>
          </View>
          {expenseRows.map((row, i) => (
            <View key={row.label} style={[styles.expenseRow, i % 2 === 1 ? styles.expenseRowAlt : {}]}>
              <Text style={[styles.expenseLabel, styles.colCategory]}>{row.label}</Text>
              <Text style={[styles.expenseAmount, styles.colAmount]}>−{money(row.amount)}</Text>
            </View>
          ))}
          <View style={[styles.expenseRow, styles.expenseRowTotal]}>
            <Text style={[styles.expenseTotalLabel, styles.colCategory]}>Total expenses</Text>
            <Text style={[styles.expenseAmount, styles.colAmount]}>−{money(report.totalExpenses)}</Text>
          </View>
        </View>

        <View style={styles.profitPanel}>
          <Text style={styles.profitLabel}>Net profit after expenses</Text>
          <Text style={styles.profitValue}>{money(report.netProfit)}</Text>
        </View>

        <View style={styles.profitMeta}>
          <Text style={styles.metaItem}>Jobs in range: {report.jobCount}</Text>
          <Text style={styles.metaItem}>Margin: {report.marginPct}%</Text>
          <Text style={styles.metaItem}>Revenue: {money(report.revenue)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{businessName} · Profit &amp; Loss</Text>
          <Text style={styles.footerText}>Generated {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  )
}
