import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { AppText } from '@/src/components/ui/AppText'
import { useSubmitRipple, useSuccessPopScale } from '@/src/hooks/useMotionArchetypes'
import { lightHaptic, successHaptic } from '@/src/lib/haptics'
import { colors, layout, radii, webPressableReset } from '@/src/theme/colors'

interface SheetSubmitButtonProps {
  label: string
  /** Shown when `done` — defaults to "Saved". */
  doneLabel?: string
  ready?: boolean
  done?: boolean
  loading?: boolean
  disabled?: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

export function SheetSubmitButton({
  label,
  doneLabel = 'Saved',
  ready = false,
  done = false,
  loading = false,
  disabled = false,
  onPress,
  style,
}: SheetSubmitButtonProps) {
  const isDisabled = disabled || loading || !ready
  const [rippleTick, setRippleTick] = useState(0)
  const popStyle = useSuccessPopScale(done)
  const rippleStyle = useSubmitRipple(rippleTick)

  useEffect(() => {
    if (done) successHaptic()
  }, [done])

  return (
    <Pressable
      onPress={() => {
        if (!ready || done || loading || disabled) return
        lightHaptic()
        setRippleTick((n) => n + 1)
        onPress()
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[webPressableReset, style]}
    >
      <Animated.View
        style={[
          styles.base,
          ready && !done ? styles.ready : null,
          done ? styles.done : null,
          isDisabled && !done ? styles.disabled : null,
          popStyle,
        ]}
      >
        <Animated.View pointerEvents="none" style={[styles.ripple, rippleStyle]} />
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <AppText
            variant="bodySemiBold"
            style={[styles.label, ready && !done && styles.labelOn, done && styles.labelDone]}
          >
            {done ? doneLabel : label}
          </AppText>
        )}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minTapTarget,
    backgroundColor: colors.surfaceActive,
    overflow: 'hidden',
    width: '100%',
  },
  ripple: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
  },
  ready: {
    backgroundColor: colors.green,
  },
  done: {
    backgroundColor: colors.greenSoft,
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: colors.textMuted,
  },
  labelOn: {
    color: '#ffffff',
  },
  labelDone: {
    color: colors.greenText,
  },
})
