import { expect, test } from '@playwright/test'
import { getAdminSession, getAdminSessionSkipReason } from './helpers/admin-session'
import { installPocketBaseSession } from './helpers/auth'
import { loadDemoManifest } from './helpers/routes'
import { smokeVisitAdmin } from './helpers/smoke'

const manifest = loadDemoManifest()

test.describe('Admin lane', () => {
  test.beforeEach(async ({ context, request }, testInfo) => {
    const session = await getAdminSession(request)
    if (!session) {
      testInfo.skip(true, getAdminSessionSkipReason() ?? 'No platform admin session — run npm run admin:account')
      return
    }
    await installPocketBaseSession(context, session)
  })

  test('lands on /admin without bottom nav after auth', async ({ page }) => {
    await smokeVisitAdmin(page)
    await expect(page.locator('.bottom-nav')).toHaveCount(0)
    await expect(page.locator('.admin-root').first()).toBeVisible()
  })

  test('redirects operator routes back to /admin', async ({ page }) => {
    await smokeVisitAdmin(page)
    await page.goto('/jobs', { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.locator('.bottom-nav')).toHaveCount(0)
  })

  test('allows public booking while in admin lane', async ({ page }) => {
    await smokeVisitAdmin(page)
    await page.goto(`/book/${manifest.orgSlug}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await expect(page).toHaveURL(new RegExp(`/book/${manifest.orgSlug}`))
    await expect(page.locator('.book-body, .client-light-root').first()).toBeVisible({ timeout: 20_000 })
  })

  test('logout returns to /auth/admin', async ({ page }) => {
    await smokeVisitAdmin(page)
    await page.locator('.topbar-user').first().click()
    await expect(page).toHaveURL(/\/auth\/admin/)
  })
})
