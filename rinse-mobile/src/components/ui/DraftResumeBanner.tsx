import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { colors, spacing, webInlinePressableReset } from '@/src/theme/colors'

export function DraftResumeBanner({
  restoredAt,
  onDiscard,
}: {
  restoredAt: string | null
  onDiscard?: () => void
}) {
  if (!restoredAt) return null

  let when = 'earlier'
  try {
    when = new Date(restoredAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    // keep fallback
  }

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <View style={styles.textCol}>
        <AppText variant="caption" style={styles.title}>
          Resume draft
        </AppText>
        <AppText variant="caption" style={styles.meta}>
          Saved {when}
        </AppText>
      </View>
      {onDiscard ? (
        <Pressable
          onPress={onDiscard}
          style={({ pressed }) => [styles.discard, webInlinePressableReset, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Discard draft"
        >
          <AppText variant="caption" style={styles.discardLabel}>
            Discard
          </AppText>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenSoft,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.greenText,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
  },
  discard: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  discardLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
})
