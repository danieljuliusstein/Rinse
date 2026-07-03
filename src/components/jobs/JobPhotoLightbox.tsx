'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Trash } from '@phosphor-icons/react'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock'
import { trapFocus } from '@/lib/focus-trap'
import { useConfirm } from '@/providers/ConfirmProvider'
import type { JobPhoto, PhotoType } from '@/lib/types'

const SWIPE_THRESHOLD = 48

interface JobPhotoLightboxProps {
  photos: JobPhoto[]
  index: number
  type: PhotoType
  onClose: () => void
  onNavigate: (index: number) => void
  onDelete: (filename: string) => void
}

export default function JobPhotoLightbox({
  photos,
  index,
  type,
  onClose,
  onNavigate,
  onDelete,
}: JobPhotoLightboxProps) {
  const confirm = useConfirm()
  const touchStartX = useRef<number | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const photo = photos[index]
  const pillClass = type === 'before' ? 'job-photos-lightbox__pill--before' : 'job-photos-lightbox__pill--after'
  const label = type === 'before' ? 'BEFORE' : 'AFTER'

  const go = useCallback(
    (delta: number) => {
      onNavigate((index + delta + photos.length) % photos.length)
    },
    [index, onNavigate, photos.length]
  )

  useEffect(() => {
    lockBodyScroll()
    let releaseFocus: (() => void) | undefined
    const frame = window.requestAnimationFrame(() => {
      if (dialogRef.current) {
        releaseFocus = trapFocus(dialogRef.current, '.job-photos-lightbox__close')
      }
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      releaseFocus?.()
      unlockBodyScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, go])

  if (!photo) return null

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete photo?',
      message: 'Delete this photo from the job?',
      confirmLabel: 'Delete photo',
      cancelLabel: 'Cancel',
      destructive: true,
    })
    if (!ok) return
    onDelete(photo.filename)
    if (photos.length <= 1) {
      onClose()
    } else if (index >= photos.length - 1) {
      onNavigate(index - 1)
    }
  }

  return (
    <div
      ref={dialogRef}
      className="job-photos-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} photo ${index + 1} of ${photos.length}`}
      onClick={onClose}
    >
      <div className="job-photos-lightbox__top">
        <span className={`job-photos-lightbox__pill ${pillClass}`}>{label}</span>
        <span className="job-photos-lightbox__counter">
          {index + 1} of {photos.length}
        </span>
        <button type="button" className="job-photos-lightbox__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="job-photos-lightbox__zone job-photos-lightbox__zone--prev"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            aria-label="Previous"
          />
          <button
            type="button"
            className="job-photos-lightbox__zone job-photos-lightbox__zone--next"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            aria-label="Next"
          />
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="job-photos-lightbox__img"
        src={photo.url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current
          const end = e.changedTouches[0]?.clientX
          touchStartX.current = null
          if (start == null || end == null || photos.length <= 1) return
          const delta = end - start
          if (Math.abs(delta) < SWIPE_THRESHOLD) return
          go(delta < 0 ? 1 : -1)
        }}
      />

      <div className="job-photos-lightbox__bottom" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="job-photos-lightbox__delete" onClick={handleDelete}>
          <Trash size={16} weight="bold" aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  )
}
