import { checkPocketBaseHealth } from './pocketbase'

/** Dev-only: simulate offline for sync QA without airplane mode (EXPO_PUBLIC_SYNC_QA_DEV=1). */
let forceOffline = false

export function setForceOffline(enabled: boolean): void {
  forceOffline = enabled
}

export function isForceOffline(): boolean {
  return forceOffline
}

export async function isOnline(): Promise<boolean> {
  if (forceOffline) return false
  return checkPocketBaseHealth(5000)
}
