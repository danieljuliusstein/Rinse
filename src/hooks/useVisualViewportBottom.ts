'use client'

import { useEffect, useRef } from 'react'

/**
 * Keeps a fixed bottom bar aligned with the visible viewport on iOS Safari / PWA
 * when the keyboard changes the visual viewport height.
 */
export function useVisualViewportBottom<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const lastGapRef = useRef(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    const vv = window.visualViewport
    if (!el || !vv) return

    const applyGap = (gap: number) => {
      if (Math.abs(gap - lastGapRef.current) < 2) return
      lastGapRef.current = gap
      el.style.transform =
        gap > 0 ? `translateX(-50%) translateY(-${gap}px)` : 'translateX(-50%)'
    }

    const sync = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null
        const gap = Math.round(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
        // Ignore small URL-bar shifts; only lift for keyboard-sized gaps.
        applyGap(gap >= 80 ? gap : 0)
      })
    }

    sync()
    vv.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      el.style.removeProperty('transform')
      vv.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [])

  return ref
}
