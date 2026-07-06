'use client'

import { useEffect, useRef } from 'react'
import { Drawer } from 'vaul'
import { trapFocus } from '@/lib/focus-trap'

interface LogoPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTakePhoto: () => void
  onChooseGallery: () => void
  disabled?: boolean
}

export default function LogoPickerSheet({
  open,
  onOpenChange,
  onTakePhoto,
  onChooseGallery,
  disabled = false,
}: LogoPickerSheetProps) {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)

    let releaseFocus: (() => void) | undefined
    const frame = window.requestAnimationFrame(() => {
      if (bodyRef.current) releaseFocus = trapFocus(bodyRef.current)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      releaseFocus?.()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground modal>
      <Drawer.Portal>
        <Drawer.Overlay className="setup-logo-sheet__overlay" />
        <Drawer.Content className="setup-logo-sheet" role="dialog" aria-modal="true" aria-label="Select image">
          <div className="setup-logo-sheet__handle" aria-hidden="true" />
          <Drawer.Title className="setup-logo-sheet__title">Select image</Drawer.Title>
          <div ref={bodyRef} className="setup-logo-sheet__body">
            <button
              type="button"
              className="setup-logo-sheet__row"
              disabled={disabled}
              onClick={() => {
                onOpenChange(false)
                onTakePhoto()
              }}
            >
              Take photo
            </button>
            <button
              type="button"
              className="setup-logo-sheet__row"
              disabled={disabled}
              onClick={() => {
                onOpenChange(false)
                onChooseGallery()
              }}
            >
              Choose from gallery
            </button>
            <button
              type="button"
              className="setup-logo-sheet__cancel"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
