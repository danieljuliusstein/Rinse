import { Pressable, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { AppText } from '@/src/components/ui/AppText'
import { usePillPopScale } from '@/src/hooks/useMotionArchetypes'
import { selectionHaptic } from '@/src/lib/haptics'
import { colors, radii } from '@/src/theme/colors'
import type { PillOption } from './PillGroup'

interface PillButtonProps<T extends string> {
  option: PillOption<T>
  selected: boolean
  onSelect: (value: T) => void
}

export function PillButton<T extends string>({ option, selected, onSelect }: PillButtonProps<T>) {
  const popStyle = usePillPopScale(selected)

  return (
    <Pressable
      onPress={() => {
        selectionHaptic()
        onSelect(option.value)
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Animated.View style={[styles.pill, selected && styles.pillOn, popStyle]}>
        <AppText variant="bodyMedium" style={[styles.pillLabel, selected && styles.pillLabelOn]}>
          {option.label}
        </AppText>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillOn: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  pillLabel: {
    color: colors.textPrimary,
  },
  pillLabelOn: {
    color: colors.greenText,
    fontFamily: 'DMSans_600SemiBold',
  },
})
