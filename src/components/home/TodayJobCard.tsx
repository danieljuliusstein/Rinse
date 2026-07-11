import { Pressable, StyleSheet, View } from 'react-native'
import { CalendarBlank, MapPin } from 'phosphor-react-native'
import { AppText, SecondaryButton } from '@/src/components/ui'
import type { TodayJobCardData } from '@/src/lib/home-dashboard'
import { todayJobDetailsLine } from '@/src/lib/home-dashboard'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

interface TodayJobCardProps {
  job: TodayJobCardData | null
  onDirections: (address: string) => void
  onOpenJob: (jobId: string) => void
  onSchedule: () => void
}

export function TodayJobCard({ job, onDirections, onOpenJob, onSchedule }: TodayJobCardProps) {
  if (!job) {
    return (
      <View style={styles.emptyCard}>
        <CalendarBlank size={28} color={colors.textMuted} weight="duotone" />
        <AppText variant="body" style={styles.emptyText}>
          No jobs scheduled for today
        </AppText>
        <Pressable style={styles.scheduleBtn} onPress={onSchedule} accessibilityRole="button">
          <AppText variant="bodyMedium" style={styles.scheduleBtnText}>
            Schedule a job
          </AppText>
        </Pressable>
      </View>
    )
  }

  const hasAddress = Boolean(job.address?.trim())

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.topText}>
          <AppText variant="bodyMedium" style={styles.client}>
            {job.clientName}
          </AppText>
          <AppText variant="caption" style={styles.details}>
            {todayJobDetailsLine(job)}
          </AppText>
        </View>
        {job.startTimeLabel ? (
          <View style={styles.timePill}>
            <AppText variant="caption" style={styles.timeText}>
              {job.startTimeLabel}
            </AppText>
          </View>
        ) : null}
      </View>

      {hasAddress ? (
        <View style={styles.addressRow}>
          <MapPin size={15} color={colors.textSecondary} weight="duotone" />
          <AppText variant="caption" style={styles.addressText}>
            {job.address}
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.actionHalf}>
          <SecondaryButton
            label="Directions"
            onPress={() => job.address && onDirections(job.address)}
            disabled={!hasAddress}
          />
        </View>
        <Pressable style={styles.openBtn} onPress={() => onOpenJob(job.id)} accessibilityRole="button">
          <AppText variant="bodySemiBold" style={styles.openBtnText}>
            Open job
          </AppText>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scheduleBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: iconTonePalette.green.bg,
  },
  scheduleBtnText: {
    color: colors.green,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  topText: {
    flex: 1,
    gap: 2,
  },
  client: {
    fontSize: 17,
  },
  details: {
    color: colors.textSecondary,
  },
  timePill: {
    backgroundColor: iconTonePalette.green.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    color: colors.green,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  addressText: {
    flex: 1,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionHalf: {
    flex: 1,
  },
  openBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    borderRadius: 10,
    paddingVertical: 12,
  },
  openBtnText: {
    color: '#ffffff',
  },
})
