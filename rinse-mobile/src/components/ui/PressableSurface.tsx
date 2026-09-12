import type { ReactNode } from 'react'
import { Platform, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { lightHaptic } from '@/src/lib/haptics'
import { colors } from '@/src/theme/colors'
import { webPressableReset } from '@/src/theme/tokens'
import { motion } from '@/src/theme/motion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface PressableSurfaceProps extends Omit<PressableProps, 'style'> {
  children: ReactNode
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>)
  /** Use when row contains nested taps (avoids button-in-button on web). */
  nestedInteractions?: boolean
}

/** D3 press-depth — scale 0.98 + active surface tint. */
export function PressableSurface({
  children,
  style,
  disabled,
  nestedInteractions,
  onPressIn,
  onPressOut,
  onPress,
  onLongPress,
  ...rest
}: PressableSurfaceProps) {
  const reduceMotion = useReduceMotion()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const staticStyle = (pressed: boolean): StyleProp<ViewStyle> => {
    const base = typeof style === 'function' ? style({ pressed }) : style
    return [
      webPressableReset,
      base,
      pressed && !disabled ? { backgroundColor: colors.surfaceActive } : null,
    ]
  }

  const animatedRowStyle = (pressed: boolean) => [staticStyle(pressed), animatedStyle]

  // Use `children={...}` (not JSX body) so Fabric never sees whitespace text nodes.
  if (nestedInteractions && Platform.OS === 'web') {
    return (
      <View
        {...rest}
        style={staticStyle(false)}
        // @ts-expect-error RN Web forwards onClick to the underlying div.
        onClick={(event: { stopPropagation: () => void }) => {
          if (disabled) return
          event.stopPropagation()
          onPress?.(event as never)
        }}
        children={children}
      />
    )
  }

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={nestedInteractions && Platform.OS === 'web' ? 'none' : 'button'}
      style={(state: { pressed: boolean }) => animatedRowStyle(state.pressed)}
      onPressIn={(event) => {
        if (!disabled && !reduceMotion) {
          scale.value = withTiming(motion.pressScale, { duration: motion.pressMs })
        }
        if (!disabled) lightHaptic()
        onPressIn?.(event)
      }}
      onPressOut={(event) => {
        if (!reduceMotion) {
          scale.value = withSpring(1, motion.snappy)
        }
        onPressOut?.(event)
      }}
      children={children}
    />
  )
}
