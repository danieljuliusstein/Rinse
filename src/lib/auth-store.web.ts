/** Web preview — localStorage instead of SecureStore (native-only). */

import { clearAuthProfile, loadAuthProfile, saveAuthProfile } from './offline/db'

const AUTH_TOKEN_KEY = 'rinse_pb_token'
const AUTH_PROFILE_KEY = 'rinse_pb_profile'
const OAUTH_PKCE_KEY = 'pb_oauth_pkce_verifier'
const OAUTH_STATE_KEY = 'pb_oauth_state'

function getItem(key: string): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(key)
}

function setItem(key: string, value: string): void {
  localStorage.setItem(key, value)
}

function removeItem(key: string): void {
  localStorage.removeItem(key)
}

export async function loadToken(): Promise<string | null> {
  return getItem(AUTH_TOKEN_KEY)
}

export async function saveToken(token: string): Promise<void> {
  setItem(AUTH_TOKEN_KEY, token)
}

export async function loadProfile(): Promise<string | null> {
  const stored = getItem(AUTH_PROFILE_KEY)
  if (stored) return stored
  return loadAuthProfile()
}

export async function saveProfile(recordJson: string): Promise<void> {
  setItem(AUTH_PROFILE_KEY, recordJson)
  saveAuthProfile(recordJson)
}

export async function clearToken(): Promise<void> {
  removeItem(AUTH_TOKEN_KEY)
}

export async function storeOAuthPkce(verifier: string, state: string): Promise<void> {
  setItem(OAUTH_PKCE_KEY, verifier)
  setItem(OAUTH_STATE_KEY, state)
}

export async function consumeOAuthPkce(expectedState?: string | null): Promise<string | undefined> {
  const verifier = getItem(OAUTH_PKCE_KEY)
  const state = getItem(OAUTH_STATE_KEY)
  removeItem(OAUTH_PKCE_KEY)
  removeItem(OAUTH_STATE_KEY)
  if (!verifier) return undefined
  if (expectedState && state && expectedState !== state) {
    throw new Error('OAuth state mismatch — sign-in interrupted, try again')
  }
  return verifier
}

export async function clearAll(): Promise<void> {
  await clearToken()
  removeItem(AUTH_PROFILE_KEY)
  await clearAuthProfile()
  removeItem(OAUTH_PKCE_KEY)
  removeItem(OAUTH_STATE_KEY)
}
