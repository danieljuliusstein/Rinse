import { useLayoutEffect, useState } from "react"

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

// Measures a target element (by selector) in viewport coordinates so the
// spotlight cutout and coach card can be positioned over it. Re-measures on
// stop/page change, on resize, and once more after layout settles.
export function useSpotlight(selector: string | null, deps: unknown[]): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)

  useLayoutEffect(() => {
    if (!selector) {
      setRect(null)
      return
    }

    let hasScrolled = false

    const measure = () => {
      const el = document.querySelector(selector)
      if (!el) return
      const r = el.getBoundingClientRect()

      // Scroll into view if element is offscreen or hidden near viewport boundaries
      if (!hasScrolled && typeof el.scrollIntoView === 'function') {
        const isOutOfComfortZone =
          r.top < 70 ||
          r.bottom > window.innerHeight - 80 ||
          r.left < 0 ||
          r.right > window.innerWidth

        if (isOutOfComfortZone) {
          hasScrolled = true
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }
      }

      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    measure()
    const raf = requestAnimationFrame(measure)
    const t1 = setTimeout(measure, 60)
    const t2 = setTimeout(measure, 200)
    const t3 = setTimeout(measure, 450)
    const t4 = setTimeout(measure, 800)

    const interval = setInterval(() => {
      const el = document.querySelector(selector)
      if (el) {
        measure()
      }
    }, 120)
    const stopInterval = setTimeout(() => clearInterval(interval), 3500)

    let observer: MutationObserver | null = null
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        measure()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { capture: true, passive: true })

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(stopInterval)
      clearInterval(interval)
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, { capture: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return rect
}
