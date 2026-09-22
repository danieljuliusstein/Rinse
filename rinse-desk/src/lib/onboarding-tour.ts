import { getPocketBase } from './pocketbase'
import { getOrganizationId } from './org'
/** localStorage key — set when the user finishes or skips the desk product tour. */
export const DESK_TOUR_DONE_KEY = 'desk.onboardingTourDone'

function tourKey() { return `${DESK_TOUR_DONE_KEY}:${getOrganizationId() || 'none'}:${getPocketBase().authStore.record?.id || 'none'}` }

export function readTourDone(): boolean {
  try {
    return localStorage.getItem(tourKey()) === '1'
  } catch {
    return false
  }
}

export function markTourDone(): void {
  try {
    localStorage.setItem(tourKey(), '1')
  } catch {
    /* ignore */
  }
}

export function clearTourDone(): void {
  try {
    localStorage.removeItem(tourKey())
  } catch {
    /* ignore */
  }
}

let _tourSessionActive = false

export function isTourSessionActive(): boolean {
  return _tourSessionActive
}

export function setTourSessionActive(active: boolean): void {
  _tourSessionActive = active
}
