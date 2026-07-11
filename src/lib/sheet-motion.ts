import {
  runOnJS,
  type SharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { motion } from '@/src/theme/motion'

/** Open: panel springs to rest; scrim fades in on a short timing curve. */
export function openSheetSpring(
  translateY: SharedValue<number>,
  scrimOpacity: SharedValue<number>,
): void {
  'worklet'
  scrimOpacity.value = withTiming(1, { duration: motion.fadeMs })
  translateY.value = withSpring(0, motion.sheet)
}

/**
 * Close: panel springs off-screen; scrim fades out faster.
 * Invokes `onFinished` on the JS thread when the panel spring completes.
 */
export function closeSheetSpring(
  translateY: SharedValue<number>,
  scrimOpacity: SharedValue<number>,
  offscreen: number,
  onFinished?: () => void,
): void {
  'worklet'
  scrimOpacity.value = withTiming(0, { duration: motion.fastMs })
  translateY.value = withSpring(offscreen, motion.sheet, (finished) => {
    'worklet'
    if (finished && onFinished) {
      runOnJS(onFinished)()
    }
  })
}

/** Snap panel back to resting position after a cancelled drag. */
export function springSheetBack(
  translateY: SharedValue<number>,
  scrimOpacity: SharedValue<number>,
): void {
  'worklet'
  translateY.value = withSpring(0, motion.sheet)
  scrimOpacity.value = withTiming(1, { duration: motion.fastMs })
}

/** Scrim opacity while dragging — maps translateY 0 → offscreen to opacity 1 → ~0.15. */
export function scrimOpacityForDrag(translateY: number, offscreen: number): number {
  'worklet'
  if (offscreen <= 0) return 1
  const t = Math.min(1, Math.max(0, translateY / offscreen))
  return 1 - t * 0.85
}

export function shouldDismissSheet(translationY: number, velocityY: number): boolean {
  'worklet'
  return translationY > motion.sheetDismissDistance || velocityY > motion.sheetDismissVelocity
}

/** Downward-only rubber band: ignore upward drag past rest. */
export function clampSheetDrag(translationY: number): number {
  'worklet'
  return Math.max(0, translationY)
}
