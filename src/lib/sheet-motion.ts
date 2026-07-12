import {
  runOnJS,
  type SharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { motion } from '@/src/theme/motion'

/** Open: panel springs to rest; scrim fades in. Call from JS. */
export function openSheetSpring(
  translateY: SharedValue<number>,
  scrimOpacity: SharedValue<number>,
): void {
  scrimOpacity.value = withTiming(1, { duration: motion.fadeMs })
  translateY.value = withSpring(0, motion.sheet)
}

/**
 * Close: panel springs off-screen; scrim fades out.
 * Invokes `onFinished` on the JS thread when the panel spring completes.
 */
export function closeSheetSpring(
  translateY: SharedValue<number>,
  scrimOpacity: SharedValue<number>,
  offscreen: number,
  onFinished?: () => void,
): void {
  scrimOpacity.value = withTiming(0, { duration: motion.fastMs })
  translateY.value = withSpring(offscreen, motion.sheet, (finished) => {
    'worklet'
    if (finished && onFinished) {
      runOnJS(onFinished)()
    }
  })
}

/** Snap panel back to rest after a cancelled drag. */
export function springSheetBack(
  translateY: SharedValue<number>,
  scrimOpacity: SharedValue<number>,
): void {
  translateY.value = withSpring(0, motion.sheet)
  scrimOpacity.value = withTiming(1, { duration: motion.fastMs })
}

/** Scrim opacity while dragging. */
export function scrimOpacityForDrag(translateY: number, offscreen: number): number {
  if (offscreen <= 0) return 1
  const t = Math.min(1, Math.max(0, translateY / offscreen))
  return 1 - t * 0.85
}

export function clampSheetDrag(translationY: number): number {
  return Math.max(0, translationY)
}
