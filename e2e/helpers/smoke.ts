import type { Page, Response } from '@playwright/test'
import { expect } from '@playwright/test'

function trackPageErrors(page: Page): string[] {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))
  return pageErrors
}

function assertNoUnexpectedErrors(pageErrors: string[], path: string): void {
  const unexpected = pageErrors.filter(
    (msg) => !msg.toLowerCase().includes('missing collection') && !msg.toLowerCase().includes('collection context'),
  )
  expect(unexpected, `${path} runtime errors`).toEqual([])
}

async function gotoReliable(page: Page, path: string, timeout = 45_000): Promise<Response | null> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await page.goto(path, { waitUntil: 'domcontentloaded', timeout })
    } catch (err) {
      lastError = err
      if (attempt < 2) {
        await page.waitForTimeout(2000 * (attempt + 1))
      }
    }
  }
  throw lastError
}

async function waitForAppShell(page: Page): Promise<void> {
  const main = page.locator('#main-content').first()
  await expect(main).toBeAttached({ timeout: 30_000 })

  await expect
    .poll(
      async () =>
        main.evaluate((el) => {
          const style = getComputedStyle(el)
          if (style.visibility === 'hidden' || style.display === 'none') return false
          const rect = el.getBoundingClientRect()
          return rect.height > 0 || Boolean(el.textContent?.trim())
        }),
      { timeout: 30_000 },
    )
    .toBe(true)

  await expect(main.getByText(/^Loading…$/)).toBeHidden({ timeout: 30_000 }).catch(() => {})
}

export async function smokeVisitPublic(page: Page, path: string): Promise<void> {
  const pageErrors = trackPageErrors(page)

  const response = await gotoReliable(page, path)
  expect(response?.status() ?? 0, `${path} HTTP status`).toBeLessThan(500)

  const shell = page
    .locator('.auth-screen, .book-body, #main-content, .client-light-root, .welcome-screen, .offline-screen, .demo-screens-root, .embed-page, .portal-root')
    .first()
  await expect(shell).toBeVisible({ timeout: 20_000 })
  assertNoUnexpectedErrors(pageErrors, path)
}

export async function smokeVisitOAuthCallback(page: Page): Promise<void> {
  const pageErrors = trackPageErrors(page)

  await gotoReliable(page, '/auth/oauth/callback')

  await expect(
    page.locator('.auth-screen').or(page.getByText(/Finishing sign in|Sign in failed/i)).first(),
  ).toBeVisible({ timeout: 15_000 })
  assertNoUnexpectedErrors(pageErrors, '/auth/oauth/callback')
}

export async function smokeVisitDemo(page: Page, path: string): Promise<void> {
  const pageErrors = trackPageErrors(page)

  const response = await gotoReliable(page, path)
  expect(response?.status() ?? 0, `${path} HTTP status`).toBeLessThan(500)

  await expect(page.locator('.demo-screens-root').first()).toBeVisible({ timeout: 15_000 })
  assertNoUnexpectedErrors(pageErrors, path)
}

export async function smokeVisitEmbed(page: Page, path: string): Promise<void> {
  const pageErrors = trackPageErrors(page)

  const response = await gotoReliable(page, path)
  expect(response?.status() ?? 0, `${path} HTTP status`).toBeLessThan(500)

  await expect(page.locator('.embed-page').first()).toBeVisible({ timeout: 15_000 })
  assertNoUnexpectedErrors(pageErrors, path)
}

export async function smokeVisitPortal(page: Page, path: string): Promise<void> {
  const pageErrors = trackPageErrors(page)

  const response = await gotoReliable(page, path)
  expect(response?.status() ?? 0, `${path} HTTP status`).toBeLessThan(500)

  await expect(page.locator('.portal-root').first()).toBeVisible({ timeout: 15_000 })
  assertNoUnexpectedErrors(pageErrors, path)
}

export interface SmokeVisitOperatorOptions {
  allowOnboardingRedirect?: boolean
}

export async function smokeVisitOperator(
  page: Page,
  path: string,
  options?: SmokeVisitOperatorOptions,
): Promise<void> {
  const pageErrors = trackPageErrors(page)

  const response = await gotoReliable(page, path)
  expect(response?.status() ?? 0, `${path} HTTP status`).toBeLessThan(500)

  const url = page.url()
  expect(url, `${path} should not redirect to auth`).not.toContain('/auth')

  if (!options?.allowOnboardingRedirect) {
    expect(url, `${path} should not redirect to onboarding`).not.toContain('/onboarding')
  }

  await waitForAppShell(page)
  assertNoUnexpectedErrors(pageErrors, path)
}

export async function smokeVisitAdmin(page: Page): Promise<void> {
  const pageErrors = trackPageErrors(page)

  const response = await gotoReliable(page, '/admin')
  expect(response?.status() ?? 0, '/admin HTTP status').toBeLessThan(500)
  expect(page.url()).not.toContain('/auth')

  await expect(
    page.locator('.admin-root, .admin-page, .legal-page, .settings-screen--loading').first(),
  ).toBeVisible({ timeout: 15_000 })
  assertNoUnexpectedErrors(pageErrors, '/admin')
}
