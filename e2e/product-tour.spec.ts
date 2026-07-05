import { expect, test } from '@playwright/test'
import { installPocketBaseSession } from './helpers/auth'
import { skipIfNoOperator } from './helpers/fixtures'
import { getOperatorSession } from './helpers/session'
import {
  advanceTourToEnd,
  isTourMarkedCompleted,
  startTourFromHome,
} from './helpers/tour'

test.describe('Product tour', () => {
  test.beforeAll(async ({ request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
  })

  test.beforeEach(async ({ context, request }, testInfo) => {
    const session = await getOperatorSession(request)
    if (!session) {
      testInfo.skip(true, 'No operator session')
      return
    }
    await installPocketBaseSession(context, session)
  })

  test('walks six steps, lands on home, and does not restart', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.getByRole('link', { name: 'Jobs' }).waitFor({ state: 'visible', timeout: 30_000 })

    await startTourFromHome(page)
    await expect(page.locator('#rinse-tour-title')).toHaveText('Welcome to Rinse')
    await expect(page.locator('.rinse-tour__progress')).toContainText('1 of 6')

    await advanceTourToEnd(page, 6)

    await expect(page.locator('.rinse-tour')).toHaveCount(0, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/$/)
    await expect.poll(() => isTourMarkedCompleted(page)).toBe(true)

    await page.waitForTimeout(2500)
    await expect(page.locator('.rinse-tour')).toHaveCount(0)
    await expect(page.locator('.tour-welcome-root')).toHaveCount(0)
  })

  test('Escape ends the tour without leaving it pending', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.getByRole('link', { name: 'Jobs' }).waitFor({ state: 'visible', timeout: 30_000 })

    await startTourFromHome(page)
    await page.keyboard.press('Escape')

    await expect(page.locator('.rinse-tour')).toHaveCount(0, { timeout: 10_000 })
    await expect.poll(() => isTourMarkedCompleted(page)).toBe(true)
  })
})
