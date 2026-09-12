import { expect, test } from '@playwright/test'
import { setupOperatorContext, skipIfNoOperator } from '../helpers/fixtures'
import { getOperatorSession } from '../helpers/session'

function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

test.describe('Weather readiness', () => {
  test.beforeEach(async ({ context, request }, testInfo) => {
    if (!(await skipIfNoOperator(testInfo, request))) return
    await setupOperatorContext(context, request)
  })

  test('API returns a readiness payload for the signed-in operator', async ({ request }, testInfo) => {
    const session = await getOperatorSession(request)
    if (!session) {
      testInfo.skip(true, 'No operator session')
      return
    }

    const res = await request.post('/api/weather/readiness', {
      headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
      data: { today: localToday() },
    })

    expect(res.ok(), await res.text()).toBeTruthy()
    const body = (await res.json()) as { readiness?: { status?: string; rows?: unknown[] } }
    expect(body.readiness?.status).toMatch(/^(no_jobs|unresolved|partial|ready)$/)
    expect(Array.isArray(body.readiness?.rows)).toBe(true)
  })

  test('home shows Job readiness module after forecast loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.getByRole('link', { name: 'Jobs' }).waitFor({ state: 'visible', timeout: 30_000 })

    const card = page.getByRole('region', { name: 'Job readiness' })
    await expect(card).toBeVisible({ timeout: 45_000 })

    await expect
      .poll(
        async () => {
          const text = (await card.innerText()).trim()
          return text.length > 0 && !/^Loading/i.test(text)
        },
        { timeout: 45_000 },
      )
      .toBe(true)

    await expect(card).not.toContainText("Couldn't check the forecast right now")
  })
})
