import { expect, test } from '@playwright/test'
import { loadDemoManifest } from '../helpers/routes'
import { setupOperatorContext, skipIfNoOperator } from '../helpers/fixtures'

const manifest = loadDemoManifest()
const clientId = manifest.ids?.clientMarcusId || manifest.ids?.clientId

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
    if (await packageCard.isVisible()) {
      await packageCard.click()
    }

    const saveBtn = page.getByRole('button', { name: /Save job/i })
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 })
    await saveBtn.click()

    const suppliesConfirm = page.getByRole('button', { name: /Confirm & save/i })
    if (await suppliesConfirm.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await suppliesConfirm.click()
    }

    await page.waitForURL(/\/jobs\/[a-z0-9]+/, { timeout: 30_000 })
    await expect(page.locator('#main-content')).toBeVisible()
  })
})
