import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { colors, iconTonePalette, spacing, webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function WorkDayPills({
  selected,
  onToggle,
}: {
  selected: number[]
  onToggle: (day: number) => void
}) {
  return (
    <View style={styles.row}>
      {DAY_LABELS.map((label, day) => {
        const on = selected.includes(day)
        return (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onToggle(day)}
            style={[styles.pill, on ? styles.pillOn : null, webInlinePressableReset]}
          >
            <AppText style={[styles.label, on ? styles.labelOn : null]}>{label}</AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillOn: {
    borderColor: colors.green,
    backgroundColor: iconTonePalette.green.bg,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.body,
  },
  labelOn: {
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
  },
})
