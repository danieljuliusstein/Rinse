import { expect, test } from '@playwright/test'
import { setupOperatorContext, skipIfNoOperator } from '../helpers/fixtures'

test.describe('Create client flow', () => {
  test.beforeEach(async ({ context, request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    await setupOperatorContext(context, request)
  })

  test('creates a client from /clients/new', async ({ page }) => {
    const uniqueName = `E2E Client ${Date.now()}`

    await page.goto('/clients/new', { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await expect(page.locator('#client-name')).toBeVisible({ timeout: 15_000 })

    await page.locator('#client-name').fill(uniqueName)
    await page.locator('#client-phone').fill('555-0100')

    await page.getByRole('button', { name: /Create client/i }).click()

    await page.waitForURL(/\/clients\/[a-z0-9]+/, { timeout: 30_000 })
    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page.locator('.client-detail__name')).toContainText(uniqueName, { timeout: 15_000 })
  })
})
