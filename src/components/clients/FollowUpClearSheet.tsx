import { Pressable, StyleSheet, View } from 'react-native'
import { ClockCountdown, XCircle } from '@/src/icons'
import { AppSheet, AppText } from '@/src/components/ui'
import { SNOOZE_DAYS } from '@/src/lib/follow-up-prefs'
import { colors, radii, spacing, webPressableReset } from '@/src/theme/colors'

export type FollowUpClearTarget = {
  id: string
  name: string
}

type FollowUpClearSheetProps = {
  target: FollowUpClearTarget | null
  onClose: () => void
  onSnooze: (days: number) => void
  onDismissUntilNextJob: () => void
}

const OPTIONS: {
  key: string
  label: string
  hint: string
  days?: number
  action: 'snooze' | 'dismiss'
}[] = [
  {
    key: 'week',
    label: 'Snooze 1 week',
    hint: 'Bring it back in 7 days if still overdue',
    days: SNOOZE_DAYS.week,
    action: 'snooze',
  },
  {
    key: 'month',
    label: 'Snooze 30 days',
    hint: 'Quiet this reminder for a month',
    days: SNOOZE_DAYS.month,
    action: 'snooze',
  },
  {
    key: 'dismiss',
    label: 'Dismiss until next job',
    hint: 'Hide until they book again',
    action: 'dismiss',
  },
]

export function FollowUpClearSheet({
  target,
  onClose,
  onSnooze,
  onDismissUntilNextJob,
}: FollowUpClearSheetProps) {
  return (
    <AppSheet
      presentation="modal"
      visible={target !== null}
      title="Clear follow-up"
      subtitle={
        target
          ? `Hide ${target.name} without chasing. You can turn the whole queue off in Preferences.`
          : undefined
      }
      onClose={onClose}
    >
      {target ? (
        <View style={styles.list}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={({ pressed }) => [styles.row, webPressableReset, pressed && styles.pressed]}
              onPress={() => {
                if (opt.action === 'snooze' && opt.days != null) onSnooze(opt.days)
                else onDismissUntilNextJob()
              }}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <View style={styles.iconWrap}>
                {opt.action === 'dismiss' ? (
                  <XCircle size={22} color={colors.textSecondary} weight="duotone" />
                ) : (
                  <ClockCountdown size={22} color={colors.textSecondary} weight="duotone" />
                )}
              </View>
              <View style={styles.rowBody}>
                <AppText variant="bodySemiBold">{opt.label}</AppText>
                <AppText variant="caption" style={styles.hint}>
                  {opt.hint}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  hint: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.88,
  },
})
