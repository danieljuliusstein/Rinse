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

  test('profile menu opens without logging out', async ({ page }) => {
    await smokeVisitAdmin(page)
    await page.locator('.topbar-user').first().click()
    await expect(page.locator('.topbar-user-menu')).toBeVisible()
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.locator('.topbar-user-menu-item', { hasText: 'Account settings' })).toBeVisible()
    await expect(page.locator('.topbar-user-menu-item', { hasText: 'Sign out' })).toBeVisible()
  })

  test('signup sparkline loads on overview', async ({ page }) => {
    await smokeVisitAdmin(page)
    await expect(page.getByText('Signups, last 30 days')).toBeVisible()
    await expect(page.locator('.sparkline-badge')).not.toHaveText('Coming soon')
    await expect
      .poll(async () => {
        const text = await page.locator('.sparkline-card .kpi-sub').first().textContent()
        return text?.includes('Loading') ? null : text
      }, { timeout: 20_000 })
      .not.toBeNull()
  })

  test('audit log view loads events', async ({ page }) => {
    await smokeVisitAdmin(page)
    await page.goto('/admin?view=audit', { waitUntil: 'domcontentloaded', timeout: 30_000 })
    const auditView = page.locator('.admin-view.active')
    await expect(auditView.locator('.admin-page-title')).toHaveText('Audit log')
    await expect(auditView.getByText('Loading events…')).toHaveCount(0, { timeout: 20_000 })
    await expect(auditView.getByText('Org created').first()).toBeVisible({ timeout: 20_000 })
  })

  test('logout returns to /auth/admin', async ({ page }) => {
    await smokeVisitAdmin(page)
    await page.locator('.topbar-user').first().click()
    await expect(page.locator('.topbar-user-menu')).toBeVisible()
    await page.locator('.topbar-user-menu-item', { hasText: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/auth\/admin/, { timeout: 15_000 })
  })
})
