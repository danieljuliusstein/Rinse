'use client'

import { useEffect } from 'react'
import { Check, PaperPlaneTilt, Receipt, Trash } from '@phosphor-icons/react'

interface InvoiceListContextMenuProps {
  onView: () => void
  onMarkSent: () => void
  onMarkPaid: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
  canMarkSent: boolean
  canMarkPaid: boolean
}

export default function InvoiceListContextMenu({
  onView,
  onMarkSent,
  onMarkPaid,
  onDuplicate,
  onDelete,
  onClose,
  canMarkSent,
  canMarkPaid,
}: InvoiceListContextMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = (fn: () => void) => {
    onClose()
    fn()
  }

  return (
    <div className="row-context-root" role="presentation">
      <button type="button" className="row-context-backdrop" onClick={onClose} aria-label="Close menu" />
      <div className="row-context-menu" role="menu" aria-label="Invoice actions">
        <button type="button" role="menuitem" className="row-context-item" onClick={() => run(onView)}>
          <Receipt size={18} weight="bold" aria-hidden="true" />
          View invoice
        </button>
        {canMarkSent ? (
          <button type="button" role="menuitem" className="row-context-item" onClick={() => run(onMarkSent)}>
            <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />
            Mark sent
          </button>
        ) : null}
        {canMarkPaid ? (
          <button type="button" role="menuitem" className="row-context-item" onClick={() => run(onMarkPaid)}>
            <Check size={18} weight="bold" aria-hidden="true" />
            Mark paid
          </button>
        ) : null}
        <button type="button" role="menuitem" className="row-context-item" onClick={() => run(onDuplicate)}>
          <Receipt size={18} weight="bold" aria-hidden="true" />
          Duplicate
        </button>
        <button
          type="button"
          role="menuitem"
          className="row-context-item row-context-item--danger"
          onClick={() => run(onDelete)}
        >
          <Trash size={18} weight="bold" aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  )
}
