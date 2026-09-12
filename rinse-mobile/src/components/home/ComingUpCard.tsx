import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import type { ComingUpJobData } from '@/src/lib/home-dashboard'
import { colors, spacing } from '@/src/theme/colors'
import { homeCardStyles } from './homeCardStyles'

interface ComingUpCardProps {
  job: ComingUpJobData
  onPress?: () => void
}

export function ComingUpCard({ job, onPress }: ComingUpCardProps) {
  return (
    <Pressable style={({ pressed }) => [homeCardStyles.card, styles.card, pressed && homeCardStyles.cardPressed]} onPress={onPress} accessibilityRole="button">
      <View style={styles.date}>
        <AppText variant="caption" style={styles.month}>
          {job.monthLabel}
        </AppText>
        <AppText variant="h2" style={styles.day}>
          {job.dayLabel}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="bodySemiBold">{job.clientName}</AppText>
        <AppText variant="caption" style={styles.sub}>
          {job.packageName} · {job.datetimeLabel}
        </AppText>
        <AppText variant="caption" style={styles.meta}>
          {job.vehicleType} · {job.locationLabel}
        </AppText>
      </View>
      <AppText variant="caption" style={styles.status}>
        {job.statusLabel}
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    alignItems: 'center',
    minWidth: 44,
  },
  month: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  day: {
    lineHeight: 28,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  sub: {
    color: colors.textSecondary,
  },
  meta: {
    color: colors.textMuted,
  },
  status: {
    color: colors.green,
    fontWeight: '600',
  },
})
