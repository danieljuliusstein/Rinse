/** Web preview stub — offline SQLite is native-only. */

import { webDraftStore, webMirrorStore, webQueueStore } from './memory-store.web'

const DB_NAME = 'rinse_offline_v1'

let authProfileJson: string | null = null

export function scopedQueueDbName(orgId: string | undefined): string {
  return orgId ? `${DB_NAME}_${orgId}` : DB_NAME
}

export function getAuthDb(): null {
  return null
}

export function openOrgOfflineDb(_orgId: string): null {
  return null
}

export function getOfflineDb(): null {
  return null
}

export function loadAuthProfile(): string | null {
  return authProfileJson
}

export function saveAuthProfile(recordJson: string): void {
  authProfileJson = recordJson
}

export function clearAuthProfile(): void {
  authProfileJson = null
}

export function resetOfflineDb(_orgId?: string): void {
  authProfileJson = null
  webMirrorStore.clear()
  webQueueStore.length = 0
  webDraftStore.clear()
}

