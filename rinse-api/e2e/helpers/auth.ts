import type { APIRequestContext, BrowserContext, Page } from '@playwright/test'

const API_TIMEOUT_MS = 15_000

function pbUrl(): string {
  return (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '')
}

function creds(): { email: string; password: string } {
  return {
    email: process.env.E2E_EMAIL || process.env.DEMO_ACCOUNT_EMAIL || 'demo@rinsehq.com',
    password: process.env.E2E_PASSWORD || process.env.DEMO_ACCOUNT_PASSWORD || 'SummitDemo2026!',
  }
}

export function getE2ECredentials(): { email: string; password: string } {
  return creds()
}

export function getAdminCredentials(): { email: string; password: string } {
  return {
    email: (process.env.PLATFORM_ADMIN_ACCOUNT_EMAIL ?? 'admin@rinsehq.com').trim().toLowerCase(),
    password: (process.env.PLATFORM_ADMIN_ACCOUNT_PASSWORD ?? '').trim(),
  }
}

export function hasAdminCredentials(): boolean {
  const { password } = getAdminCredentials()
  return Boolean(pbUrl() && password.length >= 8)
}

export function hasE2ECredentials(): boolean {
  return Boolean(pbUrl())
}

export async function checkPocketBaseReachable(request: APIRequestContext): Promise<boolean> {
  const base = pbUrl()
  if (!base) return false
  try {
    const res = await request.get(`${base}/api/health`, { timeout: API_TIMEOUT_MS })
    return res.ok()
  } catch {
    return false
  }
}

export async function authenticateWithPocketBase(
  request: APIRequestContext,
): Promise<{ token: string; record: Record<string, unknown> }> {
  const auth = creds()
  const base = pbUrl()
  if (!base) {
    throw new Error('Set PB_URL or NEXT_PUBLIC_PB_URL in .env.local')
  }

  const response = await request.post(`${base}/api/collections/users/auth-with-password`, {
    data: { identity: auth.email, password: auth.password },
    timeout: API_TIMEOUT_MS,
  })
  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`PocketBase login failed (${response.status()}): ${body}`)
  }

  const data = (await response.json()) as { token: string; record: Record<string, unknown> }
  return { token: data.token, record: data.record }
}

export async function authenticateAdminWithPocketBase(
  request: APIRequestContext,
): Promise<{ token: string; record: Record<string, unknown> }> {
  const auth = getAdminCredentials()
  const base = pbUrl()
  if (!base) {
    throw new Error('Set PB_URL or NEXT_PUBLIC_PB_URL in .env.local')
  }
  if (!auth.password) {
    throw new Error('Set PLATFORM_ADMIN_ACCOUNT_PASSWORD in .env.local')
  }

  const response = await request.post(`${base}/api/collections/users/auth-with-password`, {
    data: { identity: auth.email, password: auth.password },
    timeout: API_TIMEOUT_MS,
  })
  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Platform admin login failed (${response.status()}): ${body}`)
  }

  const data = (await response.json()) as { token: string; record: Record<string, unknown> }
  return { token: data.token, record: data.record }
}

export async function installPocketBaseSession(
  context: BrowserContext,
  session: { token: string; record: Record<string, unknown> },
): Promise<void> {
  await context.addInitScript(({ token, record }) => {
    try {
      localStorage.setItem('pocketbase_auth', JSON.stringify({ token, record }))
      sessionStorage.setItem('pb_auth_active', '1')

      const settingsKey = 'detailing_settings_v1'
      const raw = localStorage.getItem(settingsKey)
      const settings = raw ? JSON.parse(raw) : {}
      settings.onboarding_completed_at = '2026-07-01'
      settings.onboarding_step = 4
      localStorage.setItem(settingsKey, JSON.stringify(settings))
    } catch {
      /* storage may be blocked during early navigation in some browser contexts */
    }
  }, session)
}

export async function loginOperator(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 })

  if (page.url().includes('/onboarding')) {
    throw new Error(
      'E2E account still needs onboarding. Run npm run demo:account or set E2E_EMAIL to a completed operator.',
    )
  }

  await page.waitForURL((url) => !url.pathname.includes('/onboarding') && !url.pathname.includes('/auth'), {
    timeout: 30_000,
  })

  await page.getByRole('link', { name: 'Jobs' }).waitFor({ state: 'visible', timeout: 30_000 })
  await page.locator('[data-tour="fab"]').waitFor({ state: 'visible', timeout: 10_000 })
}
