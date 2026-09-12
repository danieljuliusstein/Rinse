'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PortalPhoto } from '@/lib/server/portal-data'

interface PortalPhotoGridProps {
  label: string
  photos: PortalPhoto[]
  dark?: boolean
  after?: boolean
}

const SWIPE_THRESHOLD = 48

export default function PortalPhotoGrid({ label, photos, dark, after }: PortalPhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const close = useCallback(() => {
    setLightboxIndex(null)
    document.body.style.overflow = ''
  }, [])

  const go = useCallback(
    (delta: number) => {
      setLightboxIndex((i) => {
        if (i === null) return null
        return (i + delta + photos.length) % photos.length
      })
    },
    [photos.length]
  )

  useEffect(() => {
    if (lightboxIndex === null) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, close, go])

  if (photos.length === 0) return null

  const thumbClass = [
    'portal-photo-thumb',
    dark ? 'portal-photo-thumb--dark' : '',
    after ? 'portal-photo-thumb--after' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null
  const fullSrc = currentPhoto?.url

  return (
    <>
      <div className={after ? 'portal-photos-section-label--after portal-section-label' : 'portal-section-label'}>
        {label}
      </div>
      <div className="portal-photo-grid">
        {photos.map((p, i) => (
          <button
            key={p.filename}
            type="button"
            className={thumbClass}
            data-src={p.url}
            onClick={() => setLightboxIndex(i)}
            aria-label={`View ${label} photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" />
            <span className="portal-photo-thumb__tap-hint">Tap to enlarge</span>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && fullSrc && (
        <div
          className="portal-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            className="portal-lightbox__close"
            onClick={close}
            aria-label="Close"
          >
            ×
          </button>
          <div className="portal-lightbox__label">
            {label} · {lightboxIndex + 1} of {photos.length}
          </div>
          <button
            type="button"
            className="portal-lightbox__zone portal-lightbox__zone--prev"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            aria-label="Previous"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="portal-lightbox__img"
            src={fullSrc}
            alt=""
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.changedTouches[0]?.clientX ?? null
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current
              const end = e.changedTouches[0]?.clientX
              touchStartX.current = null
              if (start == null || end == null) return
              const delta = end - start
              if (Math.abs(delta) < SWIPE_THRESHOLD) return
              go(delta < 0 ? 1 : -1)
            }}
          />
          <button
            type="button"
            className="portal-lightbox__zone portal-lightbox__zone--next"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            aria-label="Next"
          />
        </div>
      )}
    </>
  )
}
