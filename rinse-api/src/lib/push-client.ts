import { getCurrentOrganizationId } from './tenant'
import { getAuthFetchHeaders } from './pb-auth'

const PUSH_ENABLED_KEY = 'push_notifications_enabled'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

export function isPushEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(PUSH_ENABLED_KEY) === '1'
}

export function setPushEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PUSH_ENABLED_KEY, enabled ? '1' : '0')
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { ok: false, error: 'Push notifications not supported on this device' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: 'Notification permission denied' }
  }

  const keyRes = await fetch('/api/push/vapid-key')
  if (!keyRes.ok) {
    const data = await keyRes.json().catch(() => ({}))
    return { ok: false, error: data.error ?? 'Push not configured on server' }
  }

  const { publicKey } = await keyRes.json()
  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  })

  const organizationId = getCurrentOrganizationId()
  if (!organizationId) {
    return { ok: false, error: 'Not signed in' }
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthFetchHeaders() },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data.error ?? 'Failed to save subscription' }
  }

  setPushEnabled(true)
  return { ok: true }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthFetchHeaders() },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
    await subscription.unsubscribe()
  }

  setPushEnabled(false)
}
