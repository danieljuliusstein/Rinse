import { expect, test } from '@playwright/test'
import { fetchAdminApi } from './helpers/admin-api'
import { getAdminSession, getAdminSessionSkipReason } from './helpers/admin-session'
import { installPocketBaseSession } from './helpers/auth'
import { setupOperatorContext, skipIfNoOperator } from './helpers/fixtures'
import { countPbPlatformEvents, hasPbSuperuserCredentials } from './helpers/pb-admin'
import { getOperatorSession } from './helpers/session'
import { smokeVisitAdmin, smokeVisitOperator } from './helpers/smoke'

const OPERATOR_ROUTES = ['/', '/jobs', '/clients', '/settings'] as const

test.describe('Operator app smoke', () => {
  test.beforeEach(async ({ context, request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    await setupOperatorContext(context, request)
  })

  for (const route of OPERATOR_ROUTES) {
    test(`loads ${route}`, async ({ page }) => {
      await smokeVisitOperator(page, route)
      await expect(page.locator('#main-content').first()).toBeVisible()
      if (route === '/' || route === '/jobs' || route === '/clients') {
        await expect(page.locator('.bottom-nav')).toBeVisible()
      }
    })
  }
})

test.describe('Admin analytics data', () => {
  test.beforeEach(async ({ context, request }, testInfo) => {
    const session = await getAdminSession(request)
    if (!session) {
      testInfo.skip(true, getAdminSessionSkipReason() ?? 'No platform admin session')
      return
    }
    await installPocketBaseSession(context, session)
  })

  test('events API matches PocketBase org_created records', async ({ request }, testInfo) => {
    if (!hasPbSuperuserCredentials()) {
      testInfo.skip(true, 'Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD for PB cross-check')
      return
    }

    const session = await getAdminSession(request)
    if (!session) {
      testInfo.skip(true, getAdminSessionSkipReason() ?? 'No platform admin session')
      return
    }

    const pbCount = await countPbPlatformEvents(request, 'type = "org_created"')
    expect(pbCount).not.toBeNull()

    const { ok, data } = await fetchAdminApi<{ events?: Array<Record<string, unknown>> }>(
      request,
      session,
      '/api/admin/events?limit=200&type=org_created',
    )
    expect(ok).toBe(true)

    const events = data.events ?? []
    expect(events.length).toBe(pbCount)
    for (const event of events) {
      expect(event.type).toBe('org_created')
      expect(event.category).toBe('product')
      expect(String(event.detail ?? '')).toMatch(/\(\/[a-z0-9-]+\)/)
    }
  })

  test('signup metrics API returns a 30-day series', async ({ request }, testInfo) => {
    const session = await getAdminSession(request)
    if (!session) {
      testInfo.skip(true, getAdminSessionSkipReason() ?? 'No platform admin session')
      return
    }

    const { ok, data } = await fetchAdminApi<{
      days?: number
      total?: number
      series?: { date: string; count: number }[]
    }>(request, session, '/api/admin/metrics/signups?days=30')

    expect(ok).toBe(true)
    expect(data.days).toBe(30)
    expect(typeof data.total).toBe('number')
    expect(data.series).toHaveLength(30)
    for (const point of data.series ?? []) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(typeof point.count).toBe('number')
      expect(point.count).toBeGreaterThanOrEqual(0)
    }
  })

  test('admin overview KPIs match orgs API summary', async ({ page, request }, testInfo) => {
    const session = await getAdminSession(request)
    if (!session) {
      testInfo.skip(true, getAdminSessionSkipReason() ?? 'No platform admin session')
      return
    }

    const { ok, data } = await fetchAdminApi<{
      summary?: {
        total: number
        active: number
        trialing: number
        past_due: number
        founding: number
      }
    }>(request, session, '/api/admin/orgs')

    expect(ok).toBe(true)
    const summary = data.summary
    expect(summary).toBeTruthy()

    await smokeVisitAdmin(page)

    const kpi = (label: string) =>
      page.locator('.kpi-card', { hasText: label }).locator('.kpi-value')

    await expect(kpi('Total orgs')).toHaveText(String(summary!.total), { timeout: 20_000 })
    await expect(kpi('Active')).toHaveText(String(summary!.active))
    await expect(kpi('Trialing')).toHaveText(String(summary!.trialing))
    await expect(kpi('Past due')).toHaveText(String(summary!.past_due))
    await expect(kpi('Founding members')).toHaveText(String(summary!.founding))
  })

  test('audit log UI rows match events API', async ({ page, request }, testInfo) => {
    const session = await getAdminSession(request)
    if (!session) {
      testInfo.skip(true, getAdminSessionSkipReason() ?? 'No platform admin session')
      return
    }

    const { ok, data } = await fetchAdminApi<{ events?: Array<{ type: string; detail: string | null }> }>(
      request,
      session,
      '/api/admin/events?limit=100',
    )
    expect(ok).toBe(true)
    const apiEvents = data.events ?? []
    expect(apiEvents.length).toBeGreaterThan(0)

    await page.goto('/admin?view=audit', { waitUntil: 'domcontentloaded', timeout: 30_000 })
    const auditView = page.locator('.admin-view.active')
    await expect(auditView.getByText('Loading events…')).toHaveCount(0, { timeout: 20_000 })

    const first = apiEvents[0]
    if (first.detail) {
      await expect(auditView.getByText(first.detail, { exact: false }).first()).toBeVisible()
    }
    await expect(auditView.locator('.admin-table tbody tr')).toHaveCount(
      Math.min(apiEvents.length, 100),
    )
  })
})

test.describe('Operator → platform event logging', () => {
  test('track API writes onboarding event visible in admin audit', async ({ request }, testInfo) => {
    const operatorSession = await getOperatorSession(request)
    if (!operatorSession) {
      testInfo.skip(true, 'No operator session')
      return
    }

    const adminSession = await getAdminSession(request)
    if (!adminSession) {
      testInfo.skip(true, getAdminSessionSkipReason() ?? 'No platform admin session')
      return
    }

    const marker = `e2e-smoke-${Date.now()}`
    const trackRes = await request.post('/api/platform/track', {
      headers: {
        Authorization: `Bearer ${operatorSession.token}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'onboarding_step_viewed',
        metadata: { step: 'business', marker },
      },
    })
    expect(trackRes.ok()).toBe(true)

    await expect
      .poll(
        async () => {
          const { ok, data } = await fetchAdminApi<{ events?: Array<{ metadata?: Record<string, unknown> }> }>(
            request,
            adminSession,
            '/api/admin/events?limit=50&type=onboarding_step_viewed',
          )
          if (!ok) return null
          return (data.events ?? []).some((event) => event.metadata?.marker === marker)
        },
        { timeout: 20_000 },
      )
      .toBe(true)
  })
})
