'use client'

import { useRef } from 'react'
import { Camera, Images } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import { SheetFooter } from '@/components/forms'

interface AddJobPhotoSheetProps {
  sectionLabel: string
  onPhotoSelected: (file: File) => void
  onClose: () => void
}

export default function AddJobPhotoSheet({
  sectionLabel,
  onPhotoSelected,
  onClose,
}: AddJobPhotoSheetProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    onPhotoSelected(file)
  }

  return (
    <BottomSheet
      variant="light"
      title={`Add ${sectionLabel.toLowerCase()} photo`}
      subtitle="Capture progress or completion shots for this job"
      ariaLabel={`Add ${sectionLabel} photo`}
      onClose={onClose}
      footer={
        <SheetFooter layout="save-only" saveLabel="Cancel" ready onSave={onClose} />
      }
    >
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <div className="photo-picker-actions">
        <button type="button" className="photo-picker-row" onClick={() => cameraRef.current?.click()}>
          <span className="photo-picker-row__icon">
            <Camera size={18} weight="duotone" aria-hidden="true" />
          </span>
          <span>
            <div className="photo-picker-row__title">Take photo</div>
            <div className="photo-picker-row__sub">Opens camera · best on the job</div>
          </span>
        </button>

        <button type="button" className="photo-picker-row" onClick={() => libraryRef.current?.click()}>
          <span className="photo-picker-row__icon">
            <Images size={18} weight="duotone" aria-hidden="true" />
          </span>
          <span>
            <div className="photo-picker-row__title">Photo library</div>
            <div className="photo-picker-row__sub">Choose from camera roll</div>
          </span>
        </button>
      </div>
    </BottomSheet>
  )
}
