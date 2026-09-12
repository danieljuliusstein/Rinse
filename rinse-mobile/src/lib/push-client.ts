import { Platform } from 'react-native'
import { appApiFetch, appApiJson } from './app-api'
import { getSecureItem, setSecureItem } from './secure-storage'

const PUSH_ENABLED_KEY = 'rinse_push_enabled'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function isPushSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function isPushEnabled(): Promise<boolean> {
  return (await getSecureItem(PUSH_ENABLED_KEY)) === '1'
}

async function setPushEnabled(enabled: boolean): Promise<void> {
  await setSecureItem(PUSH_ENABLED_KEY, enabled ? '1' : '0')
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { ok: false, error: 'Push notifications not supported on this device' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: 'Notification permission denied' }
  }

  const { publicKey } = await appApiJson<{ publicKey: string }>('/api/push/vapid-key')
  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  })

  const res = await appApiFetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: false, error: data.error ?? 'Failed to save subscription' }
  }

  await setPushEnabled(true)
  return { ok: true }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) await subscription.unsubscribe()
  await setPushEnabled(false)
}
