import { abortRinseTour, isRinseTourActive, startRinseTour } from './rinse-tour/controller'
import { buildRinseTourSteps, RINSE_TOUR_HOME_TARGETS } from './rinse-tour/steps'
import { getPocketBase } from './pocketbase'
import { navigateForTour } from './tour-nav'
import { tourSelector, type ProductTourTarget } from './tour-targets'

export { PRODUCT_TOUR_TARGETS, coachSelector, tourSelector, type CoachTarget, type ProductTourTarget } from './tour-targets'

/** Home targets required before the tour starts. */
export const PRODUCT_TOUR_REQUIRED_TARGETS = RINSE_TOUR_HOME_TARGETS

export const TOUR_COMPLETED_KEY = 'detailing_product_tour_completed'
export const TOUR_PENDING_KEY = 'detailing_product_tour_pending'
export const TOUR_REPLAY_KEY = 'detailing_product_tour_replay'
export const TOUR_WELCOME_DISMISSED_KEY = 'detailing_product_tour_welcome_dismissed'
export const TOUR_REPLAY_EVENT = 'detailing-product-tour-replay'
export const TOUR_FINISHED_EVENT = 'detailing-product-tour-finished'

function getTourUserId(): string | null {
  if (typeof window === 'undefined') return null
  const id = getPocketBase()?.authStore.record?.id
  return id ? String(id) : null
}

function scopedKey(base: string): string {
  const userId = getTourUserId()
  return userId ? `${base}_${userId}` : base
}

function canUseTourStorage(): boolean {
  return typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined'
}

export function isTourCompleted(): boolean {
  if (!canUseTourStorage()) return true
  return localStorage.getItem(scopedKey(TOUR_COMPLETED_KEY)) === '1'
}

export function markTourPending(): void {
  if (!canUseTourStorage()) return
  const pendingKey = scopedKey(TOUR_PENDING_KEY)
  const completedKey = scopedKey(TOUR_COMPLETED_KEY)
  localStorage.removeItem(completedKey)
  sessionStorage.removeItem(scopedKey(TOUR_WELCOME_DISMISSED_KEY))
  localStorage.setItem(pendingKey, '1')
}

export function markTourCompleted(): void {
  if (!canUseTourStorage()) return
  localStorage.setItem(scopedKey(TOUR_COMPLETED_KEY), '1')
  localStorage.removeItem(scopedKey(TOUR_PENDING_KEY))
  sessionStorage.removeItem(scopedKey(TOUR_REPLAY_KEY))
}

export function requestTourReplay(): void {
  if (!canUseTourStorage()) return
  localStorage.removeItem(scopedKey(TOUR_COMPLETED_KEY))
  sessionStorage.setItem(scopedKey(TOUR_REPLAY_KEY), '1')
  sessionStorage.setItem(scopedKey(TOUR_PENDING_KEY), '1')
}

export function isTourReplaySession(): boolean {
  if (!canUseTourStorage()) return false
  return sessionStorage.getItem(scopedKey(TOUR_REPLAY_KEY)) === '1'
}

export function dismissTourWelcome(): void {
  if (!canUseTourStorage()) return
  sessionStorage.setItem(scopedKey(TOUR_WELCOME_DISMISSED_KEY), '1')
}

export function shouldAutoStartTour(): boolean {
  if (!canUseTourStorage()) return false
  if (isTourCompleted()) return false
  if (sessionStorage.getItem(scopedKey(TOUR_REPLAY_KEY)) === '1') return true
  return localStorage.getItem(scopedKey(TOUR_PENDING_KEY)) === '1'
}

export function shouldShowTourWelcome(): boolean {
  if (!shouldAutoStartTour()) return false
  if (isTourReplaySession()) return false
  return sessionStorage.getItem(scopedKey(TOUR_WELCOME_DISMISSED_KEY)) !== '1'
}

export async function waitForTourTargets(
  targets: readonly ProductTourTarget[] = PRODUCT_TOUR_REQUIRED_TARGETS,
  maxMs = 8000,
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const ready = targets.every((target) => document.querySelector(tourSelector(target)))
    if (ready) return true
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  return targets.every((target) => document.querySelector(tourSelector(target)))
}

function scrollHomeToTop(): void {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

export function isTourActive(): boolean {
  return isRinseTourActive()
}

export function handleTourFinished(): void {
  markTourCompleted()
  dismissTourWelcome()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TOUR_FINISHED_EVENT))
  }
  scrollHomeToTop()
  void navigateForTour('/')
}

export async function startProductTour(): Promise<boolean> {
  if (typeof document === 'undefined') return false
  if (isTourCompleted()) return false

  const ready = await waitForTourTargets(PRODUCT_TOUR_REQUIRED_TARGETS)
  if (!ready) return false

  scrollHomeToTop()
  startRinseTour(buildRinseTourSteps())
  return true
}

export function destroyProductTour(): void {
  abortRinseTour()
}

export function skipProductTour(): void {
  dismissTourWelcome()
  markTourCompleted()
  destroyProductTour()
}
