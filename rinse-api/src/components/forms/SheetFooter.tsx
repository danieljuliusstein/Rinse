'use client'

import { Trash } from '@phosphor-icons/react'
import type { MouseEvent, ReactNode } from 'react'
import SheetSubmitButton from './SheetSubmitButton'

interface Props {
  saveLabel?: string
  cancelLabel?: string
  deleteLabel?: string
  ready?: boolean
  done?: boolean
  saving?: boolean
  disabled?: boolean
  layout?: 'split' | 'stacked' | 'save-only'
  onSave: (e?: MouseEvent<HTMLButtonElement>) => void
  onCancel?: () => void
  onDelete?: () => void
  extra?: ReactNode
}

export default function SheetFooter({
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  deleteLabel = 'Delete',
  ready = true,
  done = false,
  saving = false,
  disabled = false,
  layout = 'split',
  onSave,
  onCancel,
  onDelete,
  extra,
}: Props) {
  const label = done ? '✓ Saved' : saving ? 'Saving…' : saveLabel

  if (layout === 'save-only') {
    return (
      <SheetSubmitButton
        label={label}
        ready={ready}
        done={done}
        disabled={disabled || saving || done}
        onClick={onSave}
      />
    )
  }

  return (
    <div className={`sheet-footer sheet-footer--${layout}`}>
      {onDelete ? (
        <button
          type="button"
          className="sheet-footer__delete"
          disabled={saving}
          onClick={onDelete}
        >
          <Trash size={16} weight="bold" aria-hidden="true" />
          {deleteLabel}
        </button>
      ) : null}
      <div className="sheet-footer__actions">
        <SheetSubmitButton
          label={label}
          ready={ready}
          done={done}
          disabled={disabled || saving || done}
          onClick={onSave}
        />
        {onCancel && layout !== 'stacked' ? (
          <button
            type="button"
            className="sheet-footer__cancel"
            disabled={saving}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        ) : null}
      </div>
      {onCancel && layout === 'stacked' ? (
        <button
          type="button"
          className="sheet-footer__cancel sheet-footer__cancel--full"
          disabled={saving}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      ) : null}
      {extra}
    </div>
  )
}
