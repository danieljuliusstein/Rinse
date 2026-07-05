import { expect, test } from '@playwright/test'
import { getE2ECredentials } from '../helpers/auth'
import { skipIfNoOperator } from '../helpers/fixtures'
import {
  installOnboardingSession,
  prepareNeedsOnboarding,
  restoreOnboardingSnapshot,
  type OnboardingSnapshot,
} from '../helpers/onboarding'
import { getOperatorSession } from '../helpers/session'

test.describe('Intro carousel', () => {
  test('loads the setup intro flow', async ({ page, context }) => {
    await context.clearCookies()
    await page.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    await page.goto('/intro', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.locator('.ob-flow').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /Skip/i }).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})

test.describe('Onboarding flows', () => {
  test.describe.configure({ mode: 'serial' })

  let snapshot: OnboardingSnapshot | null = null

  test.beforeAll(async ({ request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    const session = await getOperatorSession(request)
    if (!session) return
    snapshot = await prepareNeedsOnboarding(request, session)
  })

  test.afterAll(async ({ request }) => {
    const session = await getOperatorSession(request)
    if (!session || !snapshot) return
    await restoreOnboardingSnapshot(request, session, snapshot)
  })

  test.beforeEach(async ({ context, request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    const session = await getOperatorSession(request)
    if (!session) {
      testInfo.skip(true, 'No operator session')
      return
    }
    await installOnboardingSession(context, session)
  })

  test('stays on onboarding after background sync (no auth loop)', async ({ page }) => {
    await page.goto('/onboarding?step=business', { waitUntil: 'domcontentloaded', timeout: 60_000 })

    await expect(page.locator('.onboarding-flow').first()).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(3_000)

    expect(page.url()).toContain('/onboarding')
    expect(page.url()).not.toContain('/welcome')
    expect(page.url()).not.toContain('/auth')
    await expect(page.locator('#ob-name, #ob-phone').first()).toBeVisible()
  })

  test('walks business → invoice → booking → plans and finishes on home', async ({ page }) => {
    await page.goto('/onboarding?step=business', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.locator('.onboarding-flow').first()).toBeVisible({ timeout: 30_000 })

    await page.locator('#ob-name').fill('Summit Mobile Detail')
    await page.locator('#ob-phone').fill('(404) 555-0142')
    await page.getByRole('button', { name: /^Continue$/i }).click()
    await page.waitForURL(/step=your-invoice/, { timeout: 30_000 })

    await page.getByRole('button', { name: /See my invoice/i }).click({ timeout: 30_000 })
    await expect(page.getByText('Your menu')).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /^Continue$/i }).click()
    await page.waitForURL(/step=booking/, { timeout: 30_000 })

    await expect(page.getByText(/booking link/i).first()).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /Continue|Finish setup/i }).click()
    await page.waitForURL(/step=plans/, { timeout: 30_000 })

    await expect(page.getByText('Your plan')).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /Start free trial/i }).click()

    await page.waitForURL((url) => url.pathname === '/', { timeout: 45_000 })
    await page.getByRole('link', { name: 'Jobs' }).waitFor({ state: 'visible', timeout: 30_000 })
    expect(page.url()).not.toContain('/onboarding')
  })
})

test.describe('Onboarding sign-in', () => {
  let snapshot: OnboardingSnapshot | null = null

  test.beforeAll(async ({ request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    const session = await getOperatorSession(request)
    if (!session) return
    snapshot = await prepareNeedsOnboarding(request, session)
  })

  test.afterAll(async ({ request }) => {
    const session = await getOperatorSession(request)
    if (!session || !snapshot) return
    await restoreOnboardingSnapshot(request, session, snapshot)
  })

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    const session = await getOperatorSession(request)
    if (!session) return
    await prepareNeedsOnboarding(request, session)
  })

  test('password sign-in lands on onboarding when setup is incomplete', async ({ page, context, request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return

    await context.clearCookies()
    await page.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 45_000 })

    const { email, password } = getE2ECredentials()
    await page.locator('#auth-email').fill(email)
    await page.locator('#auth-password').fill(password)
    await page.getByRole('button', { name: /^Sign in$/i }).click()

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 45_000 })
    await expect(page.locator('.onboarding-flow').first()).toBeVisible({ timeout: 30_000 })
  })
})
