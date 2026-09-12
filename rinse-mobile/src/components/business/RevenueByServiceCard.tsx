import { StyleSheet, View } from 'react-native'
import { fmt } from '@rinse/core'
import type { JobWithRelations } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { aggregateJobsRevenue } from '@/src/lib/jobs-revenue'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const GREEN_SHADES = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']

type RevenueByServiceCardProps = {
  jobs: JobWithRelations[]
}

export function RevenueByServiceCard({ jobs }: RevenueByServiceCardProps) {
  const stats = aggregateJobsRevenue(jobs)
  if (stats.services.length === 0) {
    return (
      <View style={styles.card}>
        <AppText style={styles.title}>Revenue by service</AppText>
        <AppText style={styles.empty}>No revenue in this period.</AppText>
      </View>
    )
  }

  const max = Math.max(...stats.services.map((s) => s.amount), 1)
  const total = stats.totalRevenue
  const services = stats.services.map((s, i) => ({
    ...s,
    color: GREEN_SHADES[i % GREEN_SHADES.length],
  }))

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText style={styles.title}>Revenue by service</AppText>
        <AppText style={styles.total}>{fmt(total)} total</AppText>
      </View>

      <View style={styles.stack}>
        {services.map((s) => (
          <View
            key={s.label}
            style={[styles.stackSeg, { flex: Math.max(s.amount, 1), backgroundColor: s.color }]}
          />
        ))}
      </View>

      <View style={styles.list}>
        {services.map((s) => {
          const pct = (s.amount / max) * 100
          const sharePct = total > 0 ? Math.round((s.amount / total) * 100) : 0
          return (
            <View key={s.label} style={styles.row}>
              <AppText style={styles.name} numberOfLines={1}>
                {s.label}
              </AppText>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: s.color }]} />
              </View>
              <AppText style={styles.pct}>{sharePct}%</AppText>
            </View>
          )
        })}
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
    gap: spacing.md,
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
  total: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  empty: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  stack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  stackSeg: {
    height: 10,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    width: 88,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 999,
  },
  pct: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
})
