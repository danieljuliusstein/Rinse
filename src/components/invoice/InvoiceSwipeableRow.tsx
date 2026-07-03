'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, CopySimple, PaperPlaneTilt, Trash } from '@phosphor-icons/react'
import { lightHaptic } from '@/lib/haptics'

const ACTION_WIDTH = 56
const LONG_PRESS_MS = 450
const HORIZONTAL_START_PX = 14

interface InvoiceSwipeableRowProps {
  rowId: string
  openRowId: string | null
  onOpenChange: (id: string | null) => void
  children: ReactNode
  canMarkSent: boolean
  canMarkPaid: boolean
  onLongPress: () => void
  onMarkSent?: () => void
  onMarkPaid?: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export default function InvoiceSwipeableRow({
  rowId,
  openRowId,
  onOpenChange,
  children,
  canMarkSent,
  canMarkPaid,
  onLongPress,
  onMarkSent,
  onMarkPaid,
  onDuplicate,
  onDelete,
}: InvoiceSwipeableRowProps) {
  const actionsWidth = useMemo(() => {
    let count = 2
    if (canMarkSent) count += 1
    if (canMarkPaid) count += 1
    return count * ACTION_WIDTH
  }, [canMarkSent, canMarkPaid])

  const swipeOpenOffset = -actionsWidth
  const swipeThreshold = Math.min(48, actionsWidth / 2)

  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const blockClickRef = useRef(false)
  const openRowIdRef = useRef(openRowId)
  const onOpenChangeRef = useRef(onOpenChange)
  const gesture = useRef({
    startX: 0,
    startY: 0,
    axis: null as 'x' | 'y' | null,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
    longPressTriggered: false,
    movedX: 0,
  })

  const isOpen = openRowId === rowId

  useEffect(() => {
    openRowIdRef.current = openRowId
    onOpenChangeRef.current = onOpenChange
  })

  const clearLongPress = useCallback(() => {
    if (gesture.current.longPressTimer) {
      clearTimeout(gesture.current.longPressTimer)
      gesture.current.longPressTimer = null
    }
  }, [])

  const setRowOffset = useCallback((next: number) => {
    offsetRef.current = next
    setOffset(next)
  }, [])

  useEffect(() => {
    if (!isOpen) setRowOffset(0)
    else setRowOffset(swipeOpenOffset)
  }, [isOpen, setRowOffset, swipeOpenOffset])

  const resetSwipe = useCallback(() => {
    setRowOffset(0)
    if (openRowIdRef.current === rowId) onOpenChangeRef.current(null)
  }, [rowId, setRowOffset])

  const runAction = useCallback(
    (fn: () => void) => {
      lightHaptic()
      fn()
      resetSwipe()
    },
    [resetSwipe],
  )

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      gesture.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        axis: null,
        longPressTimer: null,
        longPressTriggered: false,
        movedX: 0,
      }
      blockClickRef.current = false

      const activeRowId = openRowIdRef.current
      if (activeRowId && activeRowId !== rowId) {
        onOpenChangeRef.current(null)
        setRowOffset(0)
      }

      gesture.current.longPressTimer = setTimeout(() => {
        if (gesture.current.axis === 'y') return
        gesture.current.longPressTriggered = true
        clearLongPress()
        lightHaptic()
        onLongPress()
      }, LONG_PRESS_MS)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (gesture.current.longPressTriggered) return

      const touch = e.touches[0]
      const dx = touch.clientX - gesture.current.startX
      const dy = touch.clientY - gesture.current.startY

      if (gesture.current.axis === 'y') return

      if (!gesture.current.axis) {
        const distance = Math.hypot(dx, dy)
        if (distance < 8) return

        clearLongPress()

        if (Math.abs(dy) >= Math.abs(dx) || Math.abs(dx) < HORIZONTAL_START_PX) {
          gesture.current.axis = 'y'
          return
        }

        gesture.current.axis = 'x'
        setIsDragging(true)
      }

      if (gesture.current.axis !== 'x') return

      e.preventDefault()
      const next = Math.min(0, Math.max(swipeOpenOffset, dx))
      gesture.current.movedX = Math.abs(dx)
      setRowOffset(next)
      if (next < -20) onOpenChangeRef.current(rowId)
    }

    const onTouchEnd = () => {
      clearLongPress()

      if (gesture.current.longPressTriggered) {
        blockClickRef.current = true
        gesture.current.axis = null
        return
      }

      if (gesture.current.axis === 'y') {
        gesture.current.axis = null
        return
      }

      if (gesture.current.axis === 'x') {
        if (gesture.current.movedX > 10) blockClickRef.current = true
        const current = offsetRef.current
        if (current <= -swipeThreshold) {
          setRowOffset(swipeOpenOffset)
          onOpenChangeRef.current(rowId)
          lightHaptic()
        } else {
          resetSwipe()
        }
      }

      setIsDragging(false)
      gesture.current.axis = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [rowId, clearLongPress, onLongPress, resetSwipe, setRowOffset, swipeOpenOffset, swipeThreshold])

  return (
    <div className="swipe-row-wrap invoice-swipe-item" data-swipe-open={isOpen || undefined}>
      {(isOpen || offset < 0) && (
        <div
          className="swipe-row-actions swipe-row-actions--multi"
          style={{ width: actionsWidth }}
          aria-hidden={!isOpen}
        >
          {canMarkSent && onMarkSent ? (
            <button
              type="button"
              className="swipe-row-action-btn swipe-row-action-btn--send"
              onClick={() => runAction(onMarkSent)}
              aria-label="Mark sent"
            >
              <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />
            </button>
          ) : null}
          {canMarkPaid && onMarkPaid ? (
            <button
              type="button"
              className="swipe-row-action-btn swipe-row-action-btn--paid"
              onClick={() => runAction(onMarkPaid)}
              aria-label="Mark paid"
            >
              <Check size={18} weight="bold" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            className="swipe-row-action-btn swipe-row-action-btn--duplicate"
            onClick={() => runAction(onDuplicate)}
            aria-label="Duplicate"
          >
            <CopySimple size={18} weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="swipe-row-action-btn swipe-row-action-btn--danger"
            onClick={() => runAction(onDelete)}
            aria-label="Delete"
          >
            <Trash size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      )}
      <div
        ref={contentRef}
        className="swipe-row-content"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          onLongPress()
        }}
        onClickCapture={(e) => {
          if (blockClickRef.current) {
            e.preventDefault()
            e.stopPropagation()
            blockClickRef.current = false
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
