import type { PlacedElement } from './types'

function overlapsX(a: PlacedElement, b: PlacedElement): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x
}

/** Content bottom + trailing spacing gap. */
function stackBottom(el: PlacedElement): number {
  return el.y + el.h + Math.max(0, el.spacing ?? 0)
}

/**
 * Pack top→bottom. Horizontally overlapping blocks stack with `prev.spacing`
 * between them. Side-by-side blocks (no X overlap) keep their row.
 * Pulls up or pushes down so spacing edits never leave overlaps.
 */
export function reflowElementStack(elements: PlacedElement[]): PlacedElement[] {
  const order = elements
    .map((el) => ({ ...el }))
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))

  for (let i = 0; i < order.length; i++) {
    const curr = order[i]!
    let tight = 0
    let constrained = false

    for (let j = 0; j < i; j++) {
      const prev = order[j]!
      if (!overlapsX(curr, prev)) continue
      constrained = true
      tight = Math.max(tight, stackBottom(prev))
    }

    if (constrained) {
      curr.y = Math.max(0, tight)
    }
  }

  const byId = new Map(order.map((el) => [el.id, el]))
  return elements.map((el) => byId.get(el.id) ?? el)
}

/**
 * After drag/align: push overlapping blocks down only (keeps gaps above).
 */
export function resolveElementOverlaps(elements: PlacedElement[]): PlacedElement[] {
  const order = elements
    .map((el) => ({ ...el }))
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))

  for (let i = 1; i < order.length; i++) {
    const curr = order[i]!
    for (let j = 0; j < i; j++) {
      const prev = order[j]!
      if (!overlapsX(curr, prev)) continue
      const required = stackBottom(prev)
      if (curr.y < required) curr.y = required
    }
  }

  const byId = new Map(order.map((el) => [el.id, el]))
  return elements.map((el) => byId.get(el.id) ?? el)
}

/** Set spacing on one block, then reflow so the stack shifts together without overlap. */
export function applyElementSpacing(
  elements: PlacedElement[],
  selectedId: string,
  nextSpacing: number,
): PlacedElement[] {
  const gap = Math.max(0, nextSpacing)
  const withSpacing = elements.map((el) =>
    el.id === selectedId ? { ...el, spacing: gap } : el,
  )
  return reflowElementStack(withSpacing)
}
