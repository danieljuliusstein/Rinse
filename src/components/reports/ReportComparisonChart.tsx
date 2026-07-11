import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import type { PLReport } from '@/src/lib/reports'
import { CurrencyAmount, AppText } from '@/src/components/ui'
import { buildComparisonBars } from '@/src/lib/reports-metrics'
import { colors, spacing } from '@/src/theme/colors'

export function ReportComparisonChart({ report }: { report: PLReport }) {
  const bars = useMemo(() => buildComparisonBars(report), [report])
  const revenueBar = bars.find((b) => b.label === 'Revenue')
  const expenseBar = bars.find((b) => b.label === 'Expenses')
  const loss = report.netProfit < 0

  if (!revenueBar || !expenseBar) return null

  return (
    <View style={styles.card}>
      <View style={styles.dual}>
        <View style={styles.col}>
          <AppText variant="sectionLabel">Revenue</AppText>
          <CurrencyAmount value={revenueBar.amount} variant="revenue" size="stat" />
          <View style={styles.track}>
            <View style={[styles.fill, styles.fillRevenue, { width: `${revenueBar.widthPct}%` }]} />
          </View>
          <AppText variant="caption" style={styles.pct}>
            {Math.round(revenueBar.widthPct)}% of peak
          </AppText>
        </View>
        <View style={styles.col}>
          <AppText variant="sectionLabel">Expenses</AppText>
          <CurrencyAmount value={expenseBar.amount} variant="expense" size="stat" unsigned />
          <View style={styles.track}>
            <View style={[styles.fill, styles.fillExpense, { width: `${expenseBar.widthPct}%` }]} />
          </View>
          <AppText variant="caption" style={styles.pct}>
            {Math.round(expenseBar.widthPct)}% of peak
          </AppText>
        </View>
      </View>

      <View style={[styles.netRow, loss && styles.netRowLoss]}>
        <AppText variant="sectionLabel">{loss ? 'Net loss' : 'Net profit'}</AppText>
        <CurrencyAmount value={report.netProfit} variant="profit" size="stat" />
      </View>

      <AppText variant="caption" style={[styles.insight, loss && styles.insightLoss]}>
        {loss
          ? 'Expenses exceeded revenue — you spent more than you earned.'
          : 'Revenue exceeded expenses — you made money this period.'}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  dual: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  revenueValue: {
    color: colors.greenText,
    fontSize: 20,
    lineHeight: 26,
  },
  expenseValue: {
    color: colors.danger,
    fontSize: 20,
    lineHeight: 26,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  fillRevenue: {
    backgroundColor: colors.green,
  },
  fillExpense: {
    backgroundColor: '#6b7280',
  },
  pct: {
    color: colors.textMuted,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  netRowLoss: {
    backgroundColor: '#fef2f2',
  },
  insight: {
    color: colors.greenText,
    textAlign: 'center',
  },
  insightLoss: {
    color: colors.danger,
  },
})
