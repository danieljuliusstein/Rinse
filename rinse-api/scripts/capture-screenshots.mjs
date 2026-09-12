#!/usr/bin/env node
/**
 * Capture marketing screenshots via Playwright.
 * Reads marketing/demo-manifest.json — run npm run seed:demo first.
 *
 * Usage: npm run capture:screenshots
 */

import { existsSync, readFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { chromium, devices } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'marketing', 'demo-manifest.json')
const outDir = join(root, 'marketing', 'raw', 'screenshots')

const envPath = join(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

if (!existsSync(manifestPath)) {
  console.error('Missing marketing/demo-manifest.json — run: npm run seed:demo')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const APP_URL = (process.env.APP_URL || manifest.appUrl || 'http://127.0.0.1:3000').replace(/\/$/, '')
const EMAIL =
  process.env.DEMO_CAPTURE_EMAIL ||
  process.env.PB_EMAIL ||
  process.env.NEXT_PUBLIC_PB_EMAIL
const PASSWORD =
  process.env.DEMO_CAPTURE_PASSWORD ||
  process.env.PB_PASSWORD ||
  process.env.NEXT_PUBLIC_PB_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('Set DEMO_CAPTURE_EMAIL/PASSWORD or PB_EMAIL/PB_PASSWORD')
  process.exit(1)
}

const iphone = devices['iPhone 13 Pro']
const viewport = manifest.capture?.viewport ?? { width: 390, height: 844, deviceScaleFactor: 3 }

const SHOTS = [
  { file: '01-home.png', path: manifest.routes.home, auth: true },
  { file: '02-jobs.png', path: manifest.routes.jobs, auth: true },
  { file: '03-job-detail.png', path: manifest.routes.jobDetail, auth: true },
  { file: '04-job-photos.png', path: manifest.routes.jobPhotos, auth: true },
  { file: '05-client.png', path: manifest.routes.client, auth: true },
  { file: '06-reports.png', path: manifest.routes.reports, auth: true },
  { file: '07-pipeline.png', path: manifest.routes.pipeline, auth: true },
  { file: '08-booking-step1.png', path: manifest.routes.booking, auth: false },
  { file: '09-booking-step3.png', path: manifest.routes.bookingDeep, auth: false },
  { file: '10-portal.png', path: manifest.routes.portal, auth: false, skipIf: !manifest.routes.portal },
  { file: '12-settings-booking.png', path: manifest.routes.settingsBusiness, auth: true },
]

async function dismissTour(page) {
  await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('pocketbase_auth')
      if (!raw) return
      const auth = JSON.parse(raw)
      const userId = auth?.record?.id
      if (!userId) return
      localStorage.setItem(`detailing_product_tour_completed_${userId}`, '1')
      localStorage.removeItem(`detailing_product_tour_pending_${userId}`)
      sessionStorage.removeItem(`detailing_product_tour_replay_${userId}`)
    } catch {
      /* ignore */
    }
  })
}

async function login(page) {
  await page.goto(`${APP_URL}/auth`, { waitUntil: 'networkidle', timeout: 60000 })
  const email = page.locator('#auth-email, input[type="email"]').first()
  const password = page.locator('#auth-password, input[type="password"]').first()
  await email.waitFor({ state: 'visible', timeout: 15000 })
  await email.fill(EMAIL)
  await password.fill(PASSWORD)
  await page.locator('form.auth-form button[type="submit"], form button[type="submit"]').first().click()
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 30000 })
  await dismissTour(page)
  await page.waitForTimeout(800)
}

async function capture(page, url, file) {
  await page.goto(`${APP_URL}${url}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(500)
  const dest = join(outDir, file)
  await page.screenshot({ path: dest, fullPage: false })
  console.log(`  ✓ ${file}`)
}

async function captureFabMenu(page) {
  await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await dismissTour(page)
  const fab = page.locator('[data-tour="fab"] button, .bottom-nav-fab-link').first()
  await fab.click({ timeout: 10000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(outDir, '11-fab-menu.png'), fullPage: false })
  console.log('  ✓ 11-fab-menu.png')
}

async function main() {
  mkdirSync(outDir, { recursive: true })
  console.log(`Capturing to ${outDir}`)
  console.log(`App: ${APP_URL}\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    ...iphone,
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor ?? 3,
  })
  const page = await context.newPage()

  const publicShots = SHOTS.filter((s) => !s.auth && !s.skipIf)
  const authShots = SHOTS.filter((s) => s.auth)

  for (const shot of publicShots) {
    await capture(page, shot.path, shot.file)
  }

  await login(page)

  for (const shot of authShots) {
    await capture(page, shot.path, shot.file)
  }

  try {
    await captureFabMenu(page)
  } catch (err) {
    console.warn('  ⚠ 11-fab-menu.png skipped:', err.message)
  }

  await browser.close()
  console.log(`\nDone — ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
