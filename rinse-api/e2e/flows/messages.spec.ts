import { expect, test } from '@playwright/test'
import { setupOperatorContext, skipIfNoOperator } from '../helpers/fixtures'

test.describe('Messages flow', () => {
  test.beforeEach(async ({ context, request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    await setupOperatorContext(context, request)
  })

  test('loads sent messages without API errors', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto('/messages', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 30_000 })

    await expect
      .poll(async () => page.locator('.messages-screen, .screen-message, .ui-empty-state').first().isVisible(), {
        timeout: 30_000,
      })
      .toBe(true)

    const unexpected = pageErrors.filter(
      (msg) => !/missing collection|collection context|invalid sort field/i.test(msg),
    )
    expect(unexpected).toEqual([])
  })
})
