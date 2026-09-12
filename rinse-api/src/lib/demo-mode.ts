const STORAGE_KEY = 'rinse_demo_mode_v1'

export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setDemoModeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  if (enabled) localStorage.setItem(STORAGE_KEY, '1')
  else localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('demo-mode-changed'))
}
