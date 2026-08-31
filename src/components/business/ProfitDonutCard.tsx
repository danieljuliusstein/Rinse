import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { fmt } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type ProfitDonutCardProps = {
  revenue: number
  expenses: number
  marginPct: number
}

export function ProfitDonutCard({ revenue, expenses, marginPct }: ProfitDonutCardProps) {
  const total = revenue + expenses
  if (total <= 0) {
    return (
      <View style={styles.card}>
        <AppText style={styles.title}>Profit vs expenses</AppText>
        <AppText style={styles.sub}>No money movement in this period</AppText>
      </View>
    )
  }

  const revenuePct = revenue / total
  const size = 140
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const revenueLength = circumference * revenuePct
  const centerLabel = revenue > 0 ? 'profit margin' : 'expenses only'

  // #region agent log
  fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'post-fix',hypothesisId:'DONUT1',location:'ProfitDonutCard.tsx',message:'Donut render',data:{revenue,expenses,marginPct,revenuePct},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <View style={styles.card}>
      <AppText style={styles.title}>Profit vs expenses</AppText>
      <AppText style={styles.sub}>Share of money flow</AppText>

      <View style={styles.row}>
        <View style={styles.donutWrap}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f2f2f7"
              strokeWidth={stroke}
              fill="none"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={revenue > 0 ? colors.green : colors.textDim}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(revenueLength, expenses > 0 && revenue === 0 ? circumference * 0.999 : revenueLength)} ${circumference}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.center}>
            <AppText style={styles.centerPct}>
              {revenue > 0 ? `${Math.round(marginPct)}%` : '—'}
            </AppText>
            <AppText style={styles.centerLabel}>{centerLabel}</AppText>
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendBlock}>
            <View style={styles.legendTop}>
              <View style={styles.legendLabelRow}>
                <View style={[styles.swatch, styles.swatchGreen]} />
                <AppText style={styles.legendLabel}>Revenue</AppText>
              </View>
              <AppText style={styles.legendValue}>{fmt(revenue)}</AppText>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, styles.fillGreen, { width: `${revenuePct * 100}%` }]} />
            </View>
          </View>
          <View style={styles.legendBlock}>
            <View style={styles.legendTop}>
              <View style={styles.legendLabelRow}>
                <View style={[styles.swatch, styles.swatchMuted]} />
                <AppText style={styles.legendLabel}>Expenses</AppText>
              </View>
              <AppText style={styles.legendValue}>{fmt(expenses)}</AppText>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, styles.fillMuted, { width: `${(1 - revenuePct) * 100}%` }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md + 4,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  row: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  donutWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerPct: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  centerLabel: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  legend: {
    flex: 1,
    gap: 12,
  },
  legendBlock: {
    gap: 6,
  },
  legendTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  legendLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  swatchGreen: {
    backgroundColor: colors.green,
  },
  swatchMuted: {
    backgroundColor: colors.border,
  },
  legendLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  legendValue: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 999,
  },
  fillGreen: {
    backgroundColor: colors.green,
  },
  fillMuted: {
    backgroundColor: colors.textDim,
  },
})
