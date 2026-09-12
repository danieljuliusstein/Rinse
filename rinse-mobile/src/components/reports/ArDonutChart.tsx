import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { fmt } from '@rinse/core'
import type { PLReport } from '@/src/lib/reports'
import { AppText } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'

export function ArDonutChart({ report }: { report: PLReport }) {
  const profit = Math.max(0, report.netProfit)
  const expenses = Math.max(0, report.totalExpenses)
  const total = profit + expenses || 1
  const profitPct = profit / total
  const expensePct = 1 - profitPct

  const size = 120
  const stroke = 16
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const profitLength = circumference * profitPct

  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#fecaca"
            strokeWidth={stroke}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.green}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${profitLength} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.hole}>
          <AppText variant="caption" style={styles.holeLabel}>
            Net
          </AppText>
          <AppText variant="bodySemiBold">{fmt(report.netProfit)}</AppText>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.swatch, styles.swatchProfit]} />
          <AppText variant="caption" style={styles.legendText}>
            Profit {Math.round(profitPct * 100)}%
          </AppText>
          <AppText variant="bodySemiBold" style={styles.legendValue}>
            {fmt(profit)}
          </AppText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.swatch, styles.swatchExpense]} />
          <AppText variant="caption" style={styles.legendText}>
            Expenses {Math.round(expensePct * 100)}%
          </AppText>
          <AppText variant="bodySemiBold" style={styles.legendValue}>
            {fmt(expenses)}
          </AppText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ring: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hole: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  holeLabel: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  swatchProfit: {
    backgroundColor: colors.green,
  },
  swatchExpense: {
    backgroundColor: '#e06060',
  },
  legendText: {
    flex: 1,
    color: colors.textMuted,
  },
  legendValue: {
    fontSize: 14,
  },
})
