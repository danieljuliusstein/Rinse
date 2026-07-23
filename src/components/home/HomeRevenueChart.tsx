import Svg, { Path, Circle } from 'react-native-svg'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { JobWithRelations } from '@rinse/core'
import { fmt } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { aggregateJobsRevenue, donutArcPath, filterJobsByRange } from '@/src/lib/jobs-revenue'
import { colors, spacing } from '@/src/theme/colors'
import { homeCardStyles } from './homeCardStyles'

const CX = 54
const CY = 54
const OUTER = 48
const INNER = 30

interface HomeRevenueChartProps {
  jobs: JobWithRelations[]
}

export function HomeRevenueChart({ jobs }: HomeRevenueChartProps) {
  const { t } = useTranslation()
  const monthJobs = useMemo(() => filterJobsByRange(jobs, 'this_month'), [jobs])
  const stats = useMemo(() => aggregateJobsRevenue(monthJobs), [monthJobs])

  const slices = useMemo(() => {
    if (stats.totalRevenue <= 0) return []
    let angle = -Math.PI / 2
    return stats.services.map((slice) => {
      const sweep = (slice.amount / stats.totalRevenue) * Math.PI * 2
      const start = angle
      angle += sweep
      return { slice, startAngle: start, endAngle: angle }
    })
  }, [stats])

  if (stats.jobCount === 0) return null

  return (
    <View style={[homeCardStyles.card, styles.card]}>
      <AppText variant="sectionLabel">{t('home.serviceMix')}</AppText>
      <AppText variant="caption" style={styles.meta}>
        {fmt(stats.totalRevenue)} this month
      </AppText>
      <View style={styles.body}>
        <Svg width={108} height={108} viewBox="0 0 108 108">
          {slices.map(({ slice, startAngle, endAngle }) => (
            <Path
              key={slice.label}
              d={donutArcPath(CX, CY, OUTER, INNER, startAngle, endAngle)}
              fill={slice.color}
              stroke={colors.surface}
              strokeWidth={1}
            />
          ))}
          <Circle cx={CX} cy={CY} r={INNER - 1} fill={colors.surface} />
        </Svg>
        <View style={styles.legend}>
          {stats.services.slice(0, 4).map((s) => (
            <View key={s.label} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: s.color }]} />
              <AppText variant="caption" style={styles.legendLabel} numberOfLines={1}>
                {s.label}
              </AppText>
              <AppText variant="caption" style={styles.legendAmt}>
                {fmt(s.amount)}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
  },
  meta: {
    color: colors.textMuted,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    color: colors.textSecondary,
  },
  legendAmt: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
})
