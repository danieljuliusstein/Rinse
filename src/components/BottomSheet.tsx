'use client'

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock'
import { trapFocus } from '@/lib/focus-trap'

/**
 * Bottom sheet shell. Footer children use `SheetSubmitButton` / `.sheet-submit`.
 * `variant="light"` (default) — operator forms on light shell.
 * `variant="premium"` is an alias for light (dark chrome removed).
 */
interface BottomSheetProps {
  title: string
  subtitle?: string
  ariaLabel?: string
  variant?: 'default' | 'premium' | 'light'
  sheetClassName?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

const DISMISS_THRESHOLD = 100
const DIRECTION_LOCK_PX = 10

export default function BottomSheet({
  title,
  subtitle,
  ariaLabel,
  variant = 'light',
  sheetClassName,
  onClose,
  children,
  footer,
}: BottomSheetProps) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startY: 0, active: false, currentY: 0 })
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    lockBodyScroll()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    let releaseFocus: (() => void) | undefined
    const frame = window.requestAnimationFrame(() => {
      if (dialogRef.current) {
        releaseFocus = trapFocus(dialogRef.current, '.inv-sheet-close')
      }
    })

    return () => {
      window.cancelAnimationFrame(frame)
      releaseFocus?.()
      unlockBodyScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const onDragStart = useCallback((clientY: number) => {
    dragRef.current = { startY: clientY, active: true, currentY: 0 }
    setDragging(true)
  }, [])

  const onDragMove = useCallback((clientY: number) => {
    if (!dragRef.current.active) return
    const delta = Math.max(0, clientY - dragRef.current.startY)
    dragRef.current.currentY = delta
    setDragY(delta)
  }, [])

  const onDragEnd = useCallback(() => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    setDragging(false)
    if (dragRef.current.currentY >= DISMISS_THRESHOLD) {
      onClose()
    } else {
      dragRef.current.currentY = 0
      setDragY(0)
    }
  }, [onClose])

  const onTouchStart = (e: TouchEvent) => {
    e.stopPropagation()
    onDragStart(e.touches[0].clientY)
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!dragRef.current.active) return
    const dy = e.touches[0].clientY - dragRef.current.startY
    if (dy > DIRECTION_LOCK_PX) {
      e.preventDefault()
      onDragMove(e.touches[0].clientY)
    }
  }

  const overlayOpacity = Math.max(0.2, 0.55 - dragY / 400)

  if (typeof document === 'undefined') return null

  const sheetClasses = [
    'inv-sheet',
    variant === 'premium' || variant === 'light' ? 'light-sheet' : '',
    sheetClassName ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return createPortal(
    <div
      ref={dialogRef}
      className="inv-sheet-root"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
    >
      <button
        type="button"
        className="inv-sheet-overlay"
        onClick={onClose}
        aria-label="Close"
        style={{ opacity: overlayOpacity, transition: dragging ? 'none' : 'opacity 0.2s ease' }}
      />
      <div
        className={sheetClasses}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? 'none' : 'transform 0.25s ease',
        }}
      >
        <div
          className="inv-sheet-drag-zone"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onDragEnd}
          onTouchCancel={onDragEnd}
        >
          <div className="inv-sheet-handle" />
          <div className="inv-sheet-top">
            <div className="inv-sheet-top-text">
              <div className="inv-sheet-title">{title}</div>
              {subtitle ? <div className="inv-sheet-subtitle">{subtitle}</div> : null}
            </div>
            <button type="button" className="inv-sheet-close" onClick={onClose} aria-label="Close">
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="inv-sheet-body">{children}</div>
        {footer ? <div className="inv-sheet-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  )
}
