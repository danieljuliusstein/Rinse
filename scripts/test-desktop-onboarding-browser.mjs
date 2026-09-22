/** Requires disposable local PB/API and a Desk dev server pointed at them. */
import assert from 'node:assert/strict'
import PocketBase from '../rinse-api/node_modules/pocketbase/dist/pocketbase.es.mjs'
import { chromium } from '../rinse-api/node_modules/playwright/index.mjs'
const pbUrl = process.env.PB_TEST_URL || 'http://127.0.0.1:18099'
const apiUrl = process.env.API_TEST_URL || 'http://127.0.0.1:18080'
const deskUrl = process.env.DESK_TEST_URL || 'http://127.0.0.1:18443'
for (const url of [pbUrl, apiUrl, deskUrl]) assert.match(url, /^http:\/\/(127\.0\.0\.1|localhost):/)
const pb = new PocketBase(pbUrl); pb.autoCancellation(false)
await pb.collection('_superusers').authWithPassword('desktop-test@example.test', 'DesktopTestPassword123')
const suffix = Date.now().toString(36)
async function account(name, candidate = true) {
  const org = await pb.collection('organizations').create({ name, slug: `${name.toLowerCase().replaceAll(' ', '-')}-${suffix}`, plan: 'free', subscription_status: 'none' })
  if (!candidate) await pb.collection('organizations').update(org.id, { desktop_onboarding_candidate: false })
  const settings = await pb.collection('app_settings').create({ organization_id: org.id, business_name: name, onboarding_step: 3, timezone: 'America/New_York' })
  const user = await pb.collection('users').create({ email: `${org.id}@example.test`, password: 'DesktopTestPassword123', passwordConfirm: 'DesktopTestPassword123', organization_id: org.id, verified: true })
  const client = new PocketBase(pbUrl)
  const auth = await client.collection('users').authWithPassword(user.email, 'DesktopTestPassword123')
  return { org, settings, auth }
}
const fresh = await account('Browser Detail')
const existing = await account('Existing Detail', false)
const browser = await chromium.launch({ headless: true })
async function contextFor(auth) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  await context.addInitScript(({ token, record }) => {
    localStorage.setItem('rinse_desk_pb_token', token)
    localStorage.setItem('rinse_desk_pb_profile', JSON.stringify(record))
  }, auth)
  return context
}
try {
  const context = await contextFor(fresh.auth)
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('console', (message) => { if (message.type() === 'error') console.log('Browser:', message.text()) })
  page.on('response', (response) => { if (response.status() >= 400) console.log('HTTP', response.status(), response.url()) })
  const failures = []; page.on('pageerror', (e) => failures.push(e.message))
  await page.goto(deskUrl)
  await page.getByRole('heading', { name: 'Choose how you get started' }).waitFor().catch(async (error) => { console.log(await page.locator('body').innerText()); await page.screenshot({ path: '/tmp/rinse-desktop-failure.png' }); throw error })
  await page.screenshot({ path: '/tmp/rinse-desktop-plan.png', fullPage: true })
  await page.getByRole('button', { name: 'Continue with Free', exact: true }).click()
  await page.getByRole('heading', { name: 'Make this your business' }).waitFor()
  await page.reload()
  await page.getByRole('heading', { name: 'Make this your business' }).waitFor()
  await page.getByLabel('Business name', { exact: true }).fill('Browser Detail Ready')
  await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
  await page.getByRole('heading', { name: 'Prepare for your first job' }).waitFor()
  await page.getByLabel('Add a service', { exact: true }).check()
  await page.getByLabel('Service name', { exact: true }).fill('Full detail')
  await page.getByLabel('Price (USD)', { exact: true }).fill('150')
  await page.getByLabel('First client (optional)', { exact: true }).fill('Browser Client')
  await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
  await page.getByRole('heading', { name: 'Browser Detail Ready is ready' }).waitFor()
  await page.screenshot({ path: '/tmp/rinse-desktop-ready.png', fullPage: true })
  await page.getByRole('button', { name: 'Create your first job', exact: true }).click()
  await page.getByRole('heading', { name: 'New event', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByText('Free · 0 of 5 active jobs', { exact: true }).waitFor()
  assert.equal(await page.getByRole('heading', { name: 'Choose how you get started' }).count(), 0)
  await page.getByRole('button', { name: 'Upgrade in Settings', exact: true }).click()
  await page.getByText('Billing & plan', { exact: true }).waitFor()
  const after = await pb.collection('app_settings').getOne(fresh.settings.id)
  assert.equal(after.onboarding_step, 3); assert.equal(after.onboarding_completed_at, '')
  // A second browser resumes completed setup without a local completion flag.
  const second = await contextFor(fresh.auth); const secondPage = await second.newPage()
  await secondPage.goto(deskUrl)
  await secondPage.getByText('Free · 0 of 5 active jobs', { exact: true }).waitFor()
  const oldContext = await contextFor(existing.auth); const oldPage = await oldContext.newPage()
  await oldPage.goto(deskUrl)
  await oldPage.getByText('Free · 0 of 5 active jobs', { exact: true }).waitFor()
  // Cancellation remains on the plan step; a forged success query never grants paid access.
  const canceled = await account('Canceled Detail'); const cancelContext = await contextFor(canceled.auth); const cancelPage = await cancelContext.newPage()
  await cancelPage.goto(`${deskUrl}/?desktop_billing=cancel`)
  await cancelPage.getByText('Checkout was canceled. Continue with Free or try again.').waitFor()
  await cancelPage.goto(`${deskUrl}/?desktop_billing=success`)
  await cancelPage.getByText('Waiting for payment confirmation.', { exact: false }).waitFor()
  assert.equal((await pb.collection('organizations').getOne(canceled.org.id)).plan, 'free')
  await pb.collection('organizations').update(canceled.org.id, { plan: 'starter', subscription_status: 'active', current_period_end: '2035-01-01' })
  await cancelPage.getByRole('button', { name: 'Refresh plan and pricing' }).click()
  await cancelPage.getByRole('button', { name: 'Continue with your plan' }).waitFor()
  await cancelPage.getByRole('button', { name: 'Continue with your plan' }).click()
  await cancelPage.getByRole('button', { name: 'Save and continue', exact: true }).click()
  await cancelPage.getByRole('button', { name: 'Do this later', exact: true }).click()
  await cancelPage.getByRole('button', { name: 'Go to dashboard', exact: true }).click()
  await cancelPage.getByRole('button', { name: 'Dashboard', exact: true }).first().waitFor()
  await cancelPage.waitForFunction(() => !document.querySelector('[aria-label="Plan usage"]'))
  assert.deepEqual(failures, [])
  console.log('PASS: desktop Free setup, refresh/resume, real service/client creation, dashboard quota, cross-browser completion, existing-account exemption, canceled checkout, forged success ignored, confirmed paid refresh')
} finally { await browser.close() }
