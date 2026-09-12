import { StyleSheet, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { TrendUp } from '@/src/icons'
import { fmt } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { smoothPath } from '@/src/lib/smooth-path'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export type BusinessStatItem = {
  id: string
  label: string
  value: number
  growth?: number | null
  trend: number[]
  unsigned?: boolean
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 70
  const h = 24
  const step = w / (data.length - 1)
  const coords = data.map((p, i) => ({
    x: i * step,
    y: h - ((p - min) / range) * (h - 4) - 2,
  }))
  return (
    <Svg width={70} height={24} viewBox={`0 0 ${w} ${h}`}>
      <Path
        d={smoothPath(coords)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function StatCard({ stat }: { stat: BusinessStatItem }) {
  const sparkColor = stat.growth != null ? '#22c55e' : '#c7c7cc'
  const display = stat.unsigned ? Math.abs(stat.value) : stat.value

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <AppText style={styles.label}>{stat.label}</AppText>
        {stat.growth != null ? (
          <View style={styles.growthPill}>
            <TrendUp size={10} color="#16a34a" weight="bold" />
            <AppText style={styles.growthText}>
              {stat.growth >= 0 ? '+' : ''}
              {stat.growth}%
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText style={styles.value}>{fmt(display)}</AppText>
      <View style={styles.bottom}>
        <AppText style={styles.trendLabel}>Period trend</AppText>
        <MiniSpark data={stat.trend} color={sparkColor} />
      </View>
    </View>
  )
}

export function BusinessStatGrid({ stats }: { stats: BusinessStatItem[] }) {
  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    backgroundColor: '#effdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  growthText: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: '#16a34a',
  },
  value: {
    marginTop: 6,
    fontFamily: fonts.displayBold,
    fontSize: 22,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  bottom: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  trendLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    color: colors.textDim,
  },
})
