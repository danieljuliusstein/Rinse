'use client'

import { useEffect } from 'react'
import { PencilSimple, Trash } from '@phosphor-icons/react'

interface RowContextMenuProps {
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

export default function RowContextMenu({ onEdit, onDelete, onClose }: RowContextMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="row-context-root" role="presentation">
      <button type="button" className="row-context-backdrop" onClick={onClose} aria-label="Close menu" />
      <div className="row-context-menu" role="menu" aria-label="Item actions">
        <button
          type="button"
          role="menuitem"
          className="row-context-item"
          onClick={() => {
            onClose()
            onEdit()
          }}
        >
          <PencilSimple size={18} weight="bold" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          role="menuitem"
          className="row-context-item row-context-item--danger"
          onClick={() => {
            onClose()
            onDelete()
          }}
        >
          <Trash size={18} weight="bold" aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  )
}
