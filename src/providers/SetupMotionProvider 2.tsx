'use client'

import { MotionConfig } from 'motion/react'
import { springStandard } from '@/lib/motion'

export default function SetupMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={springStandard}>
      {children}
    </MotionConfig>
  )
}
