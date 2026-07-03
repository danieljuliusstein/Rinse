import type { RinseTourLayout, RinseTourRect, TourCardMode } from './types'

const DEFAULT_SPOTLIGHT_PAD = 12
const CARD_GAP = 16
const VIEWPORT_PAD = 16
const DEFAULT_CARD_HEIGHT = 220
const DEFAULT_SPOTLIGHT_RADIUS = 14

export function getSafeAreaTop(): number {
  if (typeof document === 'undefined') return VIEWPORT_PAD
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--sat').trim()
    const parsed = Number.parseFloat(raw)
    if (Number.isFinite(parsed) && parsed > 0) return parsed + 8
  } catch {
    /* jsdom / test environments without layout */
  }
  return VIEWPORT_PAD
}

export function getDockInset(): number {
  if (typeof document === 'undefined') return 80
  const nav = document.querySelector('.bottom-nav')
  if (!nav) return 80
  const rect = nav.getBoundingClientRect()
  return rect.height + 12
}

export function getShadePanels(
  spotlight: RinseTourRect,
  viewport: { width: number; height: number },
): {
  top: { top: number; left: number; width: number; height: number }
  right: { top: number; left: number; width: number; height: number }
  bottom: { top: number; left: number; width: number; height: number }
  left: { top: number; left: number; width: number; height: number }
} {
  const { top, left, width, height } = spotlight
  const { width: vw, height: vh } = viewport
  const right = left + width
  const bottom = top + height

  return {
    top: { top: 0, left: 0, width: vw, height: Math.max(0, top) },
    bottom: { top: bottom, left: 0, width: vw, height: Math.max(0, vh - bottom) },
    left: { top, left: 0, width: Math.max(0, left), height },
    right: { top, left: right, width: Math.max(0, vw - right), height },
  }
}

export function cutoutClipPath(rect: RinseTourRect | null, radius = DEFAULT_SPOTLIGHT_RADIUS): string | undefined {
  if (!rect || typeof window === 'undefined') return undefined
  const W = window.innerWidth
  const H = window.innerHeight
  const { left: x, top: y, width: w, height: h } = rect
  const r = Math.min(radius, w / 2, h / 2)
  const inner = `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  return `polygon(evenodd, 0px 0px, ${W}px 0px, ${W}px ${H}px, 0px ${H}px, 0px 0px, ${inner})`
}

export function measureTarget(
  selector: string,
  options: { pad?: number; radius?: number; shape?: 'rect' | 'circle' } = {},
): (RinseTourRect & { radius: number }) | null {
  if (typeof document === 'undefined') return null
  const el = document.querySelector(selector)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null
  const pad = options.pad ?? DEFAULT_SPOTLIGHT_PAD
  const shape = options.shape ?? (options.radius !== undefined && options.radius >= 999 ? 'circle' : 'rect')

  if (shape === 'circle') {
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const diameter = Math.max(rect.width, rect.height) + pad * 2
    return {
      top: cy - diameter / 2,
      left: cx - diameter / 2,
      width: diameter,
      height: diameter,
      radius: diameter / 2,
    }
  }

  const measured = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  }
  const maxRadius = Math.min(measured.width, measured.height) / 2
  const radius = Math.min(options.radius ?? DEFAULT_SPOTLIGHT_RADIUS, maxRadius)
  return { ...measured, radius }
}

function rectsOverlap(
  a: { top: number; left: number; width: number; height: number },
  b: { top: number; left: number; width: number; height: number },
): boolean {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  )
}

export function layoutTourCard(
  spotlight: RinseTourRect | null,
  options: {
    placement?: 'auto' | 'top' | 'bottom'
    cardMode?: TourCardMode
    cardHeight?: number
  } = {},
): RinseTourLayout {
  const placement = options.placement ?? 'auto'
  const cardMode = options.cardMode ?? 'auto'
  const cardHeight = options.cardHeight ?? DEFAULT_CARD_HEIGHT
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844
  const dock = getDockInset()
  const maxWidth = Math.min(320, vw - VIEWPORT_PAD * 2)
  const safeTop = getSafeAreaTop()

  if (!spotlight) {
    const top = Math.max(safeTop, (vh - cardHeight) / 2)
    return {
      spotlight: null,
      cardTop: top,
      cardLeft: (vw - maxWidth) / 2,
      cardMaxWidth: maxWidth,
      cardPlacement: 'center',
    }
  }

  if (cardMode === 'viewport-top') {
    const spotlightBottom = spotlight.top + spotlight.height
    const spotlightInLowerHalf = spotlightBottom > vh * 0.52
    if (spotlightInLowerHalf) {
      return {
        spotlight,
        cardTop: safeTop,
        cardLeft: Math.max(VIEWPORT_PAD, (vw - maxWidth) / 2),
        cardMaxWidth: maxWidth,
        cardPlacement: 'top',
      }
    }
  }

  const spaceAbove = spotlight.top - safeTop
  const spaceBelow = vh - dock - (spotlight.top + spotlight.height) - VIEWPORT_PAD

  let cardPlacement: 'top' | 'bottom' = 'bottom'
  if (placement === 'top') cardPlacement = 'top'
  else if (placement === 'bottom') cardPlacement = 'bottom'
  else if (spaceBelow < cardHeight + CARD_GAP && spaceAbove > spaceBelow) cardPlacement = 'top'
  else if (spotlight.top + spotlight.height > vh - dock - 24) cardPlacement = 'top'

  let cardTop: number
  if (cardPlacement === 'top') {
    cardTop = Math.max(safeTop, spotlight.top - cardHeight - CARD_GAP)
  } else {
    cardTop = Math.min(
      vh - dock - cardHeight - VIEWPORT_PAD,
      spotlight.top + spotlight.height + CARD_GAP,
    )
  }

  const centerX = spotlight.left + spotlight.width / 2
  let cardLeft = centerX - maxWidth / 2
  cardLeft = Math.max(VIEWPORT_PAD, Math.min(cardLeft, vw - maxWidth - VIEWPORT_PAD))

  const cardRect = { top: cardTop, left: cardLeft, width: maxWidth, height: cardHeight }
  if (rectsOverlap(spotlight, cardRect)) {
    const aboveTop = Math.max(safeTop, spotlight.top - cardHeight - CARD_GAP)
    const aboveRect = { ...cardRect, top: aboveTop }
    if (!rectsOverlap(spotlight, aboveRect) && aboveTop >= safeTop) {
      cardTop = aboveTop
      cardPlacement = 'top'
    } else {
      return {
        spotlight,
        cardTop: safeTop,
        cardLeft: Math.max(VIEWPORT_PAD, (vw - maxWidth) / 2),
        cardMaxWidth: maxWidth,
        cardPlacement: 'top',
      }
    }
  }

  return {
    spotlight,
    cardTop,
    cardLeft,
    cardMaxWidth: maxWidth,
    cardPlacement,
  }
}
