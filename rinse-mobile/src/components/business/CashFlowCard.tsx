import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { WaterfallChart } from '@/src/components/reports/WaterfallChart'
import type { WeeklyCompareBucket } from '@/src/lib/business-series'
import type { WaterfallData } from '@/src/lib/reports-metrics'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export type CashFlowMode = 'compare' | 'waterfall'

/** Build stamp — if Defs error persists while this logs, source≠bundle. */
const CASHFLOW_BUILD = 'cashflow-view-bars-2026-08-08b'

type CashFlowCardProps = {
  mode: CashFlowMode
  onModeChange: (mode: CashFlowMode) => void
  compareSeries: WeeklyCompareBucket[]
  waterfall: WaterfallData
}

function CompareChart({ series }: { series: WeeklyCompareBucket[] }) {
  // #region agent log
  fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'post-fix',hypothesisId:'CMP1',location:'CashFlowCard.tsx:CompareChart',message:'CompareChart series',data:{build:CASHFLOW_BUILD,series,max:Math.max(...series.flatMap((s)=>[s.revenue,s.expenses]),1)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (series.length === 0) {
    return <AppText style={styles.empty}>No cash-flow data for this period.</AppText>
  }

  const max = Math.max(...series.flatMap((s) => [s.revenue, s.expenses]), 1)
  const plotH = 120

  return (
    <View>
      <View style={styles.chartRow}>
        {series.map((s) => {
          const revH = s.revenue > 0 ? Math.max(4, (s.revenue / max) * plotH) : 0
          const expH = s.expenses > 0 ? Math.max(4, (s.expenses / max) * plotH) : 0
          return (
            <View key={s.label} style={styles.group}>
              <View style={[styles.bars, { height: plotH }]}>
                <View style={[styles.bar, styles.barRev, { height: revH || 0 }]} />
                <View style={[styles.bar, styles.barExp, { height: expH || 0 }]} />
              </View>
              <AppText style={styles.axisLabel}>{s.label}</AppText>
            </View>
          )
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendRev]} />
          <AppText style={styles.legendLabel}>Revenue</AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendExp]} />
          <AppText style={styles.legendLabel}>Expenses</AppText>
        </View>
      </View>
    </View>
  )
}

export function CashFlowCard({ mode, onModeChange, compareSeries, waterfall }: CashFlowCardProps) {
  // #region agent log
  fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'pre-fix',hypothesisId:'A',location:'CashFlowCard.tsx:CashFlowCard',message:'CashFlowCard mount/render',data:{build:CASHFLOW_BUILD,mode,compareLen:compareSeries.length,waterfallLabels:waterfall?.labels?.length??0},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return (
    <View style={styles.card} testID={CASHFLOW_BUILD}>
      <View style={styles.header}>
        <AppText style={styles.title}>Cash flow</AppText>
        <View style={styles.toggle}>
          {(['compare', 'waterfall'] as CashFlowMode[]).map((m) => {
            const on = mode === m
            return (
              <Pressable
                key={m}
                onPress={() => onModeChange(m)}
                style={[styles.toggleBtn, on && styles.toggleBtnOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <AppText style={[styles.toggleLabel, on && styles.toggleLabelOn]}>
                  {m === 'compare' ? 'Compare' : 'Waterfall'}
                </AppText>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.body}>
        {mode === 'compare' ? <CompareChart series={compareSeries} /> : <WaterfallChart data={waterfall} />}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: colors.bg,
    padding: 2,
  },
  toggleBtn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleBtnOn: {
    backgroundColor: colors.surface,
  },
  toggleLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  toggleLabelOn: {
    color: colors.textPrimary,
  },
  body: {
    marginTop: spacing.md,
  },
  empty: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  group: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  bar: {
    width: 14,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 0,
  },
  barRev: {
    backgroundColor: colors.green,
  },
  barExp: {
    backgroundColor: colors.textDim,
  },
  axisLabel: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  legend: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendRev: {
    backgroundColor: colors.green,
  },
  legendExp: {
    backgroundColor: colors.textDim,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
})
