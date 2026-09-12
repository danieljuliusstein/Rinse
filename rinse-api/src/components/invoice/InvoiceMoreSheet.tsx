'use client'

import {
  Copy,
  DotsThree,
  PencilSimple,
  SlidersHorizontal,
  Trash,
} from '@phosphor-icons/react'
import { VaulSheet } from '@/components/ui'

interface InvoiceMoreSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdjust: () => void
  onDuplicate: () => void
  onDelete: () => void
  onCustomize: () => void
  busy?: boolean
}

export default function InvoiceMoreSheet({
  open,
  onOpenChange,
  onAdjust,
  onDuplicate,
  onDelete,
  onCustomize,
  busy = false,
}: InvoiceMoreSheetProps) {
  const run = (fn: () => void) => {
    onOpenChange(false)
    fn()
  }

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Invoice options">
      <button type="button" className="vaul-option" disabled={busy} onClick={() => run(onAdjust)}>
        <span className="invoice-sheet-option">
          <SlidersHorizontal size={20} weight="duotone" />
          Discount, tax & PO
        </span>
      </button>
      <button type="button" className="vaul-option" disabled={busy} onClick={() => run(onCustomize)}>
        <span className="invoice-sheet-option">
          <PencilSimple size={20} weight="duotone" />
          Customize template
        </span>
      </button>
      <button type="button" className="vaul-option" disabled={busy} onClick={() => run(onDuplicate)}>
        <span className="invoice-sheet-option">
          <Copy size={20} weight="duotone" />
          Duplicate invoice
        </span>
      </button>
      <button
        type="button"
        className="vaul-option invoice-sheet-option--danger"
        disabled={busy}
        onClick={() => run(onDelete)}
      >
        <span className="invoice-sheet-option">
          <Trash size={20} weight="duotone" />
          Delete invoice
        </span>
      </button>
    </VaulSheet>
  )
}

/** Header button to open more sheet */
export function InvoiceMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="page-header__action" onClick={onClick} aria-label="More options">
      <DotsThree size={24} weight="bold" />
    </button>
  )
}
