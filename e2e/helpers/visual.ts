import { join } from 'node:path'
import { expect, type Page } from '@playwright/test'
import type { AuditCapture } from '../audit-manifest'
import type { VisualTestSession } from './session'
import { ensureOnboardingComplete, setOnboardingIncomplete } from './session'

const root = process.cwd()
export const NATIVE_BASELINE_DIR = join(root, 'screenshots/audit-2026-07-07/native')
export const PWA_BASELINE_DIR = join(root, 'screenshots/audit-2026-07-07/pwa')

export function withScreenshotQuery(path: string): string {
  const [base, hash = ''] = path.split('#')
  const [pathname, search = ''] = base.split('?')
  const params = new URLSearchParams(search)
  if (!params.has('screenshot')) params.set('screenshot', '1')
  const query = params.toString()
  const withQuery = query ? `${pathname}?${query}` : pathname
  return hash ? `${withQuery}#${hash}` : withQuery
}

export function diffRatioForCapture(capture: { dynamic?: boolean }, loose = false): number {
  if (loose) return 0.35
  return capture.dynamic ? 0.22 : 0.1
}

export async function injectNativeAuth(
  page: Page,
  session: Pick<VisualTestSession, 'token' | 'record'>,
): Promise<void> {
  await page.addInitScript(
    ({ token, record }) => {
      try {
        localStorage.setItem('rinse_pb_token', token)
        localStorage.setItem('rinse_pb_profile', JSON.stringify(record))
        localStorage.setItem('rinse_product_tour_completed', '1')
        localStorage.setItem('rinse_product_tour_welcome_dismissed', '1')
        localStorage.removeItem('rinse_product_tour_pending')
      } catch {
        /* storage blocked */
      }
    },
    { token: session.token, record: session.record },
  )
}

export async function clearNativeSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      for (const key of [
        'rinse_pb_token',
        'rinse_pb_profile',
        'rinse_setup_intro_seen',
        'rinse_product_tour_completed',
        'rinse_product_tour_pending',
        'rinse_product_tour_welcome_dismissed',
      ]) {
        localStorage.removeItem(key)
      }
    } catch {
      /* storage blocked */
    }
  })
}

export async function waitForOperatorShell(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/\/login/, { timeout: 45_000 })
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 45_000 })
  await expect(page.getByText('Starting Rinse…')).toHaveCount(0, { timeout: 45_000 }).catch(() => {})
  await expect(page.getByText('Checking session…')).toHaveCount(0, { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(800)
}

export async function waitForFunnelScreen(page: Page, path: string): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {})
  if (path.startsWith('/welcome')) {
    await expect(page.getByText('Run your business from your phone')).toBeVisible({ timeout: 45_000 })
  } else if (path.startsWith('/intro')) {
    await expect(page.getByRole('button', { name: /continue|get started/i })).toBeVisible({
      timeout: 45_000,
    })
  }
  await page.waitForTimeout(800)
}

export async function waitForOnboardingScreen(page: Page, path: string): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {})
  if (path.includes('step=plans')) {
    await expect(page.getByText('Your plan')).toBeVisible({ timeout: 45_000 })
  } else {
    await expect(page.getByText('Your business')).toBeVisible({ timeout: 45_000 })
  }
  await page.waitForTimeout(800)
}

export function resolveAuditPath(
  capture: AuditCapture,
  session: VisualTestSession,
): string | null {
  if (!capture.path) return null

  let path = capture.path
  if (capture.requiresEntity === 'job') {
    if (!session.entities.jobId) return null
    path = path.replace('__JOB_ID__', session.entities.jobId)
  }
  if (capture.requiresEntity === 'client') {
    if (!session.entities.clientId) return null
    path = path.replace('__CLIENT_ID__', session.entities.clientId)
  }
  if (capture.requiresEntity === 'invoice') {
    if (!session.entities.invoiceId) return null
    path = path.replace('__INVOICE_ID__', session.entities.invoiceId)
  }
  return path
}

export async function captureAuditScreen(
  page: Page,
  capture: AuditCapture,
  session: VisualTestSession,
): Promise<void> {
  const path = resolveAuditPath(capture, session)
  if (!path) {
    throw new Error(`Missing test data for ${capture.file}`)
  }

  const lane = capture.lane ?? 'operator'

  if (lane === 'funnel') {
    await clearNativeSession(page)
    await page.goto(withScreenshotQuery(path), { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForFunnelScreen(page, path)
  } else if (lane === 'onboarding') {
    const step = path.includes('step=plans') ? 4 : 1
    await setOnboardingIncomplete(session.pb, session.orgId, step)
    await injectNativeAuth(page, session)
    await page.goto(withScreenshotQuery(path), { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForOnboardingScreen(page, path)
  } else {
    await injectNativeAuth(page, session)
    await page.goto(withScreenshotQuery(path), { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForOperatorShell(page)
  }

  if (capture.kind === 'fab') {
    await page.getByRole('button', { name: 'Quick actions' }).click({ timeout: 10_000 })
    await page.waitForTimeout(400)
  }

  if (capture.kind === 'scroll' && capture.scrollY) {
    await page.mouse.wheel(0, capture.scrollY)
    await page.waitForTimeout(300)
  }

  await page.waitForTimeout(400)
}
