import assert from 'node:assert/strict'
import { chromium } from '../rinse-api/node_modules/playwright/index.mjs'
import PocketBase from '../rinse-api/node_modules/pocketbase/dist/pocketbase.es.mjs'
const origin = process.env.LANDING_TEST_URL || 'http://127.0.0.1:5008'
const api = process.env.API_TEST_URL || 'http://127.0.0.1:3108'
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):/)
assert.match(api, /^http:\/\/(localhost|127\.0\.0\.1):/)
const browser = await chromium.launch({ headless: true })
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.goto(origin)
    await page.getByRole('button', { name: 'Explore Rinse', exact: true }).click()
    await page.getByRole('dialog', { name: 'Add a client and vehicle' }).waitFor()
    assert.equal(await page.locator('#walkthrough-title').evaluate(el => el === document.activeElement), true)
    await page.getByRole('button', { name: 'Add sample client', exact: true }).click()
    await page.getByText('Alex Morgan · 2021 Toyota Corolla', { exact: true }).waitFor()
    for (let i = 0; i < 4; i++) {
      if (mobile) await page.getByRole('button', { name: 'Next', exact: true }).tap()
      else await page.keyboard.press('ArrowRight')
    }
    await page.getByRole('heading', { name: 'Upgrade when you need more' }).waitFor()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page.getByRole('heading', { name: 'See how customer payment works' }).waitFor()
    await page.getByRole('button', { name: 'Replay', exact: true }).click()
    await page.getByRole('heading', { name: 'Add a client and vehicle' }).waitFor()
    // Modal traps keyboard focus, and Escape restores the trigger.
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
    assert.equal(await page.locator('.walkthrough').evaluate(el => el.contains(document.activeElement)), true)
    await page.screenshot({ path: `/tmp/rinse-walkthrough-${mobile ? 'touch' : 'desktop'}.png` })
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('button', { name: 'Explore Rinse', exact: true }).evaluate(el => el === document.activeElement), true)
    await page.getByRole('button', { name: 'Join waitlist · Starter', exact: true }).click()
    assert.equal(await page.locator('select[name="interest"]').inputValue(), 'starter')
    const email = `prelaunch-${Date.now()}@example.com`
    await page.getByLabel('Email address').fill(email)
    await page.getByRole('button', { name: 'Join waitlist', exact: true }).click()
    await page.getByText('You’re on the iOS waitlist.', { exact: false }).waitFor()
    await page.getByRole('button', { name: 'Join waitlist', exact: true }).click()
    await page.getByText('You’re on the iOS waitlist.', { exact: false }).waitFor()
    const pb = new PocketBase('http://127.0.0.1:8099')
    await pb.collection('_superusers').authWithPassword('test@rinse.test', 'RinseLocalTestOnly123')
    const rows = await pb.collection('waitlist').getFullList({ filter: pb.filter('email = {:email}', { email }) })
    assert.equal(rows.length, 1); assert.equal(rows[0].interest, 'starter')
    await page.getByRole('button', { name: 'Close waitlist' }).click()
    assert.equal(await page.getByText('Works with your stack', { exact: true }).count(), 0)
    assert.equal(await page.locator('a[href*="desk.rinsehq.com"]').count(), 0)
    assert.equal(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth), true)
    assert.deepEqual(errors, [])
    console.log(`PASS: ${mobile ? 'touch' : 'desktop'} walkthrough, focus, replay, exit, waitlist persistence, duplicate handling, CTA interest`)
    await context.close()
  }
  const invalid = await fetch(`${api}/api/waitlist`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.18.0.99' }, body: JSON.stringify({ email: 'not-email', interest: 'free' }) })
  assert.equal(invalid.status, 400)
  for (const route of ['/api/stripe/webhook','/api/stripe/operator-webhook']) {
    const response = await fetch(api + route, { method:'POST', body:'{}' }); assert.notEqual(response.status, 200)
  }
  const retired = await fetch(api + '/settings/billing', { redirect: 'manual' }); assert.equal(retired.status, 307)
  console.log('PASS: invalid waitlist validation, unconfigured payment hooks fail closed, legacy billing route redirected')
} finally { await browser.close() }
