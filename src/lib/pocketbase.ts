import { Platform } from 'react-native'
import Constants from 'expo-constants'
import PocketBase from 'pocketbase'

let pb: PocketBase | null = null

export function getPbUrl(): string {
  return (
    process.env.EXPO_PUBLIC_PB_URL ??
    (Constants.expoConfig?.extra?.pbUrl as string | undefined) ??
    ''
  )
}

export function getAppApiUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && __DEV__) {
    // Same-origin proxy in metro dev server — avoids CORS to production API.
    return `${window.location.origin}/api-proxy`
  }
  return (
    process.env.EXPO_PUBLIC_APP_API_URL ??
    (Constants.expoConfig?.extra?.appApiUrl as string | undefined) ??
    ''
  )
}

export function isPocketBaseConfigured(): boolean {
  return !!getPbUrl()
}

export function getPocketBase(): PocketBase {
  const url = getPbUrl()
  if (!url) {
    throw new Error('EXPO_PUBLIC_PB_URL is not configured')
  }
  if (!pb) {
    pb = new PocketBase(url)
    pb.autoCancellation(false)
  }
  return pb
}

export async function checkPocketBaseHealth(timeoutMs = 8000): Promise<boolean> {
  const url = getPbUrl()
  if (!url) return false

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${url}/api/health`, { signal: controller.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}
