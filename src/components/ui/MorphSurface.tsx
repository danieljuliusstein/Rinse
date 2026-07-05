'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface MorphSurfaceProps {
  layoutId: string
  children: ReactNode
  className?: string
  as?: 'div' | 'button'
  onClick?: () => void
  disabled?: boolean
}

/** Shared layoutId anchor for list → detail overlay morph (Wave C). */
export default function MorphSurface({
  layoutId,
  children,
  className,
  as = 'div',
  onClick,
  disabled,
}: MorphSurfaceProps) {
  const reduceMotion = useReducedMotion()

  if (as === 'button') {
    return (
      <motion.button
        type="button"
        layoutId={reduceMotion ? undefined : layoutId}
        className={className}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </motion.button>
    )
  }

  return (
    <motion.div
      layoutId={reduceMotion ? undefined : layoutId}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
