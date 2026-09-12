import { StyleSheet, View } from 'react-native'
import { AppSheet, AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { colors, radii, spacing } from '@/src/theme/colors'

interface BlockedDaySheetProps {
  date: string | null
  message: string
  onClose: () => void
  onManageBlocks: (date: string) => void
}

function formatCalendarDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function BlockedDaySheet({ date, message, onClose, onManageBlocks }: BlockedDaySheetProps) {
  return (
    <AppSheet
      presentation="modal"
      visible={date !== null}
      title="Day blocked"
      subtitle={date ? formatCalendarDay(date) : undefined}
      onClose={onClose}
      footer={
        date ? (
          <View style={styles.footer}>
            <PrimaryButton label="Manage blocks" onPress={() => onManageBlocks(date)} />
            <SecondaryButton label="Close" onPress={onClose} />
          </View>
        ) : null
      }
    >
      {date ? (
        <View style={styles.body}>
          <AppText variant="body" style={styles.copy}>
            {message}
          </AppText>
          <AppText variant="caption" style={styles.hint}>
            Update your work days or time off in Schedule & time off.
          </AppText>
        </View>
      ) : null}
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
  body: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  copy: {
    color: colors.textPrimary,
  },
  hint: {
    color: colors.textMuted,
  },
})
