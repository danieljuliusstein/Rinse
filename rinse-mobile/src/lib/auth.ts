import { Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { ClientResponseError } from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import { getAppApiUrl, getPocketBase } from './pocketbase'
import * as authStore from './auth-store'
import { getQueueCount, clearQueue } from './offline/queue'
import { resetOfflineDb } from './offline/db'
import { getOrganizationId } from './org'
import { clearOrgSubscriptionCache } from './subscription-fetch'

WebBrowser.maybeCompleteAuthSession()

export type OAuthProvider = 'google' | 'apple'

const OAUTH_PROVIDER_LABEL: Record<OAuthProvider, string> = { google: 'Google', apple: 'Apple' }

export class SignOutBlockedError extends Error {
  readonly pendingCount: number

  constructor(pendingCount: number) {
    super(`You have ${pendingCount} unsynced change${pendingCount === 1 ? '' : 's'}. Sync or discard before signing out.`)
    this.name = 'SignOutBlockedError'
    this.pendingCount = pendingCount
  }
}

function oauthUserMessage(provider: OAuthProvider, err: unknown): string {
  const label = OAUTH_PROVIDER_LABEL[provider]
  if (isOAuthCancelled(err)) return 'OAuth sign-in was cancelled'

  const raw = err instanceof Error ? err.message : ''
  if (/Missing or invalid provider/i.test(raw)) {
    return `${label} sign-in isn't set up yet. Configure it in the PocketBase admin dashboard first.`
  }
  if (/realtime connection interrupted/i.test(raw)) {
    return `${label} sign-in lost connection. Close any leftover auth tabs, then try again.`
  }
  if (raw.includes('Failed to fetch OAuth2 token')) {
    if (provider === 'apple') {
      return (
        'Apple rejected the login token. In PocketBase → users → OAuth2 → Apple, use Generate secret with Team ID / Key ID / .p8 (Client Secret must be the JWT, not the .p8). Return URL: https://detailing-pb.fly.dev/api/oauth2-redirect.'
      )
    }
    return (
      'Google rejected the login token. In PocketBase → users → OAuth2 → Google, re-paste the Client Secret for the Web client whose redirect URI is https://detailing-pb.fly.dev/api/oauth2-redirect.'
    )
  }
  return raw || `Could not sign in with ${label}.`
}

export function isOAuthCancelled(err: unknown): boolean {
  return (
    (err instanceof ClientResponseError && err.isAbort) ||
    (err instanceof Error && /abort|cancel|manually cancelled/i.test(err.message))
  )
}

/** Open provider auth UI; `onDismiss` runs if the user closes it before auth finishes. */
function openOAuthUrl(url: string, onDismiss: () => void): { close: () => void } {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const popup = window.open(url, 'rinse_oauth', 'width=520,height=720')
    if (!popup) {
      window.location.assign(url)
      return { close: () => undefined }
    }
    const timer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(timer)
        onDismiss()
      }
    }, 300)
    return {
      close: () => {
        window.clearInterval(timer)
        try {
          popup.close()
        } catch {
          /* ignore */
        }
      },
    }
  }

  let dismissed = false
  void WebBrowser.openBrowserAsync(url).then(() => {
    if (!dismissed) onDismiss()
  })
  return {
    close: () => {
      dismissed = true
      void WebBrowser.dismissBrowser()
    },
  }
}

function isDefinitiveAuthFailure(err: unknown): boolean {
  if (!err) return false
  const e = err as { status?: number; isAbort?: boolean; message?: string; name?: string }
  if (e.isAbort === true || e.name === 'AbortError') return false
  const msg = e.message ?? ''
  if (/timed out|timeout|network|failed to fetch|load failed/i.test(msg)) return false
  if (e.status === 401 || e.status === 403) return true
  if (/invalid (or expired )?(auth|token|authorization)/i.test(msg)) return true
  return false
}

