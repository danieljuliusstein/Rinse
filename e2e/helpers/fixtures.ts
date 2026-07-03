import type { APIRequestContext, BrowserContext, TestInfo } from '@playwright/test'
import { installPocketBaseSession } from './auth'
import { getOperatorSession, getSessionSkipReason } from './session'

export async function skipIfNoOperator(testInfo: TestInfo, request: APIRequestContext): Promise<boolean> {
  const session = await getOperatorSession(request)
  if (!session) {
    testInfo.skip(true, getSessionSkipReason() ?? 'No operator session')
    return false
  }
  return true
}

export async function skipIfAppUnreachable(testInfo: TestInfo, request: APIRequestContext): Promise<boolean> {
  try {
    const res = await request.get('/auth', { timeout: 10_000 })
    if (!res.ok() && res.status() >= 500) {
      testInfo.skip(true, 'App not reachable — run npm run dev')
      return false
    }
  } catch {
    testInfo.skip(true, 'App not reachable — run npm run dev')
    return false
  }
  return true
}

export async function setupOperatorContext(
  context: BrowserContext,
  request: APIRequestContext,
): Promise<{ token: string; record: Record<string, unknown> } | null> {
  const session = await getOperatorSession(request)
  if (!session) return null
  await installPocketBaseSession(context, session)
  return session
}
