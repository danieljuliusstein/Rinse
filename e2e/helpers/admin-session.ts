import type { APIRequestContext } from '@playwright/test'
import { authenticateAdminWithPocketBase, checkPocketBaseReachable, hasAdminCredentials } from './auth'

export type PocketBaseSession = { token: string; record: Record<string, unknown> }

let cachedSession: PocketBaseSession | null = null
let sessionError: string | null = null

export async function getAdminSession(request: APIRequestContext): Promise<PocketBaseSession | null> {
  if (cachedSession) return cachedSession
  if (sessionError) return null
  if (!hasAdminCredentials()) {
    sessionError = 'Set PB_URL and PLATFORM_ADMIN_ACCOUNT_PASSWORD in .env.local'
    return null
  }
  if (!(await checkPocketBaseReachable(request))) {
    sessionError = 'PocketBase not reachable'
    return null
  }
  try {
    cachedSession = await authenticateAdminWithPocketBase(request)
    return cachedSession
  } catch (err) {
    sessionError = err instanceof Error ? err.message : String(err)
    return null
  }
}

export function getAdminSessionSkipReason(): string | null {
  return sessionError
}
