import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { CloudRain, Sun, WarningCircle } from 'phosphor-react-native'
import { AppText, Badge } from '@/src/components/ui'
import type { WeatherReadinessResult, WeatherReadinessRow } from '@/src/lib/weather-readiness'
import {
  WEATHER_READINESS_EMPTY_MESSAGE,
  WEATHER_READINESS_NO_ADDRESS_MESSAGE,
  WEATHER_READINESS_OFFLINE_MESSAGE,
  WEATHER_READINESS_UNRESOLVED_MESSAGE,
  weatherReadinessCompactSummary,
  weatherReadinessPartialNote,
} from '@/src/lib/weather-readiness'
import { colors, spacing } from '@/src/theme/colors'
import { homeCardStyles } from './homeCardStyles'

type WeatherReadinessCardProps = {
  result: WeatherReadinessResult | null
  loading?: boolean
  /** Home summary — icon + headline. */
  compact?: boolean
}

function ForecastRow({ row }: { row: WeatherReadinessRow }) {
  const isRisk = row.kind === 'risk'
  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <AppText variant="bodySemiBold">{row.primary}</AppText>
        {row.secondary ? <AppText variant="caption">{row.secondary}</AppText> : null}
      </View>
      {row.statusLabel ? (
        <Badge tone={isRisk ? 'amber' : 'green'} label={row.statusLabel} />
      ) : null}
    </View>
  )
}

export function WeatherReadinessCard({ result, loading, compact = false }: WeatherReadinessCardProps) {
  if (compact) {
    if (loading) {
      return (
        <View style={[homeCardStyles.card, styles.compactCard, styles.compactClear]} accessibilityRole="summary">
          <View style={styles.compactInner}>
            <ActivityIndicator size="small" color={colors.greenText} />
            <AppText variant="bodySemiBold" style={styles.compactTitle}>
              Checking forecast…
            </AppText>
          </View>
        </View>
      )
    }

    const compactSummary = weatherReadinessCompactSummary(result)
    if (!compactSummary) return null

    const Icon =
      compactSummary.tone === 'risk'
        ? CloudRain
        : compactSummary.tone === 'unresolved'
          ? WarningCircle
          : Sun
    const iconColor =
      compactSummary.tone === 'risk'
        ? '#3b6fc4'
        : compactSummary.tone === 'unresolved'
          ? colors.amber
          : colors.green
    const cardTone =
      compactSummary.tone === 'risk'
        ? styles.compactRisk
        : compactSummary.tone === 'unresolved'
          ? styles.compactUnresolved
          : styles.compactClear

    return (
      <View style={[homeCardStyles.card, cardTone, styles.compactCard]} accessibilityRole="summary">
        <View style={styles.compactInner}>
          <Icon size={18} color={iconColor} weight="duotone" />
          <AppText variant="bodySemiBold" style={styles.compactTitle}>
            {compactSummary.headline}
          </AppText>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[homeCardStyles.card, styles.card]}>
        <View style={styles.header}>
          <ActivityIndicator size="small" color={colors.greenText} />
          <AppText variant="bodySemiBold" style={styles.title}>
            Checking forecast…
          </AppText>
        </View>
      </View>
    )
  }

  if (!result) return null

  return (
    <View style={[homeCardStyles.card, styles.card]}>
      {result.status === 'no_jobs' ? (
        <View style={styles.header}>
          <Sun size={22} color={colors.green} weight="duotone" />
          <AppText variant="bodySemiBold" style={styles.title}>
            {WEATHER_READINESS_EMPTY_MESSAGE}
          </AppText>
        </View>
      ) : null}

      {result.status === 'unresolved' ? (
        <View style={styles.header}>
          <WarningCircle size={22} color={colors.amber} weight="duotone" />
          <AppText variant="bodySemiBold" style={styles.title}>
            {result.reason === 'no_address'
              ? WEATHER_READINESS_NO_ADDRESS_MESSAGE
              : result.reason === 'offline'
                ? WEATHER_READINESS_OFFLINE_MESSAGE
                : WEATHER_READINESS_UNRESOLVED_MESSAGE}
          </AppText>
        </View>
      ) : null}

      {result.status === 'ready' || result.status === 'partial' ? (
        <View style={styles.rows}>
          {result.rows.map((row) => (
            <ForecastRow key={row.kind === 'risk' ? row.jobId : row.date} row={row} />
          ))}
        </View>
      ) : null}

      {result.status === 'partial' && result.unresolvedCount ? (
        <AppText variant="caption" style={styles.partialNote}>
          {weatherReadinessPartialNote(result.unresolvedCount)}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  compactCard: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  compactInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactRisk: {
    backgroundColor: '#eef3fc',
    borderColor: '#cfe0f7',
  },
  compactClear: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  compactUnresolved: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  compactTitle: {
    flex: 1,
    fontSize: 15,
  },
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  partialNote: {
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
})
