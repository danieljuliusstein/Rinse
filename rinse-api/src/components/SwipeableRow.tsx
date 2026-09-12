'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Trash } from '@phosphor-icons/react'
import RowContextMenu from './RowContextMenu'
import { useConfirm } from '@/providers/ConfirmProvider'

const SWIPE_OPEN_OFFSET = -72
const SWIPE_THRESHOLD = 48
const LONG_PRESS_MS = 450
const HORIZONTAL_START_PX = 14

interface SwipeableRowProps {
  rowId: string
  openRowId: string | null
  onOpenChange: (id: string | null) => void
  children: ReactNode
  onEdit: () => void
  onDelete: () => void
  deleteConfirmMessage: string
  showDivider?: boolean
}

export default function SwipeableRow({
  rowId,
  openRowId,
  onOpenChange,
  children,
  onEdit,
  onDelete,
  deleteConfirmMessage,
  showDivider = false,
}: SwipeableRowProps) {
  const confirm = useConfirm()
  const [offset, setOffset] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const blockClickRef = useRef(false)
  const openRowIdRef = useRef(openRowId)
  const onOpenChangeRef = useRef(onOpenChange)
  const menuOpenRef = useRef(menuOpen)
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
    menuOpenRef.current = menuOpen
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
    else setRowOffset(SWIPE_OPEN_OFFSET)
  }, [isOpen, setRowOffset])

  const resetSwipe = useCallback(() => {
    setRowOffset(0)
    if (openRowIdRef.current === rowId) onOpenChangeRef.current(null)
  }, [rowId, setRowOffset])

  const confirmDelete = useCallback(async () => {
    const ok = await confirm({
      title: 'Delete?',
      message: deleteConfirmMessage,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
    })
    if (!ok) return
    onDelete()
    resetSwipe()
  }, [confirm, deleteConfirmMessage, onDelete, resetSwipe])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (menuOpenRef.current) return
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
        setMenuOpen(true)
      }, LONG_PRESS_MS)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (menuOpenRef.current || gesture.current.longPressTriggered) return

      const touch = e.touches[0]
      const dx = touch.clientX - gesture.current.startX
      const dy = touch.clientY - gesture.current.startY

      if (gesture.current.axis === 'y') return

      if (!gesture.current.axis) {
        const distance = Math.hypot(dx, dy)
        if (distance < 8) return

        clearLongPress()

        // Bias toward page scroll: only hijack clearly horizontal drags.
        if (Math.abs(dy) >= Math.abs(dx) || Math.abs(dx) < HORIZONTAL_START_PX) {
          gesture.current.axis = 'y'
          return
        }

        gesture.current.axis = 'x'
        setIsDragging(true)
      }

      if (gesture.current.axis !== 'x') return

      e.preventDefault()
      const next = Math.min(0, Math.max(SWIPE_OPEN_OFFSET, dx))
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
        if (current <= -SWIPE_THRESHOLD) {
          setRowOffset(SWIPE_OPEN_OFFSET)
          onOpenChangeRef.current(rowId)
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
  }, [rowId, clearLongPress, resetSwipe, setRowOffset])

  return (
    <>
      <div
        className={`swipe-row-wrap${showDivider ? ' swipe-row-wrap--divider' : ''}`}
        data-swipe-open={isOpen || undefined}
      >
        {(isOpen || offset < 0) && (
          <div className="swipe-row-actions" aria-hidden={!isOpen}>
            <button
              type="button"
              className="swipe-row-delete-btn"
              onClick={confirmDelete}
              aria-label="Delete"
            >
              <Trash size={18} weight="bold" />
            </button>
          </div>
        )}
        <div
          ref={contentRef}
          className="swipe-row-content"
          style={{
            transform: `translateX(${offset}px)`,
            transition: isDragging ? 'none' : 'transform var(--duration-medium) var(--ease-spring)',
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

      {menuOpen && (
        <RowContextMenu
          onEdit={onEdit}
          onDelete={confirmDelete}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
