import { useMemo, useRef } from 'react'
import { PanResponder, Platform, type GestureResponderHandlers } from 'react-native'
import { cancelAnimation, type SharedValue } from 'react-native-reanimated'
import {
  clampSheetDrag,
  closeSheetSpring,
  scrimOpacityForDrag,
  springSheetBack,
} from '@/src/lib/sheet-motion'
import { lightHaptic } from '@/src/lib/haptics'
import { motion } from '@/src/theme/motion'

/**
 * Pan on the sheet handle only (attach handlers to a dedicated hit target —
 * not the title row / close button).
 *
 * Uses RN PanResponder + Reanimated shared values on the JS thread.
 * RNGH GestureDetector requires a native rebuild; this stays safe on the
 * current expo-dev-client until that lands.
 */
export function useSheetDismissGesture(
  translateY: SharedValue<number>,
  scrimOpacity: SharedValue<number>,
  offscreen: number,
  onDismiss: () => void,
  enabled: boolean,
): GestureResponderHandlers {
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  const active = enabled && Platform.OS !== 'web'

  return useMemo(() => {
    if (!active) return {}

    const finish = () => {
      lightHaptic()
      onDismissRef.current()
    }

    const responder = PanResponder.create({
      // Claim the handle immediately so tab RefreshControls never win the gesture.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2,
      // Keep the dismiss pan — yielding let underlying pull-to-refresh steal the drag.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        cancelAnimation(translateY)
        cancelAnimation(scrimOpacity)
      },
      onPanResponderMove: (_evt, gesture) => {
        const y = clampSheetDrag(gesture.dy)
        translateY.value = y
        scrimOpacity.value = scrimOpacityForDrag(y, offscreen)
      },
      onPanResponderRelease: (_evt, gesture) => {
        const velocityY = gesture.vy * 1000
        const flick = velocityY > motion.sheetDismissVelocity
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
  }, [active, offscreen, scrimOpacity, translateY])
}

/** @deprecated Prefer `useSheetDismissGesture`. */
export const useSheetDismissPanHandlers = useSheetDismissGesture
