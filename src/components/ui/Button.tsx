import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { lightHaptic } from '@/src/lib/haptics'
import { colors, layout, radii, webPressableReset } from '@/src/theme/colors'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  variant?: ButtonVariant
  style?: StyleProp<ViewStyle>
}

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        if (!isDisabled && (variant === 'primary' || variant === 'danger')) lightHaptic()
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        webPressableReset,
        isDisabled && styles.disabled,
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}
      children={
        <View style={styles.inner}>
          {loading ? (
            <ActivityIndicator
              color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.textPrimary}
            />
          ) : (
            <AppText
              variant="bodySemiBold"
              style={[
                variant === 'primary' || variant === 'danger' ? styles.labelOn : styles.label,
                variant === 'ghost' ? styles.labelGhost : null,
              ]}
            >
              {label}
            </AppText>
          )}
        </View>
      }
    />
  )
}

export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="secondary" />
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minTapTarget,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.green,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.textPrimary,
  },
  labelOn: {
    color: '#ffffff',
  },
  labelGhost: {
    color: colors.textSecondary,
  },
})
