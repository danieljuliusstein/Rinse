import { test, expect } from '@playwright/test'
import {
  FUNNEL_AUDIT_CAPTURES,
  ONBOARDING_AUDIT_CAPTURES,
  OPERATOR_AUDIT_CAPTURES,
  PWA_PARITY_CAPTURES,
  type AuditCapture,
} from './audit-manifest'
import {
  createVisualTestSession,
  ensureOnboardingComplete,
  type VisualTestSession,
} from './helpers/session'
import {
  captureAuditScreen,
  diffRatioForCapture,
  injectNativeAuth,
  waitForOperatorShell,
  withScreenshotQuery,
} from './helpers/visual'

let session: VisualTestSession

test.beforeAll(async () => {
  session = await createVisualTestSession()
})

async function assertAuditScreenshot(
  page: import('@playwright/test').Page,
  capture: AuditCapture,
  testInfo: import('@playwright/test').TestInfo,
): Promise<void> {
  if (capture.requiresEntity) {
    const id =
      capture.requiresEntity === 'job'
        ? session.entities.jobId
        : capture.requiresEntity === 'client'
          ? session.entities.clientId
          : session.entities.invoiceId
    if (!id) {
      testInfo.skip(true, `No ${capture.requiresEntity} in test org`)
      return
    }
  }

  await captureAuditScreen(page, capture, session)

  await expect(page).toHaveScreenshot(capture.file, {
    maxDiffPixelRatio: diffRatioForCapture(capture),
  })
}

test.describe('Native visual audit — operator', () => {
  test.beforeEach(async ({ page }) => {
    await injectNativeAuth(page, session)
    await page.goto(withScreenshotQuery('/'), { waitUntil: 'domcontentloaded' })
    await waitForOperatorShell(page)
  })

  for (const capture of OPERATOR_AUDIT_CAPTURES) {
    test(`matches baseline ${capture.file}`, async ({ page }, testInfo) => {
      await assertAuditScreenshot(page, capture, testInfo)
    })
  }
})

test.describe('Native visual audit — funnel', () => {
  for (const capture of FUNNEL_AUDIT_CAPTURES) {
    test(`matches baseline ${capture.file}`, async ({ page }, testInfo) => {
      await assertAuditScreenshot(page, capture, testInfo)
    })
  }
})

test.describe('Native visual audit — onboarding', () => {
  test.afterAll(async () => {
    await ensureOnboardingComplete(session.pb, session.orgId)
  })

  for (const capture of ONBOARDING_AUDIT_CAPTURES) {
    test(`matches baseline ${capture.file}`, async ({ page }, testInfo) => {
      await assertAuditScreenshot(page, capture, testInfo)
    })
  }
})

test.describe('Native vs PWA audit — loose parity', () => {
  test.beforeEach(async ({ page }) => {
    await injectNativeAuth(page, session)
    await page.goto(withScreenshotQuery('/'), { waitUntil: 'domcontentloaded' })
    await waitForOperatorShell(page)
  })

  for (const shot of PWA_PARITY_CAPTURES) {
    test(`loosely matches PWA ${shot.pwaFile}`, async ({ page }, testInfo) => {
      const { existsSync } = await import('node:fs')
      const { join } = await import('node:path')
      const { PWA_BASELINE_DIR } = await import('./helpers/visual')
      const baselinePath = join(PWA_BASELINE_DIR, shot.pwaFile)
      if (!existsSync(baselinePath)) {
        testInfo.skip(true, `Missing PWA baseline ${shot.pwaFile}`)
        return
      }

      const capture: AuditCapture = {
        file: shot.nativeFile,
        kind: 'route',
        path: shot.path,
        dynamic: shot.dynamic,
      }

      await captureAuditScreen(page, capture, session)

      await expect(page).toHaveScreenshot(shot.pwaFile, {
        maxDiffPixelRatio: diffRatioForCapture(shot, true),
      })
    })
  }
})
