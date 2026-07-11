import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ArrowCounterClockwise, Clock, Pause, Play } from 'phosphor-react-native'
import {
  formatElapsedMs,
  getJobTimer,
  resetJobTimer,
  startJobTimer,
  stopJobTimer,
} from '@/src/lib/job-timer'
import { successHaptic } from '@/src/lib/haptics'
import { AppText } from '@/src/components/ui/AppText'
import { PrimaryButton } from '@/src/components/ui/Button'
import { SecondaryButton } from '@/src/components/ui/Button'
import { colors, spacing } from '@/src/theme/colors'

interface JobTimerProps {
  jobId: string
  onStopped?: (hours: number) => void
}

export function JobTimer({ jobId, onStopped }: JobTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      const state = await getJobTimer(jobId)
      if (!cancelled) {
        setElapsedMs(state.elapsedMs)
        setRunning(state.running)
      }
    }
    void sync()
    const id = setInterval(() => void sync(), 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [jobId])

  const handleStart = () => {
    void startJobTimer(jobId).then(() => setRunning(true))
  }

  const handleStop = () => {
    void stopJobTimer(jobId).then((total) => {
      setElapsedMs(total)
      setRunning(false)
      void successHaptic()
      onStopped?.(total / 3_600_000)
    })
  }

  const handleReset = () => {
    void resetJobTimer(jobId).then(() => {
      setElapsedMs(0)
      setRunning(false)
    })
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Clock size={18} color={colors.textSecondary} weight="duotone" />
        <AppText variant="sectionLabel">Time on job</AppText>
      </View>
      <AppText variant="bodySemiBold" style={styles.display}>
        {formatElapsedMs(elapsedMs)}
      </AppText>
      <View style={styles.actions}>
        {running ? (
          <SecondaryButton label="Stop" onPress={handleStop} />
        ) : (
          <PrimaryButton label="Start timer" onPress={handleStart} />
        )}
        {elapsedMs > 0 && !running ? (
          <SecondaryButton label="Reset" onPress={handleReset} />
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
