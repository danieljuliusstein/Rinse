'use client'

import { Copy, Envelope, FilePdf, Link as LinkIcon } from '@phosphor-icons/react'
import { VaulSheet } from '@/components/ui'

interface QuoteSendSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canEmail: boolean
  onEmail: () => void
  onCopyLink: () => void
  onPdf: () => void
  busy?: boolean
  linkCopied?: boolean
}

export default function QuoteSendSheet({
  open,
  onOpenChange,
  canEmail,
  onEmail,
  onCopyLink,
  onPdf,
  busy = false,
  linkCopied = false,
}: QuoteSendSheetProps) {
  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Send quote">
      {canEmail ? (
        <button
          type="button"
          className="vaul-option"
          disabled={busy}
          onClick={() => {
            onEmail()
            onOpenChange(false)
          }}
        >
          <span className="invoice-sheet-option">
            <Envelope size={20} weight="duotone" />
            Send via email
          </span>
        </button>
      ) : null}
      <button type="button" className="vaul-option" disabled={busy} onClick={() => onCopyLink()}>
        <span className="invoice-sheet-option">
          <LinkIcon size={20} weight="duotone" />
          {linkCopied ? 'Link copied' : 'Copy client link'}
        </span>
        {linkCopied ? ' ✓' : null}
      </button>
      <button
        type="button"
        className="vaul-option"
        disabled={busy}
        onClick={() => {
          onPdf()
          onOpenChange(false)
        }}
      >
        <span className="invoice-sheet-option">
          <FilePdf size={20} weight="duotone" />
          Export PDF
        </span>
      </button>
      <button
        type="button"
        className="vaul-option"
        disabled={busy}
        onClick={() => {
          onCopyLink()
          onOpenChange(false)
        }}
      >
        <span className="invoice-sheet-option">
          <Copy size={20} weight="duotone" />
          Mark sent & copy link
        </span>
      </button>
    </VaulSheet>
  )
}
