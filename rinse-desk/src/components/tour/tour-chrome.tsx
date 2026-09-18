// tour-chrome.tsx — spotlight + coach card over the real Desk shell.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, Check, GripHorizontal, MousePointerClick, X } from 'lucide-react'
import { useSpotlight, type Rect } from './use-spotlight'
import { useTour } from './tour-provider'

const PAD = 8
const CARD_WIDTH = 372
const SIDEBAR_WIDTH = 210
const MARGIN = 24

interface Point {
  x: number
  y: number
}

function doesOverlap(
  pos: Point,
  target: Rect,
  cardWidth = CARD_WIDTH,
  cardHeight = 260,
  buffer = 24,
): boolean {
  const cardLeft = pos.x - buffer
  const cardRight = pos.x + cardWidth + buffer
  const cardTop = pos.y - buffer
  const cardBottom = pos.y + cardHeight + buffer

  const targetLeft = target.left
  const targetRight = target.left + target.width
  const targetTop = target.top
  const targetBottom = target.top + target.height

  return !(
    cardRight < targetLeft ||
    cardLeft > targetRight ||
    cardBottom < targetTop ||
    cardTop > targetBottom
  )
}

function getAnchorCoordinates(
  anchor: string,
  vw: number,
  vh: number,
  cardWidth: number,
  cardHeight: number,
): Point {
  if (anchor === 'sidebar') {
    return { x: SIDEBAR_WIDTH + MARGIN, y: 24 }
  }
  if (anchor === 'bottom-right') {
    return { x: Math.max(12, vw - cardWidth - MARGIN), y: Math.max(12, vh - cardHeight - MARGIN) }
  }
  if (anchor === 'top-right') {
    return { x: Math.max(12, vw - cardWidth - MARGIN), y: 76 }
  }
  if (anchor === 'top-left') {
    return { x: SIDEBAR_WIDTH + MARGIN, y: 76 }
  }
  // default bottom-left
  return { x: SIDEBAR_WIDTH + MARGIN, y: Math.max(12, vh - cardHeight - MARGIN) }
}

function calculateBestCardPosition(
  anchor: string,
  targetRect: Rect | null,
  cardHeight = 260,
): Point {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  const defaultPos = getAnchorCoordinates(anchor, vw, vh, CARD_WIDTH, cardHeight)
  if (!targetRect) return defaultPos

  if (!doesOverlap(defaultPos, targetRect, CARD_WIDTH, cardHeight)) {
    return defaultPos
  }

  // Candidate quadrants ordered by preference away from target
  const candidates: Point[] = [
    { x: Math.max(12, vw - CARD_WIDTH - MARGIN), y: Math.max(12, vh - cardHeight - MARGIN) }, // bottom-right
    { x: Math.max(12, vw - CARD_WIDTH - MARGIN), y: 76 }, // top-right
    { x: SIDEBAR_WIDTH + MARGIN, y: Math.max(12, vh - cardHeight - MARGIN) }, // bottom-left
    { x: SIDEBAR_WIDTH + MARGIN, y: 76 }, // top-left
  ]

  for (const cand of candidates) {
    if (!doesOverlap(cand, targetRect, CARD_WIDTH, cardHeight)) {
      return cand
    }
  }

  // Fallback: pick candidate whose center is farthest from target center
  const targetCenterX = targetRect.left + targetRect.width / 2
  const targetCenterY = targetRect.top + targetRect.height / 2
  let best = candidates[0]!
  let maxDist = -1

  for (const cand of candidates) {
    const candCenterX = cand.x + CARD_WIDTH / 2
    const candCenterY = cand.y + cardHeight / 2
    const dist = Math.hypot(candCenterX - targetCenterX, candCenterY - targetCenterY)
    if (dist > maxDist) {
      maxDist = dist
      best = cand
    }
  }

  return best
}

