import { describe, expect, it, vi } from 'vitest'
import { cutoutClipPath, layoutTourCard, measureTarget } from './position'
import type { RinseTourRect } from './types'

describe('layoutTourCard', () => {
  it('places card above targets near the bottom dock', () => {
    const spotlight: RinseTourRect = {
      top: 700,
      left: 20,
      width: 350,
      height: 56,
    }
    const layout = layoutTourCard(spotlight, { placement: 'auto' })
    expect(layout.cardPlacement).toBe('top')
    expect(layout.cardTop).toBeLessThan(spotlight.top)
  })

  it('pins card to viewport top for bottom sheets', () => {
    const spotlight: RinseTourRect = {
      top: 520,
      left: 0,
      width: 390,
      height: 280,
    }
    const layout = layoutTourCard(spotlight, { cardMode: 'viewport-top', cardHeight: 200 })
    expect(layout.cardTop).toBeLessThanOrEqual(16)
    expect(layout.cardTop + 200).toBeLessThan(spotlight.top)
  })

  it('centers modal steps without a spotlight', () => {
    const layout = layoutTourCard(null, {})
    expect(layout.spotlight).toBeNull()
    expect(layout.cardPlacement).toBe('center')
  })
})

describe('measureTarget', () => {
  it('caps spotlight radius for small targets', () => {
    vi.stubGlobal('document', {
      querySelector: () => ({
        getBoundingClientRect: () => ({ top: 100, left: 20, width: 40, height: 40 }),
      }),
    })
    const measured = measureTarget('[data-tour="fab"]', { radius: 999, pad: 0 })
    expect(measured?.radius).toBe(20)
    vi.unstubAllGlobals()
  })
})

describe('cutoutClipPath', () => {
  it('builds a clip path for rounded rects', () => {
    vi.stubGlobal('window', { innerWidth: 390, innerHeight: 844 })
    const rect: RinseTourRect = { top: 700, left: 160, width: 70, height: 70 }
    expect(cutoutClipPath(rect, 35)).toContain('polygon(evenodd')
    vi.unstubAllGlobals()
  })
})
