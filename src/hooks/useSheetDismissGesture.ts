import { useMemo, useRef } from 'react'
import { PanResponder, type GestureResponderHandlers } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import {
  clampSheetDrag,
  closeSheetSpring,
  scrimOpacityForDrag,
  springSheetBack,
} from '@/src/lib/sheet-motion'
import { lightHaptic } from '@/src/lib/haptics'
import { motion } from '@/src/theme/motion'

/**
 * Pan on handle/header only — downward drag dismisses past distance/velocity
 * thresholds; otherwise springs back. Disabled when `enabled` is false (e.g. reduced motion).
 *
 * Uses RN PanResponder (not RNGH) so sheet dismiss works without a native rebuild
 * when GestureHandlerRootView's Fabric `install()` is unavailable.
 */
export function useSheetDismissPanHandlers(
  translateY: SharedValue<number>,
  scrimOpacity: SharedValue<number>,
  offscreen: number,
  onDismiss: () => void,
  enabled: boolean,
): GestureResponderHandlers {
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  return useMemo(() => {
    if (!enabled) {
      return {}
    }

    const finish = () => {
      lightHaptic()
      onDismissRef.current()
    }

    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onMoveShouldSetPanResponderCapture: (_evt, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_evt, gesture) => {
        const y = clampSheetDrag(gesture.dy)
        translateY.value = y
        scrimOpacity.value = scrimOpacityForDrag(y, offscreen)
      },
      onPanResponderRelease: (_evt, gesture) => {
        const flick = gesture.vy > 0.85 || gesture.vy * 1000 > motion.sheetDismissVelocity
        if (gesture.dy > motion.sheetDismissDistance || flick) {
          closeSheetSpring(translateY, scrimOpacity, offscreen, finish)
        } else {
          springSheetBack(translateY, scrimOpacity)
        }
      },
      onPanResponderTerminate: () => {
        springSheetBack(translateY, scrimOpacity)
      },
    })

    return responder.panHandlers
  }, [enabled, offscreen, scrimOpacity, translateY])
}
