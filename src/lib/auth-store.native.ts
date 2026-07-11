import * as SecureStore from 'expo-secure-store'
import { clearAuthProfile, loadAuthProfile, saveAuthProfile } from './offline/db'

const AUTH_TOKEN_KEY = 'rinse_pb_token'
const OAUTH_PKCE_KEY = 'pb_oauth_pkce_verifier'
const OAUTH_STATE_KEY = 'pb_oauth_state'

export async function loadToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY)
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token)
}

export async function loadProfile(): Promise<string | null> {
  return loadAuthProfile()
}

export async function saveProfile(recordJson: string): Promise<void> {
  await saveAuthProfile(recordJson)
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
}

export async function storeOAuthPkce(verifier: string, state: string): Promise<void> {
  await SecureStore.setItemAsync(OAUTH_PKCE_KEY, verifier)
  await SecureStore.setItemAsync(OAUTH_STATE_KEY, state)
}

export async function consumeOAuthPkce(expectedState?: string | null): Promise<string | undefined> {
  const [verifier, state] = await Promise.all([
    SecureStore.getItemAsync(OAUTH_PKCE_KEY),
    SecureStore.getItemAsync(OAUTH_STATE_KEY),
  ])
  await Promise.all([
    SecureStore.deleteItemAsync(OAUTH_PKCE_KEY),
    SecureStore.deleteItemAsync(OAUTH_STATE_KEY),
  ])
  if (!verifier) return undefined
  if (expectedState && state && expectedState !== state) {
    throw new Error('OAuth state mismatch — sign-in interrupted, try again')
  }
  return verifier
}

export async function clearAll(): Promise<void> {
  await clearToken()
  await clearAuthProfile()
  await Promise.all([
    SecureStore.deleteItemAsync(OAUTH_PKCE_KEY),
    SecureStore.deleteItemAsync(OAUTH_STATE_KEY),
  ])
}
