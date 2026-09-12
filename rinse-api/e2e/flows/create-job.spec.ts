import { expect, test } from '@playwright/test'
import { loadDemoManifest } from '../helpers/routes'
import { setupOperatorContext, skipIfNoOperator } from '../helpers/fixtures'

const manifest = loadDemoManifest()
const clientId = manifest.ids?.clientMarcusId || manifest.ids?.clientId

async function confirmSuppliesIfNeeded(page: import('@playwright/test').Page): Promise<void> {
  const confirm = page.getByRole('button', { name: /Confirm & save/i })
  try {
    await confirm.waitFor({ state: 'visible', timeout: 20_000 })
    await confirm.click()
  } catch {
    // Supplies sheet not shown for this org/settings.
  }
}

function futureDate(daysAhead = 2): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

test.describe('Create job flow', () => {
  test.beforeEach(async ({ context, request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    await setupOperatorContext(context, request)
  })

  test('creates a job from /jobs/new', async ({ page }) => {
    const query = clientId ? `?clientId=${clientId}` : ''
    await page.goto(`/jobs/new${query}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })

    await expect(page.locator('.new-job').first()).toBeVisible({ timeout: 15_000 })

    if (!clientId) {
      const firstClient = page.locator('.new-job-client-option').first()
      await expect(firstClient).toBeVisible({ timeout: 15_000 })
      await firstClient.click()
    }

    const packageCard = page.locator('.new-job-package-card').first()
    await expect(packageCard).toBeVisible({ timeout: 15_000 })
    await packageCard.click()

    const saveBtn = page.getByRole('button', { name: /Save job/i })
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 })
    await saveBtn.click()
    await confirmSuppliesIfNeeded(page)

    await expect(page).toHaveURL(/\/jobs\/(?!new)[a-z0-9]+/, { timeout: 45_000 })
    await expect(page.locator('.new-job-error')).toHaveCount(0)
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('schedules future Quick Add jobs instead of marking them completed', async ({ page }, testInfo) => {
    if (!clientId) {
      testInfo.skip(true, 'Requires demo client id in manifest')
      return
    }

    const date = futureDate(2)
    await page.goto(`/jobs/new?clientId=${clientId}&date=${date}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })

    await expect(page.locator('.new-job').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('#nj-date')).toHaveValue(date, { timeout: 10_000 })

    const packageCard = page.locator('.new-job-package-card').first()
    await expect(packageCard).toBeVisible({ timeout: 15_000 })
    await packageCard.click()

    const saveBtn = page.getByRole('button', { name: /Save job/i })
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 })
    await saveBtn.click()
    await confirmSuppliesIfNeeded(page)

    await expect(page).toHaveURL(/\/jobs\/(?!new)[a-z0-9]+/, { timeout: 45_000 })
    await expect(page.locator('.badge-status').first()).toContainText('scheduled', { timeout: 20_000 })
  })
})
