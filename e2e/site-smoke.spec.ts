import { expect, test } from '@playwright/test'
import { resolveE2EData } from './helpers/demo-data'
import { setupOperatorContext, skipIfNoOperator } from './helpers/fixtures'
import {
  demoRoutes,
  embedRoutes,
  loadDemoManifest,
  operatorSmokeRoutes,
  staticPublicRoutes,
} from './helpers/routes'
import { getOperatorSession } from './helpers/session'
import {
  smokeVisitAdmin,
  smokeVisitDemo,
  smokeVisitEmbed,
  smokeVisitOAuthCallback,
  smokeVisitOperator,
  smokeVisitPortal,
  smokeVisitPublic,
} from './helpers/smoke'

const manifest = loadDemoManifest()
const manifestIds = manifest.ids ?? {}

async function visitOperatorRoute(page: import('@playwright/test').Page, route: string): Promise<void> {
  if (route === '/admin') {
    await smokeVisitAdmin(page)
    return
  }
  if (route.startsWith('/onboarding')) {
    await smokeVisitOperator(page, route, { allowOnboardingRedirect: true })
    return
  }
  await smokeVisitOperator(page, route)
}

test.describe('Site smoke — public', () => {
  for (const route of staticPublicRoutes(manifest)) {
    if (route === '/auth/oauth/callback') {
      test('loads /auth/oauth/callback', async ({ page }) => {
        await smokeVisitOAuthCallback(page)
      })
      continue
    }

    test(`loads ${route}`, async ({ page }) => {
      await smokeVisitPublic(page, route)
    })
  }
})

test.describe('Site smoke — demo screens', () => {
  for (const route of demoRoutes()) {
    test(`loads ${route}`, async ({ page }) => {
      await smokeVisitDemo(page, route)
    })
  }
})

test.describe('Site smoke — embed', () => {
  for (const route of embedRoutes(manifest)) {
    test(`loads ${route}`, async ({ page }) => {
      await smokeVisitEmbed(page, route)
    })
  }
})

test.describe('Site smoke — portal', () => {
  test('loads client portal', async ({ page, request }, testInfo) => {
    const session = await getOperatorSession(request)
    if (!session) {
      testInfo.skip(true, 'No operator session')
      return
    }

    const { portalPath } = await resolveE2EData(request, session)
    if (!portalPath) {
      testInfo.skip(true, 'Could not create portal token — set INTERNAL_API_SECRET and run dev server')
      return
    }

    await smokeVisitPortal(page, portalPath)
  })
})

test.describe('Site smoke — operator', () => {
  test.beforeAll(async ({ request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
  })

  test.beforeEach(async ({ context, request }, testInfo) => {
    const session = await getOperatorSession(request)
    if (!session) {
      testInfo.skip(true, 'No operator session')
      return
    }
    await setupOperatorContext(context, request)
  })

  for (const route of operatorSmokeRoutes(manifest, manifestIds)) {
    test(`loads ${route}`, async ({ page }) => {
      await visitOperatorRoute(page, route)
    })
  }

  test('loads PB-resolved routes', async ({ page, request }, testInfo) => {
    const session = await getOperatorSession(request)
    if (!session) {
      testInfo.skip(true, 'No operator session')
      return
    }

    const { ids } = await resolveE2EData(request, session)
    const resolvedOnly = operatorSmokeRoutes(manifest, ids).filter(
      (route) => !operatorSmokeRoutes(manifest, manifestIds).includes(route),
    )

    for (const route of resolvedOnly) {
      await test.step(`loads ${route}`, async () => {
        await visitOperatorRoute(page, route)
      })
    }
  })
})

test.describe('Site smoke — bottom nav', () => {
  test.beforeEach(async ({ context, request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    await setupOperatorContext(context, request)
  })

  test('primary tabs are reachable', async ({ page }) => {
    await smokeVisitOperator(page, '/')
    for (const label of ['Jobs', 'Clients', 'Business']) {
      await page.getByRole('link', { name: label }).click()
      await expect(page.locator('#main-content').first()).toBeVisible()
      expect(page.url()).not.toContain('/auth')
    }
  })
})
