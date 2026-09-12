import { useEffect } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { motion } from '@/src/theme/motion'

/** form-pill-pop — scale 0.88 → 1 spring when pill turns on. */
export function usePillPopScale(selected: boolean) {
  const reduceMotion = useReduceMotion()
  const scale = useSharedValue(1)

  useEffect(() => {
    if (!selected) {
      scale.value = 1
      return
    }
    if (reduceMotion) {
      scale.value = 1
      return
    }
    scale.value = 0.88
    scale.value = withSpring(1, motion.spring)
  }, [reduceMotion, scale, selected])

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
}

/** success-pop — brief spring overshoot (submit done, badge emphasis). */
export function useSuccessPopScale(active: boolean) {
  const reduceMotion = useReduceMotion()
  const scale = useSharedValue(1)

  useEffect(() => {
    if (!active || reduceMotion) return
    scale.value = 1.04
    scale.value = withSpring(1, motion.spring)
  }, [active, reduceMotion, scale])

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
}

/** attention-pulse — pipeline stepper node / tour ring glow. */
export function useAttentionPulse(active: boolean) {
  const reduceMotion = useReduceMotion()
  const pulse = useSharedValue(0)

  useEffect(() => {
    if (!active || reduceMotion) {
      pulse.value = 0
      return
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.attentionPulseMs / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: motion.attentionPulseMs / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [active, pulse, reduceMotion])

  return useAnimatedStyle(() => ({
    shadowOpacity: 0.28 + pulse.value * 0.22,
    shadowRadius: 4 + pulse.value * 6,
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }))
}

/** sheet-ripple — expand fade circle on submit tap. */
export function useSubmitRipple(trigger: number) {
  const reduceMotion = useReduceMotion()
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (trigger <= 0 || reduceMotion) return
    scale.value = 0
    opacity.value = 0.35
    scale.value = withTiming(5, { duration: motion.emptyEnterMs, easing: Easing.out(Easing.cubic) })
    opacity.value = withTiming(0, { duration: motion.emptyEnterMs, easing: Easing.out(Easing.cubic) })
  }, [opacity, reduceMotion, scale, trigger])

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))
}
