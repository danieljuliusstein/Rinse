import { expect, test } from '@playwright/test'
import { loadDemoManifest } from '../helpers/routes'

const manifest = loadDemoManifest()

test.describe('Public booking flow', () => {
  test('walks through booking steps without submitting', async ({ page }) => {
    await page.goto(`/book/${manifest.orgSlug}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.locator('.book-body').first()).toBeVisible({ timeout: 45_000 })

    const firstPackage = page.locator('.book-package-list .book-package-card, .book-package-card').first()
    await expect(firstPackage).toBeVisible({ timeout: 30_000 })
    await firstPackage.click()

    await page.getByRole('button', { name: /Continue/i }).click()
    await expect(page.getByText('Step 2 of 3')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.book-day-chip').first()).toBeVisible()

    const dayChips = page.locator('.book-day-chip')
    const dayCount = await dayChips.count()
    let reachedStep3 = false

    for (let i = 0; i < Math.min(dayCount, 14); i++) {
      await dayChips.nth(i).click()
      await expect(page.locator('.book-slots-grid, .book-slots-empty, .book-lead').first()).toBeVisible({
        timeout: 5_000,
      })
      const slot = page.locator('button.book-slot').first()
      if (!(await slot.isVisible({ timeout: 3_000 }).catch(() => false))) continue

      await slot.click()
      const continueBtn = page.getByRole('button', { name: /Continue/i })
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 })
      await continueBtn.click()
      await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 10_000 })
      reachedStep3 = true
      break
    }

    if (reachedStep3) {
      await expect(page.locator('.book-step-card').first()).toBeVisible()
      return
    }

    // Demo calendar may be fully booked — step 2 still proves the flow loads.
    await expect(
      page.locator('.book-slots-empty, .book-slots-grid, .book-lead').first(),
    ).toBeVisible()
  })

  test('loads deep-linked booking URL from manifest', async ({ page }) => {
    const deep = manifest.routes.bookingDeep
    test.skip(!deep, 'No bookingDeep route in manifest')

    await page.goto(deep!, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page.locator('.book-body').first()).toBeVisible({ timeout: 15_000 })
  })
})
