'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Image as ImageIcon, X } from '@phosphor-icons/react'
import { compressInventoryPhoto } from '@/lib/compress-inventory-photo'

interface Props {
  /** Existing photo URL (PocketBase file URL or local data URL). */
  previewUrl: string | null
  onChange: (file: File | null) => void
  onClearExisting?: () => void
  label?: string
}

export default function InventoryImagePicker({
  previewUrl,
  onChange,
  onClearExisting,
  label = 'Product photo',
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  useEffect(() => {
    setLocalPreview(null)
  }, [previewUrl])

  const pick = async (file: File | undefined) => {
    if (!file) return
    const prepared = await compressInventoryPhoto(file)
    setLocalPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(prepared)
    })
    onChange(prepared)
  }

  const handleClear = () => {
    setLocalPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    onChange(null)
    onClearExisting?.()
  }

  const displaySrc = localPreview ?? previewUrl

  return (
    <div className="inv-image-picker">
      <p className="form-pill-block__label">{label}</p>
      <div className="inv-image-picker__row">
        <div className="inv-image-picker__preview">
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displaySrc} alt="" />
          ) : (
            <ImageIcon size={22} weight="duotone" color="#636366" aria-hidden />
          )}
        </div>
        <div className="inv-image-picker__actions">
          <button type="button" className="inv-image-picker__btn" onClick={() => cameraRef.current?.click()}>
            <Camera size={16} weight="duotone" aria-hidden />
            Take photo
          </button>
          <button type="button" className="inv-image-picker__btn" onClick={() => fileRef.current?.click()}>
            <ImageIcon size={16} weight="duotone" aria-hidden />
            Choose photo
          </button>
          {displaySrc ? (
            <button type="button" className="inv-image-picker__remove" onClick={handleClear}>
              <X size={14} aria-hidden />
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="inv-image-picker__input"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="inv-image-picker__input"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </div>
  )
}
