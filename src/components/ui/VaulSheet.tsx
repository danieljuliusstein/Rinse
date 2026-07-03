'use client'

import { Drawer } from 'vaul'
import { useEffect, useRef, type ReactNode } from 'react'
import { trapFocus } from '@/lib/focus-trap'

interface VaulSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
}

/** Headless bottom sheet for pickers — use BottomSheet for full forms. */
export default function VaulSheet({ open, onOpenChange, title, children }: VaulSheetProps) {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)

    let releaseFocus: (() => void) | undefined
    const frame = window.requestAnimationFrame(() => {
      if (bodyRef.current) {
        releaseFocus = trapFocus(bodyRef.current)
      }
    })

    return () => {
      window.cancelAnimationFrame(frame)
      releaseFocus?.()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} modal>
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-overlay" />
        <Drawer.Content
          className="vaul-content"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="vaul-handle" aria-hidden="true" />
          {title ? <Drawer.Title className="vaul-title">{title}</Drawer.Title> : null}
          <div ref={bodyRef} className="vaul-body">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
