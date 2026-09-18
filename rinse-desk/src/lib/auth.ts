import type { RecordModel } from 'pocketbase'
import { ClientResponseError } from 'pocketbase'
import { getAppApiUrl, getPocketBase } from './pocketbase'

export type OAuthProvider = 'google' | 'apple'

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

function hasOrganization(record: RecordModel): boolean {
  const org = (record as { organization_id?: unknown }).organization_id
  return (
    (typeof org === 'string' && org.length > 0) ||
    (org != null && typeof org === 'object' && typeof (org as { id?: unknown }).id === 'string')
  )
}

export function isEmailVerified(record: RecordModel | null): boolean {
  if (!record) return true
  return Boolean((record as { verified?: unknown }).verified)
}

function pocketBaseErrorMessage(err: unknown, fallback: string, provider?: OAuthProvider): string {
  const e = err as {
    message?: string
    response?: { message?: string; data?: Record<string, { message?: string }> }
    data?: { message?: string; data?: Record<string, { message?: string }> }
    originalError?: { message?: string }
  }
  const fields = e.response?.data ?? e.data?.data
  if (fields) {
    for (const key of ['businessName', 'email', 'password', 'passwordConfirm']) {
      const msg = fields[key]?.message
      if (msg) return msg
    }
  }
  const raw =
    e.response?.message ||
    e.data?.message ||
    e.message ||
    e.originalError?.message ||
    ''

  const status = (err as { status?: number }).status
  const mfaId =
    (e.response as { mfaId?: string } | undefined)?.mfaId ||
    (e.data as { mfaId?: string } | undefined)?.mfaId ||
    (err as { response?: { mfaId?: string } }).response?.mfaId
  if (status === 401 && mfaId) {
    return (
      'PocketBase MFA is enabled on users, so social sign-in alone is not enough. ' +
      'In PocketBase Admin → Collections → users → Options, disable Multi-factor authentication, then try again.'
    )
  }
  if (status === 401 && (raw === 'Something went wrong.' || raw.includes('Something went wrong'))) {
    return (
      'Sign-in was rejected (401). If Multi-factor auth is enabled on the users collection in PocketBase, ' +
      'disable it for operator Google/Apple signup, then try again.'
    )
  }

  if (raw.includes('Failed to fetch OAuth2 token')) {
    if (provider === 'apple') {
      return (
        'Apple rejected the login token. In PocketBase → users → OAuth2 → Apple, confirm ' +
        'Client ID is your Services ID, and Team ID / Key ID / .p8 private key are from the same ' +
        'Sign in with Apple key. Return URL must be https://detailing-pb.fly.dev/api/oauth2-redirect.'
      )
    }
    return (
      'Google rejected the login token. In PocketBase → users → OAuth2 → Google, ' +
      're-paste the Client Secret from the same Web client whose redirect URI is ' +
      'https://detailing-pb.fly.dev/api/oauth2-redirect, then try again.'
    )
  }
  if (!raw || raw === 'Something went wrong while processing your request.' || raw === 'ClientResponseError') {
    return fallback
  }
  return raw
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
    if (!hasOrganization(pb.authStore.record)) {
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

export async function signUpWithEmail(input: {
  email: string
  password: string
  businessName: string
}): Promise<{ verificationEmailSent: boolean }> {
  const apiUrl = getAppApiUrl()
  let res: Response
  try {
    res = await fetch(`${apiUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        businessName: input.businessName.trim(),
      }),
    })
  } catch {
    throw new Error('Could not reach the signup service. Check your connection and try again.')
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; verificationEmailSent?: boolean }
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not create account')
  }
  await signInWithEmail(input.email, input.password)
  return { verificationEmailSent: data.verificationEmailSent !== false }
}

/** Re-sends the verification email. Safe to call whether or not one was sent already. */
export async function resendVerificationEmail(email: string): Promise<void> {
  try {
    await getPocketBase().collection('users').requestVerification(email.trim().toLowerCase())
  } catch (err) {
    throw new Error(pocketBaseErrorMessage(err, 'Could not send verification email. Try again shortly.'))
  }
}

/** Confirms the token from the verification email link and refreshes the local session if signed in. */
export async function confirmEmailVerification(token: string): Promise<void> {
  const pb = getPocketBase()
  try {
    await pb.collection('users').confirmVerification(token)
  } catch (err) {
    throw new Error(pocketBaseErrorMessage(err, 'This verification link is invalid or has expired.'))
  }
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh()
      if (pb.authStore.token && pb.authStore.record) persistAuth(pb.authStore.token, pb.authStore.record)
    } catch {
      /* the confirm still succeeded — a fresh sign-in will pick up verified: true */
    }
  }
}

/** After OAuth2 sign-in, new accounts have no organization yet — provision one via apps/api (superuser-only operation). */
async function ensureOAuthProvisioned(businessName?: string): Promise<void> {
  const pb = getPocketBase()
  if (!pb.authStore.isValid || !pb.authStore.record) return
  if (hasOrganization(pb.authStore.record)) return

  const token = pb.authStore.token
  let res: Response
  try {
    res = await fetch(`${getAppApiUrl()}/api/auth/oauth-provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessName }),
    })
  } catch {
    clearAuth()
    throw new Error('Could not reach the signup service. Check your connection and try again.')
  }
  const data = (await res.json().catch(() => ({}))) as {
    token?: string
    record?: RecordModel
    error?: string
  }
  if (!res.ok) {
    clearAuth()
    throw new Error(data.error ?? 'Could not finish setting up your account.')
  }
  if (data.token && data.record) {
    persistAuth(data.token, data.record)
  } else {
    await pb.collection('users').authRefresh()
    if (pb.authStore.token && pb.authStore.record) persistAuth(pb.authStore.token, pb.authStore.record)
  }
}

/**
 * Opens a popup for the OAuth2 vendor page (Google/Apple must be configured as
 * providers in the PocketBase admin dashboard first). New accounts get an
 * organization auto-provisioned via apps/api immediately after.
 */
const OAUTH_PROVIDER_LABEL: Record<OAuthProvider, string> = { google: 'Google', apple: 'Apple' }

export async function signInWithOAuth(provider: OAuthProvider, opts?: { businessName?: string }): Promise<void> {
  const pb = getPocketBase()
  const label = OAUTH_PROVIDER_LABEL[provider]

  const methods = await pb
    .collection('users')
    .listAuthMethods()
    .catch(() => {
      throw new Error('Could not reach PocketBase. Check your connection and try again.')
    })
  if (!methods.oauth2?.enabled || !methods.oauth2.providers?.some((p) => p.name === provider)) {
    throw new Error(`${label} sign-in isn't set up yet. Configure it in the PocketBase admin dashboard first.`)
  }

  try {
    const authData = await pb.collection('users').authWithOAuth2({ provider })
    if (!authData?.token || !pb.authStore.record) throw new Error(`Could not sign in with ${label}.`)
    persistAuth(pb.authStore.token!, pb.authStore.record)
  } catch (err) {
    console.error(`[oauth:${provider}]`, err)
    throw new Error(pocketBaseErrorMessage(err, `Could not sign in with ${label}.`, provider))
  }
  await ensureOAuthProvisioned(opts?.businessName)
}

export async function signOut(): Promise<void> {
  clearAuth()
}
