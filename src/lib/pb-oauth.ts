import { getPocketBase, isPocketBaseConfigured } from './pocketbase'

export type OAuthProvider = 'google' | 'apple'

const PROVIDER_STORAGE_KEY = 'rinse_oauth_provider'
const OAUTH_REDIRECT_PATH = '/auth/oauth/callback'

export function oauthRedirectUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${OAUTH_REDIRECT_PATH}`
}

export function storeOAuthProvider(provider: OAuthProvider): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(PROVIDER_STORAGE_KEY, provider)
}

export function readStoredOAuthProvider(): OAuthProvider | null {
  if (typeof sessionStorage === 'undefined') return null
  const value = sessionStorage.getItem(PROVIDER_STORAGE_KEY)
  return value === 'google' || value === 'apple' ? value : null
}

export function clearStoredOAuthProvider(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(PROVIDER_STORAGE_KEY)
}

export async function startOAuthLogin(provider: OAuthProvider): Promise<void> {
  if (!isPocketBaseConfigured()) {
    throw new Error('Cloud login is not configured')
  }
  const pb = getPocketBase()
  if (!pb) throw new Error('Cloud login is not configured')

  storeOAuthProvider(provider)

  await pb.collection('users').authWithOAuth2({
    provider,
    urlCallback: (url) => {
      window.location.href = url
    },
    redirectUrl: oauthRedirectUrl(),
  })
}

export async function completeOAuthLogin(): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false
  const pb = getPocketBase()
  if (!pb) return false

  const provider = readStoredOAuthProvider()
  if (!provider) return false

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) return false

  const codeVerifier =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('pb_oauth2_code_verifier') ?? undefined
      : undefined

  try {
    await pb.collection('users').authWithOAuth2({
      provider,
      code,
      codeVerifier,
      redirectUrl: oauthRedirectUrl(),
    })
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pb_auth_active', '1')
    }
    clearStoredOAuthProvider()
    return pb.authStore.isValid
  } catch (err) {
    console.warn('[pb-oauth] OAuth callback failed:', err)
    clearStoredOAuthProvider()
    return false
  }
}

export async function ensureOAuthProvisioned(businessName?: string): Promise<boolean> {
  const pb = getPocketBase()
  if (!pb?.authStore.isValid) return false

  const record = pb.authStore.record as { organization_id?: string } | null
  if (record?.organization_id) return true

  const token = pb.authStore.token
  if (!token) return false

  const res = await fetch('/api/auth/oauth-provision', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ businessName }),
  })

  const data = (await res.json()) as {
    ok?: boolean
    token?: string
    record?: Record<string, unknown>
    error?: string
  }

  if (!res.ok) {
    throw new Error(data.error ?? 'Could not set up account')
  }

  if (data.token && data.record) {
    pb.authStore.save(data.token, data.record as Parameters<typeof pb.authStore.save>[1])
  } else {
    await pb.collection('users').authRefresh()
  }

  return Boolean((pb.authStore.record as { organization_id?: string } | null)?.organization_id)
}