export async function persistAuth(token: string, record: RecordModel): Promise<void> {
  const recordJson = JSON.stringify(record)
  await authStore.saveToken(token)
  await authStore.saveProfile(recordJson)
  const pb = getPocketBase()
  pb.authStore.save(token, record)
}

async function saveAuthFromStore(): Promise<void> {
  const pb = getPocketBase()
  if (!pb.authStore.isValid || !pb.authStore.token || !pb.authStore.record) return
  await persistAuth(pb.authStore.token, pb.authStore.record)
}

export async function restoreAuth(): Promise<boolean> {
  const token = await authStore.loadToken()
  const recordJson = await authStore.loadProfile()
  if (!token || !recordJson) {
    await authStore.clearAll()
    return false
  }

  try {
    const pb = getPocketBase()
    pb.authStore.save(token, JSON.parse(recordJson) as RecordModel)
    if (!pb.authStore.isValid) {
      await authStore.clearAll()
      pb.authStore.clear()
      return false
    }
    return true
  } catch {
    await authStore.clearAll()
    getPocketBase().authStore.clear()
    return false
  }
}

async function doAuthRefresh(): Promise<boolean> {
  const pb = getPocketBase()
  if (!pb.authStore.isValid) return false

  try {
    await pb.collection('users').authRefresh()
    await saveAuthFromStore()
    return true
  } catch (err) {
    if (isDefinitiveAuthFailure(err)) {
      await authStore.clearAll()
      pb.authStore.clear()
      return false
    }
    return pb.authStore.isValid
  }
}

let refreshPromise: Promise<boolean> | null = null

