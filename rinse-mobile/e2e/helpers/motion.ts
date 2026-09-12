import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

/** Mirrors `src/theme/motion.ts` — keep in sync for timing assertions. */
export const motionTiming = {
  sheetMs: 280,
  fadeMs: 280,
  fastMs: 150,
  listStaggerMs: 280,
  staggerStepMs: 50,
  listStaggerCap: 12,
  pressMs: 120,
} as const

export function motionDeadlineMs(kind: 'sheet' | 'fab' | 'list'): number {
  switch (kind) {
    case 'sheet':
      return motionTiming.sheetMs * 2 + 200
    case 'fab':
      return motionTiming.fadeMs * 2 + 200
    case 'list':
      return motionTiming.listStaggerMs + motionTiming.listStaggerCap * motionTiming.staggerStepMs + 300
  }
}

/** Poll until `probe` returns true or timeout. */
export async function pollUntil(
  probe: () => Promise<boolean>,
  { intervalMs = 50, timeoutMs = 2_000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<boolean> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await probe()) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return false
}

/**
 * Optional frame strip for manual motion review.
 * Set MOTION_CAPTURE=1 to write PNGs under screenshots/motion-samples/.
 */
export async function captureMotionFrames(
  page: Page,
  flow: string,
  delaysMs: number[],
): Promise<void> {
  if (!process.env.MOTION_CAPTURE) return

  const dir = join(process.cwd(), 'screenshots/motion-samples', flow)
  await mkdir(dir, { recursive: true })

  let elapsed = 0
  for (const delay of delaysMs) {
    const step = delay - elapsed
    if (step > 0) await page.waitForTimeout(step)
    elapsed = delay
    await page.screenshot({ path: join(dir, `${String(delay).padStart(4, '0')}ms.png`) })
  }
}
