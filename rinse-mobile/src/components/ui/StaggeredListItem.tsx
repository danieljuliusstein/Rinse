import type { ReactNode } from 'react'
import { useMemo } from 'react'
import Animated from 'react-native-reanimated'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { listStaggerEntering } from '@/src/lib/motion-presets'

interface StaggeredListItemProps {
  index: number
  children: ReactNode
}

/** D3 list-stagger — cap delay after `motion.listStaggerCap` items. */
export function StaggeredListItem({ index, children }: StaggeredListItemProps) {
  const reduceMotion = useReduceMotion()
  const entering = useMemo(() => listStaggerEntering(index, reduceMotion), [index, reduceMotion])

  return <Animated.View entering={entering}>{children}</Animated.View>
}
