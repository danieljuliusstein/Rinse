import { Pressable, StyleSheet, View } from 'react-native'
import { NavigationArrow } from 'phosphor-react-native'
import { AppText, Button } from '@/src/components/ui'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

interface DayRouteBannerProps {
  /** Clear date filter (Jobs screen). Omit to hide clear chip. */
  onClearDate?: () => void
  dateLabel?: string | null
  clearLabel?: string
  hint: string
  startLabel: string
  onStartRoute: () => void
  startDisabled?: boolean
}

export function DayRouteBanner({
  onClearDate,
  dateLabel,
  clearLabel,
  hint,
  startLabel,
  onStartRoute,
  startDisabled,
}: DayRouteBannerProps) {
  return (
    <View style={styles.wrap}>
      {onClearDate && dateLabel ? (
        <Pressable
          onPress={onClearDate}
          style={styles.dateChip}
          accessibilityRole="button"
        >
          <AppText variant="caption" style={styles.dateChipText}>
            {clearLabel ?? `Showing ${dateLabel} · Clear`}
          </AppText>
        </Pressable>
      ) : null}
      <View style={styles.card}>
        <View style={styles.hintRow}>
          <NavigationArrow size={16} color={colors.greenText} weight="bold" />
          <AppText variant="caption" style={styles.hint}>
            {hint}
          </AppText>
        </View>
        <Button
          label={startLabel}
          onPress={onStartRoute}
          disabled={startDisabled}
          style={styles.cta}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateChip: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: iconTonePalette.green.bg,
  },
  dateChipText: {
    color: colors.greenText,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    flex: 1,
    color: colors.textSecondary,
  },
  cta: {
    alignSelf: 'stretch',
  },
})
