import type { APIRequestContext } from '@playwright/test'
import { authenticateWithPocketBase, checkPocketBaseReachable, hasE2ECredentials } from './auth'

export type PocketBaseSession = { token: string; record: Record<string, unknown> }

let cachedSession: PocketBaseSession | null = null
let sessionError: string | null = null

export async function getOperatorSession(request: APIRequestContext): Promise<PocketBaseSession | null> {
  if (cachedSession) return cachedSession
  if (sessionError) return null
  if (!hasE2ECredentials()) {
    sessionError = 'Set PB_URL in .env.local'
    return null
  }
  if (!(await checkPocketBaseReachable(request))) {
    sessionError = 'PocketBase not reachable'
    return null
  }
  try {
    cachedSession = await authenticateWithPocketBase(request)
    return cachedSession
  } catch (err) {
    sessionError = err instanceof Error ? err.message : String(err)
    return null
  }
}

export function getSessionSkipReason(): string | null {
  return sessionError
}

export function resetOperatorSessionCache(): void {
  cachedSession = null
  sessionError = null
}
