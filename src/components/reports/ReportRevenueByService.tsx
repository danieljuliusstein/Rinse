import { StyleSheet, View } from 'react-native'
import { Dimensions } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import { fmt } from '@rinse/core'
import type { JobWithRelations } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { aggregateJobsRevenue } from '@/src/lib/jobs-revenue'
import { colors, spacing } from '@/src/theme/colors'

export function ReportRevenueByService({ jobs }: { jobs: JobWithRelations[] }) {
  const stats = aggregateJobsRevenue(jobs)
  const max = Math.max(...stats.services.map((s) => s.amount), 1)
  const barMaxWidth = Dimensions.get('window').width - 64

  if (stats.services.length === 0) {
    return (
      <AppText variant="caption" style={styles.empty}>
        No revenue in this period.
      </AppText>
    )
  }

  return (
    <View style={styles.list}>
      {stats.services.map((slice) => {
        const width = Math.max(8, (barMaxWidth * slice.amount) / max)
        const pct = stats.totalRevenue > 0 ? Math.round((slice.amount / stats.totalRevenue) * 100) : 0
        return (
          <View key={slice.label} style={styles.row}>
            <View style={styles.meta}>
              <AppText variant="bodySemiBold" numberOfLines={1} style={styles.label}>
                {slice.label}
              </AppText>
              <AppText variant="caption" style={styles.amount}>
                {fmt(slice.amount)} · {pct}%
              </AppText>
            </View>
            <Svg width="100%" height={8}>
              <Rect x={0} y={0} width={width} height={8} fill={slice.color} rx={4} />
            </Svg>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
  amount: {
    color: colors.textMuted,
  },
  empty: {
    color: colors.textMuted,
  },
})
