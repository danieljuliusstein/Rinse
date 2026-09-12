import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pathMatches, waitForElement, waitForLayoutSettle, waitForRouteReady } from './tour-nav'

describe('tour-nav', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      innerWidth: 390,
      innerHeight: 844,
      location: { pathname: '/', assign: vi.fn() },
    })
    vi.stubGlobal('document', {
      querySelector: vi.fn(() => null),
    })
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('matches home and nested routes', () => {
    expect(pathMatches('/', '/')).toBe(true)
    expect(pathMatches('/jobs', '/jobs')).toBe(true)
    expect(pathMatches('/jobs/123', '/jobs')).toBe(true)
    expect(pathMatches('/clients', '/jobs')).toBe(false)
  })

  it('waits for layout settle with two animation frames', async () => {
    let frames = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames += 1
      cb(frames)
      return frames
    })
    await waitForLayoutSettle()
    expect(frames).toBeGreaterThanOrEqual(2)
  })

  it('waits for a visible element', async () => {
    const el = {
      getBoundingClientRect: () => ({ width: 120, height: 40, top: 10, left: 10 }),
    }
    vi.mocked(document.querySelector).mockReturnValue(el as Element)
    await expect(waitForElement('[data-coach="jobs-search"]')).resolves.toBe(true)
  })

  it('waits for route and selector together', async () => {
    window.location.pathname = '/jobs'
    const el = {
      getBoundingClientRect: () => ({ width: 200, height: 48, top: 120, left: 16 }),
    }
    vi.mocked(document.querySelector).mockReturnValue(el as Element)
    await expect(waitForRouteReady('/jobs', '[data-coach="jobs-search"]')).resolves.toBe(true)
  })
})
