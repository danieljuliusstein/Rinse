import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native'
import { PressableSurface } from '@/src/components/ui/PressableSurface'
import { colors, radii, shadows, spacing, webPressableReset } from '@/src/theme/colors'

interface CardProps {
  children: ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <PressableSurface onPress={onPress} style={[styles.card, webPressableReset, style]}>
        {children}
      </PressableSurface>
    )
  }

  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
})
