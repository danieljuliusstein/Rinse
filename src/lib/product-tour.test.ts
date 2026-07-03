import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOUR_PENDING_KEY,
  TOUR_REPLAY_KEY,
  TOUR_WELCOME_DISMISSED_KEY,
  dismissTourWelcome,
  isTourCompleted,
  isTourReplaySession,
  markTourCompleted,
  markTourPending,
  requestTourReplay,
  shouldAutoStartTour,
  shouldShowTourWelcome,
  skipProductTour,
  tourSelector,
  PRODUCT_TOUR_REQUIRED_TARGETS,
} from './product-tour'

vi.mock('./pocketbase', () => ({
  getPocketBase: () => ({ authStore: { record: { id: 'user_test' } } }),
}))

const SCOPED_PENDING = `${TOUR_PENDING_KEY}_user_test`
const SCOPED_COMPLETED = `detailing_product_tour_completed_user_test`
const SCOPED_REPLAY = `${TOUR_REPLAY_KEY}_user_test`
const SCOPED_WELCOME = `${TOUR_WELCOME_DISMISSED_KEY}_user_test`

function createStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('product-tour storage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('sessionStorage', createStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds stable tour selectors', () => {
    expect(tourSelector('fab')).toBe('[data-tour="fab"]')
    expect(tourSelector('nav-reports')).toBe('[data-tour="nav-reports"]')
  })

  it('lists required home-screen targets', () => {
    expect(PRODUCT_TOUR_REQUIRED_TARGETS).toContain('fab')
    expect(PRODUCT_TOUR_REQUIRED_TARGETS).toHaveLength(1)
  })

  it('auto-starts when pending and not completed', () => {
    markTourPending()
    expect(shouldAutoStartTour()).toBe(true)
    expect(isTourCompleted()).toBe(false)
  })

  it('does not auto-start after completion', () => {
    markTourPending()
    markTourCompleted()
    expect(shouldAutoStartTour()).toBe(false)
    expect(isTourCompleted()).toBe(true)
    expect(localStorage.getItem(SCOPED_PENDING)).toBeNull()
  })

  it('replays when requested in session', () => {
    markTourCompleted()
    requestTourReplay()
    expect(shouldAutoStartTour()).toBe(true)
    expect(isTourReplaySession()).toBe(true)
  })

  it('shows welcome prompt for new pending tours only', () => {
    markTourPending()
    expect(shouldShowTourWelcome()).toBe(true)
    dismissTourWelcome()
    expect(shouldShowTourWelcome()).toBe(false)
    expect(sessionStorage.getItem(SCOPED_WELCOME)).toBe('1')
  })

  it('skips welcome on replay sessions', () => {
    markTourPending()
    requestTourReplay()
    expect(shouldShowTourWelcome()).toBe(false)
  })

  it('skipProductTour dismisses welcome and marks completed', () => {
    markTourPending()
    skipProductTour()
    expect(isTourCompleted()).toBe(true)
    expect(sessionStorage.getItem(SCOPED_WELCOME)).toBe('1')
    expect(sessionStorage.getItem(SCOPED_REPLAY)).toBeNull()
  })
})
