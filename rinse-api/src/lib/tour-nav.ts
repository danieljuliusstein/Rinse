/** Next.js router bridge for multi-page product tour navigation. */

export type TourNavigate = (path: string) => Promise<void>

let tourNavigate: TourNavigate | null = null

export function setTourNavigate(fn: TourNavigate): void {
  tourNavigate = fn
}

export function clearTourNavigate(): void {
  tourNavigate = null
}

export function pathMatches(current: string, target: string): boolean {
  if (target === '/') return current === '/'
  return current === target || current.startsWith(`${target}/`)
}

export async function navigateForTour(path: string): Promise<void> {
  if (typeof window === 'undefined') return
  if (pathMatches(window.location.pathname, path)) return

  if (tourNavigate) {
    await tourNavigate(path)
    return
  }

  window.location.assign(path)
}

export async function waitForLayoutSettle(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

export async function waitForElement(selector: string, maxMs = 8000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const el = document.querySelector(selector)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.width >= 1 && rect.height >= 1) return true
    }
    await new Promise((resolve) => setTimeout(resolve, 80))
  }
  const el = document.querySelector(selector)
  if (!el) return false
  const rect = el.getBoundingClientRect()
  return rect.width >= 1 && rect.height >= 1
}

/** Wait for route, target element, and a stable layout pass. */
export async function waitForRouteReady(
  path: string,
  selector?: string,
  maxMs = 10000,
): Promise<boolean> {
  const start = Date.now()
  let settledFrames = 0
  let lastRectKey = ''

  while (Date.now() - start < maxMs) {
    if (!pathMatches(window.location.pathname, path)) {
      settledFrames = 0
      await new Promise((resolve) => setTimeout(resolve, 80))
      continue
    }

    if (selector) {
      const el = document.querySelector(selector)
      if (!el) {
        settledFrames = 0
        await new Promise((resolve) => setTimeout(resolve, 80))
        continue
      }
      const rect = el.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) {
        settledFrames = 0
        await new Promise((resolve) => setTimeout(resolve, 80))
        continue
      }
      const rectKey = `${Math.round(rect.top)}:${Math.round(rect.left)}:${Math.round(rect.width)}:${Math.round(rect.height)}`
      if (rectKey === lastRectKey) {
        settledFrames += 1
      } else {
        settledFrames = 0
        lastRectKey = rectKey
      }
      if (settledFrames < 1) {
        await waitForLayoutSettle()
        continue
      }
    }

    await waitForLayoutSettle()
    return true
  }

  if (!pathMatches(window.location.pathname, path)) return false
  if (!selector) return true
  return waitForElement(selector, 0)
}

export async function prepareTourStepRoute(
  route?: string,
  waitSelector?: string,
): Promise<boolean> {
  if (route) {
    await navigateForTour(route)
  }
  const path = route ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  if (waitSelector) {
    return waitForRouteReady(path, waitSelector)
  }
  if (route) {
    return waitForRouteReady(path)
  }
  await waitForLayoutSettle()
  return true
}
