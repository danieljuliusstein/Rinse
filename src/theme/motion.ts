export const motion = {
  /** Sheets / list enter — slight settle is OK */
  spring: { damping: 20, stiffness: 300 },
  /** FAB + tab chrome — less overshoot */
  snappy: { damping: 32, stiffness: 420, mass: 0.8 },
  pressMs: 100,
  pressScale: 0.98,
  /** Form / action sheets — timed slide, no spring bounce */
  sheetMs: 280,
  fadeMs: 280,
  fastMs: 150,
  listStaggerMs: 280,
  staggerStepMs: 50,
  listStaggerCap: 12,
  emptyEnterMs: 400,
  quickActionRowOffset: 8,
  attentionPulseMs: 2000,
  tourRingPulseMs: 1800,
} as const