export function TourChrome() {
  const {
    stop,
    stopIndex,
    total,
    stopDone,
    canNext,
    spotlightSelector,
    next,
    back,
    skip,
    completeStop,
    invoiceFallback,
  } = useTour()

  const rect = useSpotlight(spotlightSelector, [spotlightSelector, stopIndex, invoiceFallback])
  const isLast = stopIndex === total - 1
  const clickTarget = stop.completion === 'click-target'

  const cardRef = useRef<HTMLDivElement>(null)
  const [dragPos, setDragPos] = useState<Point | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startX: number; startY: number; initialCardX: number; initialCardY: number }>({
    startX: 0,
    startY: 0,
    initialCardX: 0,
    initialCardY: 0,
  })

  // Whenever the stop changes, reset any custom drag pos so the new stop starts at its optimal spot
  useEffect(() => {
    setDragPos(null)
  }, [stopIndex])

  const cardHeight = cardRef.current?.offsetHeight || 260
  const autoPos = useMemo(() => {
    return calculateBestCardPosition(stop.anchor, rect, cardHeight)
  }, [stop.anchor, rect, cardHeight])

  const currentPos = dragPos ?? autoPos

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select')) return
    e.preventDefault()

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialCardX: currentPos.x,
      initialCardY: currentPos.y,
    }
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragStartRef.current.startX
      const deltaY = e.clientY - dragStartRef.current.startY
      const measuredHeight = cardRef.current?.offsetHeight || 260
      const rawX = dragStartRef.current.initialCardX + deltaX
      const rawY = dragStartRef.current.initialCardY + deltaY
      const clampedX = Math.max(12, Math.min(window.innerWidth - CARD_WIDTH - 12, rawX))
      const clampedY = Math.max(12, Math.min(window.innerHeight - measuredHeight - 12, rawY))
      setDragPos({ x: clampedX, y: clampedY })
    }

    const handlePointerUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging])

  const cardStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: `translate3d(${currentPos.x}px, ${currentPos.y}px, 0)`,
    width: CARD_WIDTH,
    maxWidth: 'calc(100vw - 24px)',
    transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform',
  }

  const primaryOnClick =
    !stopDone && clickTarget
      ? () => {
          completeStop(stop.id)
          next()
        }
      : invoiceFallback && !stopDone
        ? () => {
            completeStop('invoices')
            next()
          }
        : next

  const primaryLabel = isLast
    ? 'Finish tour'
    : stopDone
      ? 'Next'
      : invoiceFallback
        ? 'Continue'
        : clickTarget
          ? 'Got it'
          : 'Next'

  // Desktop keyboard shortcuts: Escape to skip, Enter / ArrowRight to advance, ArrowLeft to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Escape') {
        skip()
      } else if (e.key === 'Enter') {
        if (canNext) primaryOnClick()
      } else if (e.key === 'ArrowRight') {
        if (canNext && !isLast) primaryOnClick()
      } else if (e.key === 'ArrowLeft') {
        if (stopIndex > 0) back()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canNext, primaryOnClick, isLast, stopIndex, back, skip])

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {rect && !stopDone && !invoiceFallback ? (
        <>
          <div
            aria-hidden
            className="tour-ring pointer-events-none absolute rounded-2xl transition-all duration-300 ease-out"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 flex items-center gap-1.5 rounded-full bg-[#15803d] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(21,128,61,0.4)] animate-bounce transition-all duration-300"
            style={{
              top: rect.top > 45 ? rect.top - 34 : rect.top + rect.height + PAD + 6,
              left: Math.max(12, Math.min((typeof window !== 'undefined' ? window.innerWidth : 1200) - 110, rect.left + rect.width / 2 - 45)),
            }}
          >
            <MousePointerClick className="h-3 w-3" strokeWidth={2.5} />
            <span>Click here</span>
          </div>
        </>
      ) : null}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        className="pointer-events-auto absolute rounded-2xl border border-[#e6e9e4] bg-white p-5 shadow-[0_18px_50px_-12px_rgba(9,15,12,0.35)]"
        style={cardStyle}
      >
        <div
          onPointerDown={handlePointerDown}
          className="flex items-center justify-between -mt-1.5 mb-2.5 select-none cursor-grab active:cursor-grabbing text-[#9aa39d] hover:text-[#4b5650] group py-1 -mx-2 px-2 rounded-lg hover:bg-[#f6faf4] transition-colors"
          title="Drag to reposition tour card"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <GripHorizontal className="h-4 w-4 text-[#9aa39d] group-hover:text-[#22c55e] transition-colors" />
            <span className="text-[10.5px] text-[#9aa39d] group-hover:text-[#2f6b46] transition-colors">
              {isDragging ? 'Moving…' : 'Drag to move'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22c55e]/12 px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              {stop.tag}
            </span>
            <span className="text-[11.5px] font-medium text-[#9aa39d]">
              {stopIndex + 1} of {total}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                skip()
              }}
              className="p-1 -mr-1 text-[#9aa39d] hover:text-[#111815] rounded-md hover:bg-black/5 transition-colors cursor-pointer"
              title="Skip tour (Esc)"
              aria-label="Skip tour"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <h2 id="tour-title" className="text-[19px] font-bold leading-snug tracking-tight text-[#111815]">
          {stop.title}
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#5b655e]">{stop.body}</p>

        {stop.requiresAction && stop.task ? (
          <div
            className={[
              'mt-3.5 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold transition-colors',
              stopDone || invoiceFallback
                ? 'border-[#bbf0cb] bg-[#22c55e]/10 text-[#15803d]'
                : 'border-[#e6e9e4] bg-[#f6faf4] text-[#2f6b46]',
            ].join(' ')}
          >
            {stopDone ? (
              <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            ) : invoiceFallback ? (
              <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            ) : (
              <MousePointerClick className="h-4 w-4 shrink-0 text-[#22c55e]" strokeWidth={2.25} />
            )}
            <span>
              {stopDone
                ? "Nice — that's it. Click Next to continue."
                : invoiceFallback
                  ? 'No jobs yet — book one on the calendar first, or Continue.'
                  : stop.task}
            </span>
          </div>
        ) : null}

        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={[
                'h-1.5 flex-1 rounded-full transition-colors',
                i < stopIndex || (i === stopIndex && (stopDone || invoiceFallback))
                  ? 'bg-[#22c55e]'
                  : i === stopIndex
                    ? 'bg-[#86e0a4]'
                    : 'bg-[#e6e9e4]',
              ].join(' ')}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={skip}
            className="text-[13px] font-medium text-[#9aa39d] transition-colors hover:text-[#6b756f]"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {stopIndex > 0 ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[13px] font-medium text-[#4b5650] transition-colors hover:bg-[#f1f4ee]"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={primaryOnClick}
              disabled={!canNext}
              className={[
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold shadow-sm transition-all duration-150',
                canNext
                  ? 'bg-[#22c55e] text-white hover:bg-[#16a34a] shadow-[0_2px_8px_rgba(34,197,94,0.35)] scale-[1.02]'
                  : 'cursor-not-allowed bg-[#eef1ec] text-[#b3bcb5] shadow-none',
              ].join(' ')}
            >
              {primaryLabel}
              {canNext && !isLast ? <ArrowRight className="h-4 w-4" strokeWidth={2.25} /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
