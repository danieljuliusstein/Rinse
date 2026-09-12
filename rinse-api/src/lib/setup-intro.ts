const INTRO_SEEN_KEY = 'rinse_setup_intro_seen'

export function hasSeenSetupIntro(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return true
  }
}

export function markSetupIntroSeen(): void {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    /* ignore */
  }
}
