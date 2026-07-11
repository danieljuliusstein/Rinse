import { PAPER_MARGIN, PAPER_HEIGHT, PAPER_WIDTH, SNAP_THRESHOLD, SPACING_SCALE } from './constants'
import type { PlacedElement, SnapGuide, SnapResult } from './types'

export function snapSpacing(value: number): number {
  let closest: number = SPACING_SCALE[0]
  let minDiff = Math.abs(value - closest)
  for (const step of SPACING_SCALE) {
    const diff = Math.abs(value - step)
    if (diff < minDiff) {
      minDiff = diff
      closest = step
    }
  }
  return closest
}

export function spacingIndex(value: number): number {
  const snapped = snapSpacing(value)
  const idx = SPACING_SCALE.indexOf(snapped as (typeof SPACING_SCALE)[number])
  return idx >= 0 ? idx : 0
}

function buildSnapTargets(
  elements: PlacedElement[],
  draggingId: string | null,
  paperWidth = PAPER_WIDTH,
  paperHeight = PAPER_HEIGHT,
): { x: number[]; y: number[] } {
  const xTargets = new Set<number>([PAPER_MARGIN, paperWidth - PAPER_MARGIN, paperWidth / 2])
  const yTargets = new Set<number>([PAPER_MARGIN, paperHeight - PAPER_MARGIN])

  for (const el of elements) {
    if (el.id === draggingId) continue
    xTargets.add(el.x)
    xTargets.add(el.x + el.w)
    xTargets.add(el.x + el.w / 2)
    yTargets.add(el.y)
    yTargets.add(el.y + el.h)
    yTargets.add(el.y + el.h / 2)
  }

  return {
    x: [...xTargets].sort((a, b) => a - b),
    y: [...yTargets].sort((a, b) => a - b),
  }
}

function nearestSnap(
  value: number,
  targets: number[],
  threshold: number,
): { snapped: number; guide: number | null } {
  let best: { snapped: number; guide: number | null; diff: number } = {
    snapped: value,
    guide: null,
    diff: threshold + 1,
  }

  for (const target of targets) {
    const diff = Math.abs(value - target)
    if (diff <= threshold && diff < best.diff) {
      best = { snapped: target, guide: target, diff }
    }
  }

  return { snapped: best.snapped, guide: best.guide }
}

export function snapDragPosition(input: {
  x: number
  y: number
  width: number
  height: number
  elements: PlacedElement[]
  draggingId: string
  enabled: boolean
  paperWidth?: number
  paperHeight?: number
}): SnapResult {
  const {
    x,
    y,
    width,
    height,
    elements,
    draggingId,
    enabled,
    paperWidth = PAPER_WIDTH,
    paperHeight = PAPER_HEIGHT,
  } = input
  const guides: SnapGuide[] = []

  if (!enabled) return { x, y, guides }

  const targets = buildSnapTargets(elements, draggingId, paperWidth, paperHeight)
  const edges = {
    left: x,
    right: x + width,
    top: y,
    bottom: y + height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  }

  const xChecks = [
    { edge: edges.left, offset: 0 },
    { edge: edges.centerX, offset: width / 2 },
    { edge: edges.right, offset: width },
  ]
  const yChecks = [
    { edge: edges.top, offset: 0 },
    { edge: edges.centerY, offset: height / 2 },
    { edge: edges.bottom, offset: height },
  ]

  let snappedX = x
  let snappedY = y
  let bestXDiff = SNAP_THRESHOLD + 1
  let bestYDiff = SNAP_THRESHOLD + 1

  for (const check of xChecks) {
    const result = nearestSnap(check.edge, targets.x, SNAP_THRESHOLD)
    if (result.guide != null) {
      const diff = Math.abs(check.edge - result.guide)
      if (diff < bestXDiff) {
        bestXDiff = diff
        snappedX = result.guide - check.offset
        guides.push({ axis: 'x', position: result.guide, active: true })
      }
    }
  }

  for (const check of yChecks) {
    const result = nearestSnap(check.edge, targets.y, SNAP_THRESHOLD)
    if (result.guide != null) {
      const diff = Math.abs(check.edge - result.guide)
      if (diff < bestYDiff) {
        bestYDiff = diff
        snappedY = result.guide - check.offset
        guides.push({ axis: 'y', position: result.guide, active: true })
      }
    }
  }

  const maxX = paperWidth - width - 4
  const maxY = paperHeight - height - 4
  return {
    x: Math.max(4, Math.min(snappedX, maxX)),
    y: Math.max(4, Math.min(snappedY, maxY)),
    guides,
  }
}

export function applyAlignX(
  align: PlacedElement['align'],
  blockWidth: number,
  paperWidth = PAPER_WIDTH,
): number {
  const contentW = paperWidth - PAPER_MARGIN * 2
  if (align === 'center') return PAPER_MARGIN + (contentW - blockWidth) / 2
  if (align === 'right') return PAPER_MARGIN + contentW - blockWidth
  return PAPER_MARGIN
}
