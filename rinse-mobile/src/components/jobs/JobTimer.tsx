import { StyleSheet, View } from 'react-native'
import { Clock } from '@/src/icons'
import { useJobTimer } from '@/src/hooks/useJobTimer'
import { AppText } from '@/src/components/ui/AppText'
import { PrimaryButton } from '@/src/components/ui/Button'
import { SecondaryButton } from '@/src/components/ui/Button'
import { colors, spacing } from '@/src/theme/colors'

interface JobTimerProps {
  jobId: string
  onStopped?: (hours: number) => void
  /** Embedded inside accordion — no card chrome or primary start/stop (parent owns CTA). */
  embedded?: boolean
}

export function JobTimer({ jobId, onStopped, embedded = false }: JobTimerProps) {
  const timer = useJobTimer(jobId, onStopped)

  if (embedded) {
    return (
      <View style={styles.embedded}>
        <View style={styles.timerBlock}>
          <View style={styles.liveRow}>
            {timer.running ? <View style={styles.liveDot} /> : null}
            <AppText variant="sectionLabel" style={styles.timerLabel}>
              TIME ON JOB
            </AppText>
          </View>
          <AppText variant="bodySemiBold" style={styles.display}>
            {timer.formatted}
          </AppText>
        </View>
        {timer.elapsedMs > 0 && !timer.running ? (
          <SecondaryButton label="Reset timer" onPress={timer.reset} />
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Clock size={18} color={colors.textSecondary} weight="duotone" />
        <AppText variant="sectionLabel">Time on job</AppText>
      </View>
      <AppText variant="bodySemiBold" style={styles.display}>
        {timer.formatted}
      </AppText>
      <View style={styles.actions}>
        {timer.running ? (
          <SecondaryButton label="Stop" onPress={timer.stop} />
        ) : (
          <PrimaryButton label="Start timer" onPress={timer.start} />
        )}
        {timer.elapsedMs > 0 && !timer.running ? (
          <SecondaryButton label="Reset" onPress={timer.reset} />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  embedded: {
    gap: spacing.sm,
  },
  timerBlock: {
    backgroundColor: colors.greenSoft,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  timerLabel: {
    color: colors.greenText,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  actions: {
    gap: spacing.sm,
  },
})
