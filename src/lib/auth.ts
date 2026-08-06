import type { RecordModel } from 'pocketbase'
import { ClientResponseError } from 'pocketbase'
import { getPocketBase } from './pocketbase'

const TOKEN_KEY = 'rinse_desk_pb_token'
const PROFILE_KEY = 'rinse_desk_pb_profile'

export function getCurrentUser(): RecordModel | null {
  const pb = getPocketBase()
  return pb.authStore.isValid ? pb.authStore.record : null
}

export function getDisplayName(): string {
  const user = getCurrentUser() as { name?: string; email?: string } | null
  if (!user) return 'Operator'
  if (typeof user.name === 'string' && user.name.trim()) return user.name.trim()
  if (typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0] ?? 'Operator'
  }
  return 'Operator'
}

export function getInitials(name = getDisplayName()): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase() || 'OP'
}

function persistAuth(token: string, record: RecordModel) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(record))
  getPocketBase().authStore.save(token, record)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PROFILE_KEY)
  getPocketBase().authStore.clear()
}

export function restoreAuth(): boolean {
  const token = localStorage.getItem(TOKEN_KEY)
  const profile = localStorage.getItem(PROFILE_KEY)
  if (!token || !profile) return false
  try {
    const record = JSON.parse(profile) as RecordModel
    getPocketBase().authStore.save(token, record)
    if (!getPocketBase().authStore.isValid) {
      clearAuth()
      return false
    }
    return true
  } catch {
    clearAuth()
    return false
  }
}

export async function refreshAuth(): Promise<boolean> {
  const pb = getPocketBase()
  if (!pb.authStore.isValid) return false
  try {
    await pb.collection('users').authRefresh()
    if (pb.authStore.token && pb.authStore.record) {
      persistAuth(pb.authStore.token, pb.authStore.record)
    }
    return true
  } catch {
    if (!pb.authStore.isValid) clearAuth()
    return pb.authStore.isValid
  }
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const pb = getPocketBase()
  try {
    await pb.collection('users').authWithPassword(email.trim(), password)
    if (!pb.authStore.token || !pb.authStore.record) {
      throw new Error('Sign-in succeeded but no session was returned.')
    }
    persistAuth(pb.authStore.token, pb.authStore.record)
    const org = (pb.authStore.record as { organization_id?: unknown }).organization_id
    const hasOrg =
      (typeof org === 'string' && org.length > 0) ||
      (org != null && typeof org === 'object' && typeof (org as { id?: unknown }).id === 'string')
    if (!hasOrg) {
      clearAuth()
      throw new Error('This account has no organization. Finish mobile onboarding, then try again.')
    }
  } catch (err) {
    if (err instanceof ClientResponseError) {
      if (err.status === 400 || err.status === 403) {
        throw new Error('Invalid email or password.')
      }
      if (err.status === 0 || err.isAbort) {
        throw new Error('Could not reach PocketBase. Check your connection and try again.')
      }
    }
    if (err instanceof Error && err.message.includes('organization')) throw err
    const msg = err instanceof Error ? err.message : ''
    if (!msg || msg === 'Something went wrong while processing your request.') {
      throw new Error('Could not sign in. Check email/password and try again.')
    }
    throw new Error(msg)
  }
}

export async function signOut(): Promise<void> {
  clearAuth()
}
