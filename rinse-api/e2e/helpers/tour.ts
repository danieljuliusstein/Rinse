import type { Page } from '@playwright/test'

const TOUR_COMPLETED_KEY = 'detailing_product_tour_completed'
const TOUR_PENDING_KEY = 'detailing_product_tour_pending'
const TOUR_REPLAY_KEY = 'detailing_product_tour_replay'
const TOUR_WELCOME_DISMISSED_KEY = 'detailing_product_tour_welcome_dismissed'
const TOUR_REPLAY_EVENT = 'detailing-product-tour-replay'

export async function getTourUserId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('pocketbase_auth')
      if (!raw) return null
      const auth = JSON.parse(raw) as { record?: { id?: string } }
      return auth.record?.id ?? null
    } catch {
      return null
    }
  })
}

export async function isTourMarkedCompleted(page: Page): Promise<boolean> {
  const userId = await getTourUserId(page)
  if (!userId) return false
  return page.evaluate(
    ([completedKey, uid]) => localStorage.getItem(`${completedKey}_${uid}`) === '1',
    [TOUR_COMPLETED_KEY, userId] as const,
  )
}

export async function requestTourReplay(page: Page): Promise<void> {
  const userId = await getTourUserId(page)
  if (!userId) throw new Error('No authenticated user — cannot start tour replay')

  await page.evaluate(
    ([completedKey, pendingKey, replayKey, welcomeKey, uid]) => {
      localStorage.removeItem(`${completedKey}_${uid}`)
      sessionStorage.setItem(`${replayKey}_${uid}`, '1')
      sessionStorage.setItem(`${pendingKey}_${uid}`, '1')
      sessionStorage.removeItem(`${welcomeKey}_${uid}`)
    },
    [TOUR_COMPLETED_KEY, TOUR_PENDING_KEY, TOUR_REPLAY_KEY, TOUR_WELCOME_DISMISSED_KEY, userId] as const,
  )
}

async function waitForTourOverlay(page: Page): Promise<void> {
  const title = page.locator('.rinse-tour__title')
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (await title.isVisible()) return
    await page.evaluate((eventName) => {
      window.dispatchEvent(new Event(eventName))
    }, TOUR_REPLAY_EVENT)
    await page.waitForTimeout(700)
  }
  throw new Error(`Tour overlay did not appear (url: ${page.url()})`)
}

export async function startTourFromHome(page: Page): Promise<void> {
  await requestTourReplay(page)

  if (!page.url().endsWith('/') || page.url().includes('/auth')) {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  }

  await page.locator('[data-tour="fab"]').waitFor({ state: 'visible', timeout: 15_000 })
  await page.waitForTimeout(800)
  await waitForTourOverlay(page)
}

export async function advanceTourToEnd(page: Page, maxSteps = 8): Promise<void> {
  const primary = page.locator('.rinse-tour__btn--primary')

  for (let i = 0; i < maxSteps; i += 1) {
    await page.locator('.rinse-tour:not(.rinse-tour--prep) .rinse-tour__title').waitFor({
      state: 'visible',
      timeout: 45_000,
    })

    const label = ((await primary.textContent({ timeout: 10_000 })) ?? '').trim()
    if (label === 'Done') {
      await primary.click()
      return
    }
    if (label !== 'Next') {
      throw new Error(`Unexpected tour primary button label: "${label}"`)
    }

    const progressBefore = await page.locator('.rinse-tour__progress').innerText()
    await primary.click()
    await page.waitForFunction(
      (prev) => {
        const prep = document.querySelector('.rinse-tour--prep')
        const progress = document.querySelector('.rinse-tour__progress')
        return !prep && progress != null && progress.textContent !== prev
      },
      progressBefore,
      { timeout: 45_000 },
    )
  }

  throw new Error('Tour did not reach the final step')
}