/** Single in-flight auth refresh — shared by AppState resume and sync runner. */
export async function refreshAuthOnce(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = doAuthRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

export async function clearAuth(): Promise<void> {
  await authStore.clearAll()
  getPocketBase().authStore.clear()
}

export function getCurrentUserEmail(): string | null {
  const pb = getPocketBase()
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
  const userId = pb.authStore.record?.id
  if (!pb.authStore.isValid || typeof userId !== 'string') {
    return { ok: false, error: 'Not signed in' }
  }
  try {
    await pb.collection('users').update(userId, {
      oldPassword: input.oldPassword,
      password: input.password,
      passwordConfirm: input.passwordConfirm,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: pocketBaseErrorMessage(err, 'Could not update password') }
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pb = getPocketBase()
  const trimmed = email.trim()
  if (!trimmed) return { ok: false, error: 'Enter your email address' }
  try {
    await pb.collection('users').requestPasswordReset(trimmed)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: pocketBaseErrorMessage(err, 'Could not send reset email') }
  }
}

export async function signUpWithEmail(input: {
  email: string
  password: string
  businessName: string
}): Promise<void> {
  const apiUrl = getAuthApiBase()
  if (!apiUrl) throw new Error('EXPO_PUBLIC_APP_API_URL is not configured')

  const res = await fetch(`${apiUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      businessName: input.businessName.trim(),
    }),
  })

  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Signup API not found. Start detailing-app on :3000 (npm run dev) and set EXPO_PUBLIC_APP_API_URL=http://localhost:3000 in rinse-mobile/.env, then restart Metro.',
      )
    }
    throw new Error(data.error ?? 'Could not create account')
  }

  await signInWithEmail(input.email, input.password)
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const trimmedEmail = email.trim()
  const pb = getPocketBase()
  try {
    await pb.collection('users').authWithPassword(trimmedEmail, password)
    await saveAuthFromStore()
  } catch (err) {
    throw new Error(formatLoginError(err))
  }
}

function formatLoginError(err: unknown): string {
  if (err instanceof ClientResponseError) {
    if (err.status === 400) {
      return 'Invalid email or password.'
    }
    if (err.status === 403) {
      return 'This account cannot sign in here. Contact support if you need help.'
    }
    return err.message || 'Authentication failed'
  }
  if (err instanceof Error && err.message) return err.message
  return 'Authentication failed'
}

export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  const pb = getPocketBase()
  const label = OAUTH_PROVIDER_LABEL[provider]

  // PocketBase all-in-one OAuth2 (redirect https://detailing-pb.fly.dev/api/oauth2-redirect).
  // Don't preflight listAuthMethods — authWithOAuth2 already fetches it once.
  // Settle our own promise on popup dismiss (cancelRequest alone can hang).
  const requestKey = `oauth2-${provider}`
  const browser: { current: { close: () => void } | null } = { current: null }
  type Outcome = 'pending' | 'done'
  let outcome: Outcome = 'pending'

  try {
    const authData = await new Promise<{ token?: string }>((resolve, reject) => {
      const finishCancel = () => {
        if (outcome !== 'pending') return
        outcome = 'done'
        try {
          pb.cancelRequest(requestKey)
        } catch {
          /* ignore */
        }
        reject(new Error('OAuth sign-in was cancelled'))
      }

      void pb
        .collection('users')
        .authWithOAuth2({
          provider,
          requestKey,
          urlCallback: (url) => {
            browser.current = openOAuthUrl(url, finishCancel)
          },
        })
        .then((data) => {
          if (outcome !== 'pending') return
          outcome = 'done'
          // Close auth UI immediately so the app doesn't wait on the leftover success page.
          browser.current?.close()
          resolve(data)
        })
        .catch((err: unknown) => {
          if (outcome !== 'pending') return
          outcome = 'done'
          browser.current?.close()
          reject(err)
        })
    })

    if (!authData?.token || !pb.authStore.record) {
      throw new Error(`Could not sign in with ${label}.`)
    }
    await saveAuthFromStore()
  } catch (err) {
    outcome = 'done'
    browser.current?.close()
    if (isOAuthCancelled(err)) {
      throw new Error('OAuth sign-in was cancelled')
    }
    console.error(`[oauth:${provider}]`, err)
    throw new Error(oauthUserMessage(provider, err))
  }

  await ensureOAuthProvisioned()
}

/** Prefer direct API host — skip Metro /api-proxy hop (CORS is enabled on auth routes). */
function getAuthApiBase(): string {
  const configured = getAppApiUrl().replace(/\/$/, '')
  if (configured.includes('/api-proxy')) return 'https://app.rinsehq.com'
  return configured || 'https://app.rinsehq.com'
}

async function ensureOAuthProvisioned(): Promise<void> {
  const pb = getPocketBase()
  if (!pb.authStore.isValid) return

  const record = pb.authStore.record as { organization_id?: string } | null
  if (record?.organization_id) return

  const apiUrl = getAuthApiBase()
  const token = pb.authStore.token
  if (!apiUrl || !token) return

  const res = await fetch(`${apiUrl}/api/auth/oauth-provision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  })

  const data = (await res.json()) as {
    ok?: boolean
    token?: string
    record?: RecordModel
    error?: string
  }

  if (!res.ok) {
    throw new Error(data.error ?? 'Could not complete account setup — create your org at rinsehq.com')
  }

  if (data.token && data.record) {
    await persistAuth(data.token, data.record)
  } else {
    await pb.collection('users').authRefresh()
    await saveAuthFromStore()
  }
}

export async function signOut(options?: { force?: boolean }): Promise<void> {
  const pendingCount = await getQueueCount()
  if (pendingCount > 0 && !options?.force) {
    throw new SignOutBlockedError(pendingCount)
  }

  if (options?.force && pendingCount > 0) {
    await clearQueue()
  }

  const orgId = getOrganizationId()
  resetOfflineDb(orgId ?? undefined)
  clearOrgSubscriptionCache()
  await clearAuth()
}

export function getCurrentUser(): RecordModel | null {
  const pb = getPocketBase()
  return pb.authStore.isValid ? pb.authStore.record : null
}

export function getAuthToken(): string | null {
  const pb = getPocketBase()
  return pb.authStore.isValid ? pb.authStore.token : null
}
