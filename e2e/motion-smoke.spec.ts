import { test, expect } from '@playwright/test'
import { createVisualTestSession, type VisualTestSession } from './helpers/session'
import { captureMotionFrames, motionDeadlineMs, pollUntil } from './helpers/motion'
import { injectNativeAuth, waitForOperatorShell } from './helpers/visual'

let session: VisualTestSession

test.beforeAll(async () => {
  session = await createVisualTestSession()
})

test.describe('Motion smoke', () => {
  test.beforeEach(async ({ page }) => {
    await injectNativeAuth(page, session)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForOperatorShell(page)
  })

  test('quick actions menu opens and closes on cadence', async ({ page }) => {
    const fab = page.getByRole('button', { name: 'Quick actions' })
    const newJob = page.getByRole('menuitem', { name: 'New job' })

    await expect(fab).toBeVisible()
    await expect(newJob).toHaveCount(0)

    await fab.click()

    await captureMotionFrames(page, 'fab-open', [0, 80, 160, 280, 400])

    const opened = await pollUntil(async () => (await newJob.count()) > 0, {
      timeoutMs: motionDeadlineMs('fab'),
    })
    expect(opened).toBe(true)
    await expect(page.getByText('Quick actions', { exact: true })).toBeVisible()

    await page.getByRole('dialog').getByLabel('Close quick actions').click()

    const closed = await pollUntil(async () => (await newJob.count()) === 0, {
      timeoutMs: motionDeadlineMs('fab'),
    })
    expect(closed).toBe(true)
  })

  test('AppSheet route mounts title and close control', async ({ page }) => {
    await page.goto('/jobs/new', { waitUntil: 'domcontentloaded' })

    await captureMotionFrames(page, 'sheet-enter', [0, 100, 200, 350, 500])

    const title = page.getByText('New job', { exact: true })
    const appeared = await pollUntil(async () => (await title.count()) > 0, {
      timeoutMs: motionDeadlineMs('sheet'),
    })
    expect(appeared).toBe(true)

    await expect(page.getByLabel('Close', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Close sheet')).toBeVisible()
  })

  test('jobs list surfaces rows after stagger window', async ({ page }) => {
    if (!session.entities.jobId) {
      test.skip(true, 'Test org has no jobs — cannot assert list stagger')
      return
    }

    await page.goto('/jobs', { waitUntil: 'domcontentloaded' })
    await waitForOperatorShell(page)

    const empty = page.getByText('No jobs found')

    const loaded = await pollUntil(async () => (await empty.count()) === 0, {
      timeoutMs: motionDeadlineMs('list'),
    })

    await captureMotionFrames(page, 'jobs-list', [0, 120, 240, 480])
    expect(loaded).toBe(true)
  })

  test('reduced motion still opens quick actions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.getByRole('button', { name: 'Quick actions' }).click()

    await expect(page.getByRole('menuitem', { name: 'New job' })).toBeVisible({
      timeout: motionDeadlineMs('fab'),
    })
  })
})
