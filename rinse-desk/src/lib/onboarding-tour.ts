/** localStorage key — set when the user finishes or skips the desk product tour. */
export const DESK_TOUR_DONE_KEY = 'desk.onboardingTourDone'

export function readTourDone(): boolean {
  try {
    return localStorage.getItem(DESK_TOUR_DONE_KEY) === '1'
  } catch {
    return false
  }
}

export function markTourDone(): void {
  try {
    localStorage.setItem(DESK_TOUR_DONE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearTourDone(): void {
  try {
    localStorage.removeItem(DESK_TOUR_DONE_KEY)
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
