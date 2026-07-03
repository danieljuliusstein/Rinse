const DISMISS_KEY = 'rinse_pwa_install_dismissed'
const DISMISS_UNTIL_DAYS = 14

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let listeners: Array<() => void> = []

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function canShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false
  if (isStandalonePwa()) return false
  if (isInstallDismissed()) return false
  return Boolean(deferredPrompt) || isIos()
}

export function isInstallDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const until = Number(raw)
  if (Number.isNaN(until)) return false
  return Date.now() < until
}

export function dismissInstallPrompt(): void {
  if (typeof localStorage === 'undefined') return
  const until = Date.now() + DISMISS_UNTIL_DAYS * 24 * 60 * 60 * 1000
  localStorage.setItem(DISMISS_KEY, String(until))
  notifyInstallListeners()
}

export function clearInstallDismiss(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(DISMISS_KEY)
  notifyInstallListeners()
}

function notifyInstallListeners(): void {
  for (const fn of listeners) fn()
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function bindPwaInstallPrompt(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notifyInstallListeners()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notifyInstallListeners()
  })
}

export async function promptPwaInstall(): Promise<'installed' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable'
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  notifyInstallListeners()
  return outcome === 'accepted' ? 'installed' : 'dismissed'
}

export function hasDeferredInstallPrompt(): boolean {
  return Boolean(deferredPrompt)
}
