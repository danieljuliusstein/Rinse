import { getPocketBase, isPocketBaseConfigured } from './pocketbase'
import { withTimeout } from './timeout'

import { AUTH_OAUTH_UNAVAILABLE, AUTH_PB_NOT_CONFIGURED, formatAuthApiError } from './auth-messages'

const AUTH_FLAG_KEY = 'pb_auth_active'

/** @deprecated Use AUTH_OAUTH_UNAVAILABLE or AUTH_PB_NOT_CONFIGURED */
export const AUTH_CLOUD_UNAVAILABLE = AUTH_OAUTH_UNAVAILABLE

export { AUTH_OAUTH_UNAVAILABLE, AUTH_PB_NOT_CONFIGURED, formatAuthApiError }

export function isPocketBaseAuthenticated(): boolean {
  const pb = getPocketBase()
  if (!pb) return false
  return pb.authStore.isValid
}

/** Validate or refresh the current user session (per-tenant login). */
export async function ensurePocketBaseAuth(): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false

  const pb = getPocketBase()
  if (!pb) return false

  if (pb.authStore.isValid) {
    try {
      await withTimeout(pb.collection('users').authRefresh(), 8000, 'PocketBase auth refresh')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(AUTH_FLAG_KEY, '1')
      }
      return true
    } catch {
      pb.authStore.clear()
    }
  }

  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_FLAG_KEY)
  }
  return false
}

export async function loginWithPassword(email: string, password: string): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false
  const pb = getPocketBase()
  if (!pb) return false

  try {
    await withTimeout(
      pb.collection('users').authWithPassword(email.trim(), password),
      8000,
      'PocketBase login',
    )
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(AUTH_FLAG_KEY, '1')
    }
    return true
  } catch (err) {
    console.warn('[pb-auth] Login failed:', err)
    return false
  }
}

export async function authenticatePocketBase(): Promise<boolean> {
  return ensurePocketBaseAuth()
}

export function getPocketBaseAuthToken(): string | null {
  const pb = getPocketBase()
  if (!pb?.authStore.isValid) return null
  return pb.authStore.token
}

export function getAuthFetchHeaders(): HeadersInit {
  const token = getPocketBaseAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function clearPocketBaseAuth(): void {
  const pb = getPocketBase()
  if (pb) {
    pb.authStore.clear()
  }
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_FLAG_KEY)
  }
}

export function getCurrentUserEmail(): string | null {
  const pb = getPocketBase()
  if (!pb?.authStore.isValid) return null
  const email = pb.authStore.record?.email
  return typeof email === 'string' && email.trim() ? email.trim() : null
}

function pocketBaseErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    message?: string
    data?: { data?: Record<string, { message?: string }> }
  }
  const fields = e.data?.data
  if (fields) {
    for (const key of ['oldPassword', 'password', 'passwordConfirm', 'email']) {
      const msg = fields[key]?.message
      if (msg) return msg
    }
  }
  return e.message ?? fallback
}

export async function changePassword(input: {
  oldPassword: string
  password: string
  passwordConfirm: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const pb = getPocketBase()
  const userId = pb?.authStore.record?.id
  if (!pb?.authStore.isValid || typeof userId !== 'string') {
    return { ok: false, error: 'Not signed in' }
  }
  try {
    await withTimeout(
      pb.collection('users').update(userId, {
        oldPassword: input.oldPassword,
        password: input.password,
        passwordConfirm: input.passwordConfirm,
      }),
      8000,
      'Password change',
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, error: pocketBaseErrorMessage(err, 'Could not update password') }
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pb = getPocketBase()
  if (!pb) return { ok: false, error: AUTH_PB_NOT_CONFIGURED }
  const trimmed = email.trim()
  if (!trimmed) return { ok: false, error: 'Enter your email address' }
  try {
    await withTimeout(
      pb.collection('users').requestPasswordReset(trimmed),
      8000,
      'Password reset request',
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, error: pocketBaseErrorMessage(err, 'Could not send reset email') }
  }
}

export async function confirmPasswordReset(input: {
  token: string
  password: string
  passwordConfirm: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const pb = getPocketBase()
  if (!pb) return { ok: false, error: AUTH_PB_NOT_CONFIGURED }
  if (!input.token.trim()) return { ok: false, error: 'Reset link is invalid or expired' }
  try {
    await withTimeout(
      pb.collection('users').confirmPasswordReset(
        input.token.trim(),
        input.password,
        input.passwordConfirm,
      ),
      8000,
      'Password reset',
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, error: pocketBaseErrorMessage(err, 'Could not reset password') }
  }
}
