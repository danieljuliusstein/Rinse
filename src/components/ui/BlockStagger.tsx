import type { ReactNode } from 'react'
import { useMemo } from 'react'
import Animated from 'react-native-reanimated'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { blockStaggerEntering } from '@/src/lib/motion-presets'

interface BlockStaggerProps {
  index: number
  children: ReactNode
  style?: object
}

export function BlockStagger({ index, children, style }: BlockStaggerProps) {
  const reduceMotion = useReduceMotion()
  const entering = useMemo(() => blockStaggerEntering(index, reduceMotion), [index, reduceMotion])

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  )
}
