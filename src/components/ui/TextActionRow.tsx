import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { CaretRight } from '@/src/icons'
import { AppText } from '@/src/components/ui/AppText'
import { PressableSurface } from '@/src/components/ui/PressableSurface'
import { colors, layout, spacing } from '@/src/theme/colors'

interface TextActionRowProps {
  label: string
  icon?: ReactNode
  onPress: () => void
  highlighted?: boolean
  disabled?: boolean
}

export function TextActionRow({
  label,
  icon,
  onPress,
  highlighted = false,
  disabled = false,
}: TextActionRowProps) {
  return (
    <PressableSurface
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={styles.pressable}
    >
      <View
        style={[
          styles.row,
          highlighted && styles.highlighted,
          disabled && styles.disabled,
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <AppText variant="bodySemiBold" style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
        <CaretRight size={17} color={colors.greenText} weight="bold" />
      </View>
    </PressableSurface>
  )
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTapTarget,
    paddingVertical: spacing.xs,
  },
  highlighted: {
    backgroundColor: colors.greenSoft,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  icon: {
    width: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    minWidth: 0,
    color: colors.greenText,
  },
})
