import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export type BusinessPillOption<T extends string> = {
  value: T
  label: string
}

type BusinessDatePillsProps<T extends string> = {
  options: BusinessPillOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function BusinessDatePills<T extends string>({
  options,
  value,
  onChange,
}: BusinessDatePillsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [styles.pill, active ? styles.pillOn : styles.pillOff, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
          >
            <AppText style={[styles.label, active ? styles.labelOn : styles.labelOff]}>{opt.label}</AppText>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 44,
    marginHorizontal: -spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillOn: {
    backgroundColor: colors.green,
  },
  pillOff: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  labelOn: {
    color: '#ffffff',
  },
  labelOff: {
    color: colors.textSecondary,
  },
})
