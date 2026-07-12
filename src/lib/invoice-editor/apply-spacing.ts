import type { DropGhost, PlacedElement } from './types'

function overlapsX(a: Pick<PlacedElement, 'x' | 'w'>, b: Pick<PlacedElement, 'x' | 'w'>): boolean {
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

/**
 * Live drag rearrange from a drag-start baseline of elements.
 * Dragged block follows the finger; peers in the same column open a slot (ghost).
 */
export function liveDragRearrange(
  baseline: PlacedElement[],
  draggingId: string,
  dragX: number,
  dragY: number,
): { elements: PlacedElement[]; ghost: DropGhost | null } {
  const dragging = baseline.find((e) => e.id === draggingId)
  if (!dragging) return { elements: baseline, ghost: null }

  const probe = { x: dragX, w: dragging.w }
  const peers = baseline
    .filter((e) => e.id !== draggingId && overlapsX(probe, e))
    .map((e) => ({ ...e }))
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))

  const dragCenter = dragY + dragging.h / 2
  let insertAt = peers.length
  for (let i = 0; i < peers.length; i++) {
    const mid = peers[i]!.y + peers[i]!.h / 2
    if (dragCenter < mid) {
      insertAt = i
      break
    }
  }

  // Column top must include the dragged block's baseline Y. Using only peers[0].y
  // made the top slot unreachable — dragging the first/second block always
  // re-anchored under the next peer, so items ratcheted downward.
  const topAnchor = Math.max(
    0,
    peers.reduce((minY, peer) => Math.min(minY, peer.y), dragging.y),
  )

  let cursor = topAnchor
  const placedPeers: PlacedElement[] = []
  let ghostY = cursor

  for (let i = 0; i <= peers.length; i++) {
    if (i === insertAt) {
      ghostY = cursor
      cursor = ghostY + dragging.h + Math.max(0, dragging.spacing ?? 0)
    }
    const peer = peers[i]
    if (!peer) continue
    peer.y = cursor
    placedPeers.push(peer)
    cursor = stackBottom(peer)
  }
  if (insertAt === peers.length) {
    ghostY = cursor
  }

  const byId = new Map(placedPeers.map((el) => [el.id, el]))
  const next = baseline.map((el) => {
    if (el.id === draggingId) {
      return { ...el, x: dragX, y: dragY }
    }
    return byId.get(el.id) ?? el
  })

  return {
    elements: next,
    ghost: {
      x: dragX,
      y: ghostY,
      w: dragging.w,
      h: dragging.h,
    },
  }
}

