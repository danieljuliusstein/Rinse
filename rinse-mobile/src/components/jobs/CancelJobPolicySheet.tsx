import { StyleSheet, View } from 'react-native'
import type { BusinessPolicies } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'

export function CancelJobPolicySheet({
  visible,
  onClose,
  policies,
  busy,
  onConfirmCancel,
}: {
  visible: boolean
  onClose: () => void
  policies: BusinessPolicies
  busy?: boolean
  onConfirmCancel: () => void
}) {
  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Cancel job"
      subtitle="Review your cancel policy before removing this job"
      onClose={onClose}
    >
      <View style={styles.card}>
        <AppText variant="bodyMedium">Cancel window</AppText>
        <AppText variant="body" style={styles.muted}>
          {policies.cancel_window_hours} hours before the appointment
        </AppText>
        {policies.no_show_fee > 0 ? (
          <>
            <AppText variant="bodyMedium" style={styles.gap}>
              No-show fee
            </AppText>
            <AppText variant="body" style={styles.muted}>
              ${policies.no_show_fee.toFixed(2)}
              {policies.no_show_fee_copy ? ` — ${policies.no_show_fee_copy}` : ''}
            </AppText>
          </>
        ) : (
          <AppText variant="caption" style={[styles.muted, styles.gap]}>
            No no-show fee configured.
          </AppText>
        )}
      </View>
      <AppText variant="caption" style={styles.muted}>
        Cancel removes this job from your schedule. Collect any deposit or no-show fee separately if
        needed.
      </AppText>
      <View style={styles.actions}>
        <PrimaryButton label="Cancel job" loading={busy} onPress={onConfirmCancel} />
        <SecondaryButton label="Keep job" onPress={onClose} disabled={busy} />
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.textSecondary,
  },
  gap: {
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
})
