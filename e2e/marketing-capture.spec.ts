/**
 * Capture marketing screenshots:
 * - Operator UI from rinse-mobile (Expo web)
 * - Customer booking + portal from live rinsehq.com (public pages)
 *
 * Usage:
 *   npm run marketing:capture
 *   npm run marketing:export
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'
import { MARKETING_CAPTURES, type MarketingCapture } from './marketing-manifest'
import { createVisualTestSession, type VisualTestSession } from './helpers/session'
import {
  injectNativeAuth,
  waitForOperatorShell,
  withScreenshotQuery,
} from './helpers/visual'

const OUT_DIR = join(process.cwd(), 'marketing/raw/screenshots')

function resolveMarketingTarget(
  capture: MarketingCapture,
  session: VisualTestSession,
): { kind: 'operator' | 'customer'; url: string } | null {
  if (capture.lane === 'customer') {
    let url = capture.absoluteUrl ?? ''
    if (capture.requiresEntity === 'booking') {
      if (!session.customer.bookingUrl) return null
      url = session.customer.bookingUrl
    }
    if (capture.requiresEntity === 'portal') {
      if (!session.customer.portalUrl) return null
      url = session.customer.portalUrl
    }
    url = url
      .replace('__BOOKING_URL__', session.customer.bookingUrl ?? '')
      .replace('__PORTAL_URL__', session.customer.portalUrl ?? '')
    if (!url.startsWith('http')) return null
    return { kind: 'customer', url }
  }

  let path = capture.path
  if (!path) return null
  if (capture.requiresEntity === 'job') {
    if (!session.entities.jobId) return null
    path = path.replace('__JOB_ID__', session.entities.jobId)
  }
  if (capture.requiresEntity === 'photoJob') {
    const id = session.entities.photoJobId ?? session.entities.jobId
    if (!id) return null
    path = path.replace('__PHOTO_JOB_ID__', id)
  }
  if (capture.requiresEntity === 'invoice') {
    if (!session.entities.invoiceId) return null
    path = path.replace('__INVOICE_ID__', session.entities.invoiceId)
  }
  return { kind: 'operator', url: withScreenshotQuery(path) }
}

test.describe('Native marketing capture', () => {
  test.describe.configure({ mode: 'serial' })

  let session: VisualTestSession

  test.beforeAll(async () => {
    mkdirSync(OUT_DIR, { recursive: true })
    session = await createVisualTestSession()
    if (!session.customer.bookingUrl) {
      console.warn('[marketing] No booking URL — 08-booking-step1.png will skip')
    }
    if (!session.customer.portalUrl) {
      console.warn('[marketing] No portal URL — 10-portal.png will skip (need invoice/client + API)')
    }
  })

  for (const capture of MARKETING_CAPTURES) {
    test(`capture ${capture.file}`, async ({ page }, testInfo) => {
      const target = resolveMarketingTarget(capture, session)
      if (!target) {
        testInfo.skip(true, `Missing data for ${capture.file}`)
        return
      }

      if (target.kind === 'operator') {
        await injectNativeAuth(page, session)
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await waitForOperatorShell(page)
      } else {
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await page.waitForLoadState('networkidle').catch(() => {})
      }

      if (capture.ready) {
        await expect(page.locator(capture.ready).first())
          .toBeVisible({ timeout: 20_000 })
          .catch(() => {
            console.warn(`[marketing] ready selector soft-miss: ${capture.ready}`)
          })
      }

      if (capture.kind === 'fab') {
        await page.getByRole('button', { name: 'Quick actions' }).click({ timeout: 10_000 })
        await page.waitForTimeout(500)
      }

      await page.waitForTimeout(700)

      const dest = join(OUT_DIR, capture.file)
      await page.screenshot({ path: dest, fullPage: false })
      console.log(`  ✓ ${capture.file} → ${dest}`)
    })
  }
})
