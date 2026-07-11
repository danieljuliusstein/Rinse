import type { ReactNode } from 'react'
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { webInlinePressableReset } from '@/src/theme/colors'

/** Tap target that avoids nested `<button>` on RN Web (use inside ListRow). */
export function InteractiveView({
  children,
  onPress,
  style,
  accessibilityLabel,
  disabled,
}: {
  children: ReactNode
  onPress: () => void
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  disabled?: boolean
}) {
  if (Platform.OS === 'web') {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        style={[webInlinePressableReset, style, disabled ? { opacity: 0.5 } : null]}
        // @ts-expect-error RN Web forwards onClick to the underlying div.
        onClick={(event: { stopPropagation: () => void }) => {
          event.stopPropagation()
          if (!disabled) onPress()
        }}
        children={children}
      />
    )
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      style={style}
      children={<View style={styles.inner}>{children}</View>}
    />
  )
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
