'use client'

import BottomSheet from '@/components/BottomSheet'

export interface ConfirmSheetProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmSheet({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <BottomSheet
      variant="light"
      title={title}
      onClose={onCancel}
      footer={
        <div className="confirm-sheet__footer">
          <button
            type="button"
            className={[
              'confirm-sheet__confirm',
              destructive ? 'confirm-sheet__confirm--danger' : 'confirm-sheet__confirm--primary',
            ].join(' ')}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" className="confirm-sheet__cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      }
    >
      <p className="confirm-sheet__message">{message}</p>
    </BottomSheet>
  )
}
