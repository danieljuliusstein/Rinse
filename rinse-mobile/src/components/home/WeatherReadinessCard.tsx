import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native'
import {
  CaretRight,
  Check,
  CloudRain,
  CloudSun,
  Drop,
  Eye,
  Sun,
  Thermometer,
  Warning,
  WarningCircle,
  type Icon,
} from '@/src/icons'
import { AppText } from '@/src/components/ui'
import type { WeatherReadinessResult, WeatherReadinessRow } from '@/src/lib/weather-readiness'
import {
  WEATHER_READINESS_EMPTY_MESSAGE,
  WEATHER_READINESS_NO_ADDRESS_MESSAGE,
  WEATHER_READINESS_OFFLINE_MESSAGE,
  WEATHER_READINESS_UNRESOLVED_MESSAGE,
  readinessSeverityForRow,
  type ReadinessSeverity,
  weatherReadinessPartialNote,
} from '@/src/lib/weather-readiness'
import { selectionHaptic } from '@/src/lib/haptics'
import { colors, radii, shadows, spacing, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type WeatherReadinessCardProps = {
  result: WeatherReadinessResult | null
  loading?: boolean
  /** Optional refresh handler triggered by the UI. */
  onRefresh?: () => Promise<void>
  /** Opens the outdoor-job reschedule sheet (risk rows). */
  onReschedule?: () => void
}

type SeverityVisual = {
  accent: string
  iconBg: string
  iconColor: string
  pillBg: string
  pillColor: string
  WeatherIcon: Icon
  PillIcon: Icon
  pillLabel: string
}

const SEVERITY: Record<Exclude<ReadinessSeverity, 'empty' | 'unresolved'>, SeverityVisual> = {
  high: {
    accent: '#9A5B1F',
    iconBg: '#FDEDD2',
    iconColor: '#9A5B1F',
    pillBg: '#FDEDD2',
    pillColor: '#9A5B1F',
    WeatherIcon: CloudRain,
    PillIcon: Warning,
    pillLabel: 'High rain risk',
  },
  watch: {
    accent: '#F59E0B',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    pillBg: '#FFFBEB',
    pillColor: '#B45309',
    WeatherIcon: CloudSun,
    PillIcon: Eye,
    pillLabel: 'Watch',
  },
  clear: {
    accent: '#22c55e',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    pillBg: '#ECFDF5',
    pillColor: '#047857',
    WeatherIcon: Sun,
    PillIcon: Check,
    pillLabel: 'Clear',
  },
}

function pillLabelForRow(row: WeatherReadinessRow, severity: keyof typeof SEVERITY): string {
  if (row.statusLabel && severity === 'high') return row.statusLabel
  return SEVERITY[severity].pillLabel
}

function ReadinessRowCard({
  row,
  onReschedule,
}: {
  row: WeatherReadinessRow
  onReschedule?: () => void
}) {
  const severity = readinessSeverityForRow(row)
  const visual = SEVERITY[severity]
  const { WeatherIcon, PillIcon } = visual
  const atRisk = row.kind === 'risk'
  const temp =
    typeof row.tempMaxF === 'number' && Number.isFinite(row.tempMaxF)
      ? `${Math.round(row.tempMaxF)}°`
      : null
  const rain =
    typeof row.precipChance === 'number' && Number.isFinite(row.precipChance)
      ? `${Math.round(row.precipChance)}%`
      : null

  return (
    <Pressable
      onPress={() => {
        if (!atRisk || !onReschedule) return
        selectionHaptic()
        onReschedule()
      }}
      disabled={!atRisk || !onReschedule}
      style={({ pressed }) => [
        styles.card,
        webPressableReset,
        pressed && atRisk && styles.cardPressed,
      ]}
      accessibilityRole={atRisk && onReschedule ? 'button' : 'summary'}
      accessibilityLabel={`${row.primary}. ${visual.pillLabel}. ${row.secondary}`}
    >
      <View style={[styles.accent, { backgroundColor: visual.accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.mainRow}>
          <View style={[styles.iconCircle, { backgroundColor: visual.iconBg }]}>
            <WeatherIcon size={22} color={visual.iconColor} weight="duotone" />
          </View>
          <View style={styles.textStack}>
            <AppText style={styles.primary} numberOfLines={1}>
              {row.primary}
            </AppText>
            {row.secondary ? (
              <AppText style={styles.secondary} numberOfLines={1}>
                {row.secondary}
              </AppText>
            ) : null}
          </View>
          <View style={[styles.pill, { backgroundColor: visual.pillBg }]}>
            <PillIcon size={14} color={visual.pillColor} weight="bold" />
            <AppText style={[styles.pillLabel, { color: visual.pillColor }]}>
              {pillLabelForRow(row, severity)}
            </AppText>
          </View>
        </View>

        {(temp || rain || (atRisk && onReschedule)) && (
          <View style={styles.statsRow}>
            {temp ? (
              <View style={styles.stat}>
                <Thermometer size={14} color={colors.textMuted} weight="duotone" />
                <AppText style={styles.statText}>{temp}</AppText>
              </View>
            ) : null}
            {temp && rain ? <View style={styles.statDivider} /> : null}
            {rain ? (
              <View style={styles.stat}>
                <Drop size={14} color={colors.textMuted} weight="duotone" />
                <AppText style={styles.statText}>{rain} rain</AppText>
              </View>
            ) : null}
            {atRisk && onReschedule ? (
              <View style={styles.rescheduleCue}>
                <AppText style={styles.rescheduleLabel}>Reschedule</AppText>
                <CaretRight size={14} color={colors.textMuted} weight="bold" />
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  )
}

function EmptyCard({ onRefresh }: { onRefresh?: () => Promise<void> }) {
  return (
    <Pressable
      onPress={async () => {
        if (!onRefresh) return
        try {
          await onRefresh()
        } catch {
          Alert.alert('Refresh failed', 'Could not refresh forecast')
        }
      }}
      style={[styles.card, webPressableReset]}
      accessibilityRole="summary"
    >
      <View style={[styles.accent, { backgroundColor: SEVERITY.clear.accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.mainRow}>
          <View style={[styles.iconCircle, { backgroundColor: SEVERITY.clear.iconBg }]}>
            <Check size={22} color={SEVERITY.clear.iconColor} weight="bold" />
          </View>
          <View style={styles.textStack}>
            <AppText style={styles.primary}>{WEATHER_READINESS_EMPTY_MESSAGE}</AppText>
            <AppText style={styles.secondary}>Indoor details only — nothing weather-sensitive.</AppText>
          </View>
          <View style={[styles.pill, { backgroundColor: SEVERITY.clear.pillBg }]}>
            <Check size={14} color={SEVERITY.clear.pillColor} weight="bold" />
            <AppText style={[styles.pillLabel, { color: SEVERITY.clear.pillColor }]}>All clear</AppText>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function UnresolvedCard({
  message,
  onRefresh,
}: {
  message: string
  onRefresh?: () => Promise<void>
}) {
  return (
    <Pressable
      onPress={async () => {
        if (!onRefresh) return
        try {
          await onRefresh()
        } catch {
          Alert.alert('Refresh failed', 'Could not refresh forecast')
        }
      }}
      style={[styles.card, webPressableReset]}
      accessibilityRole="button"
      accessibilityLabel={`${message}. Tap to refresh.`}
    >
      <View style={[styles.accent, { backgroundColor: colors.amber }]} />
      <View style={styles.cardBody}>
        <View style={styles.mainRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF7ED' }]}>
            <WarningCircle size={22} color={colors.amber} weight="duotone" />
          </View>
          <View style={styles.textStack}>
            <AppText style={styles.primary}>{message}</AppText>
            {onRefresh ? <AppText style={styles.secondary}>Tap to refresh</AppText> : null}
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function LoadingCard() {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={[styles.accent, { backgroundColor: colors.green }]} />
      <View style={[styles.cardBody, styles.loadingBody]}>
        <ActivityIndicator size="small" color={colors.greenText} />
        <AppText style={styles.primary}>Checking forecast…</AppText>
      </View>
    </View>
  )
}

export function WeatherReadinessCard({
  result,
  loading,
  onRefresh,
  onReschedule,
}: WeatherReadinessCardProps) {
  if (loading) return <LoadingCard />
  if (!result) return null

  if (result.status === 'no_jobs') {
    return <EmptyCard onRefresh={onRefresh} />
  }

  if (result.status === 'unresolved') {
    const message =
      result.reason === 'no_address'
        ? WEATHER_READINESS_NO_ADDRESS_MESSAGE
        : result.reason === 'offline'
          ? WEATHER_READINESS_OFFLINE_MESSAGE
          : WEATHER_READINESS_UNRESOLVED_MESSAGE
    return <UnresolvedCard message={message} onRefresh={onRefresh} />
  }

  return (
    <View style={styles.stack}>
      {result.rows.map((row, index) => (
        <ReadinessRowCard
          key={row.kind === 'risk' ? `${row.jobId}-${index}` : `${row.date ?? row.primary}-${index}`}
          row={row}
          onReschedule={onReschedule}
        />
      ))}
      {result.status === 'partial' && result.unresolvedCount ? (
        <AppText style={styles.partialNote}>{weatherReadinessPartialNote(result.unresolvedCount)}</AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardBody: {
    paddingLeft: 18,
    paddingRight: 12,
  },
  loadingBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  primary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  secondary: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
    maxWidth: 140,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(229, 229, 234, 0.7)',
    paddingVertical: 10,
    paddingRight: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 12,
    backgroundColor: colors.border,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  rescheduleCue: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rescheduleLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  partialNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body,
    paddingHorizontal: 4,
  },
})
