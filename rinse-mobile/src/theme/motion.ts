export const motion = {
  /** Lists / pills — slight settle is OK */
  spring: { damping: 20, stiffness: 300 },
  /** Form / action sheets — critically damped, no bounce */
  sheet: { damping: 36, stiffness: 380, mass: 0.9, overshootClamping: true },
  /** FAB + tab chrome — less overshoot */
  snappy: { damping: 32, stiffness: 420, mass: 0.8 },
  pressMs: 100,
  pressScale: 0.98,
  /**
   * Sheet / smoke timing budgets (reduced-motion snaps + e2e windows).
   * Live sheet panels use `sheet`, not these durations.
   */
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
  /** Drag-to-dismiss: distance (px) past which the sheet closes */
  sheetDismissDistance: 120,
  /** Drag-to-dismiss: downward velocity (px/s) that forces close */
  sheetDismissVelocity: 900,
} as const
