import type { ReactNode } from 'react'
import { useMemo } from 'react'
import Animated from 'react-native-reanimated'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { setupStepEntering } from '@/src/lib/motion-presets'

interface SetupStepInProps {
  stepKey: string
  children: ReactNode
}

/** setup-step-in wrapper for onboarding panels. */
export function SetupStepIn({ stepKey, children }: SetupStepInProps) {
  const reduceMotion = useReduceMotion()
  const entering = useMemo(() => setupStepEntering(reduceMotion), [reduceMotion])

  return (
    <Animated.View key={stepKey} entering={entering}>
      {children}
    </Animated.View>
  )
}
