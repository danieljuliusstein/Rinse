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

  it('pins card to viewport top for bottom targets only', () => {
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

  it('falls back to auto placement when viewport-top would cover a top target', () => {
    vi.stubGlobal('window', { innerWidth: 390, innerHeight: 844 })
    const spotlight: RinseTourRect = {
      top: 120,
      left: 16,
      width: 358,
      height: 48,
    }
    const layout = layoutTourCard(spotlight, { cardMode: 'viewport-top', cardHeight: 200 })
    expect(layout.cardPlacement).toBe('bottom')
    expect(layout.cardTop).toBeGreaterThan(spotlight.top + spotlight.height)
    vi.unstubAllGlobals()
  })

  it('centers modal steps without a spotlight', () => {
    const layout = layoutTourCard(null, {})
    expect(layout.spotlight).toBeNull()
    expect(layout.cardPlacement).toBe('center')
  })
})

describe('measureTarget', () => {
  it('builds a circular cutout when spotlight is square with full radius', () => {
    vi.stubGlobal('document', {
      querySelector: () => ({
        getBoundingClientRect: () => ({ top: 100, left: 20, width: 52, height: 52 }),
      }),
    })
    const measured = measureTarget('[data-tour="fab"]', { shape: 'circle', pad: 14 })
    expect(measured?.width).toBe(80)
    expect(measured?.height).toBe(80)
    expect(measured?.radius).toBe(40)
    vi.unstubAllGlobals()
  })

  it('caps spotlight radius for small rect targets', () => {
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
