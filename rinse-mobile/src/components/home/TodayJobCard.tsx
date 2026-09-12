import { Pressable, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { CalendarBlank, MapPin } from '@/src/icons'
import { AppText, SecondaryButton } from '@/src/components/ui'
import type { TodayJobCardData } from '@/src/lib/home-dashboard'
import { todayJobDetailsLine } from '@/src/lib/home-dashboard'
import { colors, iconTonePalette, radii, spacing } from '@/src/theme/colors'
import { homeCardStyles } from './homeCardStyles'

interface TodayJobCardProps {
  job: TodayJobCardData | null
  onDirections: (address: string) => void
  onOpenJob: (jobId: string) => void
  onSchedule: () => void
}

export function TodayJobCard({ job, onDirections, onOpenJob, onSchedule }: TodayJobCardProps) {
  const { t } = useTranslation()
  if (!job) {
    return (
      <View style={[homeCardStyles.card, styles.emptyCard]}>
        <CalendarBlank size={28} color={colors.textMuted} weight="duotone" />
        <AppText variant="body" style={styles.emptyText}>
          {t('home.noJobsToday')}
        </AppText>
        <Pressable
          style={({ pressed }) => [styles.scheduleBtn, pressed && styles.scheduleBtnPressed]}
          onPress={onSchedule}
          accessibilityRole="button"
          accessibilityLabel={t('home.scheduleJob')}
        >
          <AppText variant="bodySemiBold" style={styles.scheduleBtnText}>
            {t('home.scheduleJob')}
          </AppText>
        </Pressable>
      </View>
    )
  }

  const hasAddress = Boolean(job.address?.trim())

  return (
    <View style={homeCardStyles.card}>
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
            label={t('common.directions')}
            onPress={() => job.address && onDirections(job.address)}
            disabled={!hasAddress}
          />
        </View>
        <Pressable style={styles.openBtn} onPress={() => onOpenJob(job.id)} accessibilityRole="button">
          <AppText variant="bodySemiBold" style={styles.openBtnText}>
            {t('home.openJob')}
          </AppText>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scheduleBtn: {
    marginTop: spacing.xs,
    minHeight: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.green,
  },
  scheduleBtnPressed: {
    opacity: 0.9,
  },
  scheduleBtnText: {
    color: '#ffffff',
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
