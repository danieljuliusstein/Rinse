export const springStandard = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 } as const
export const springSoft = { type: 'spring', stiffness: 220, damping: 26 } as const
export const springPop = { type: 'spring', stiffness: 400, damping: 18 } as const
export const springCelebration = { type: 'spring', stiffness: 260, damping: 16 } as const

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
} as const

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const
