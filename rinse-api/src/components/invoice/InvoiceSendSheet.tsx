'use client'

import { Copy, Envelope, FilePdf, Link as LinkIcon } from '@phosphor-icons/react'
import { VaulSheet, QrCode } from '@/components/ui'

interface InvoiceSendSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canEmail: boolean
  onEmail: () => void
  onCopyLink: () => void
  onPdf: () => void
  busy?: boolean
  linkCopied?: boolean
  payUrl?: string
}

export default function InvoiceSendSheet({
  open,
  onOpenChange,
  canEmail,
  onEmail,
  onCopyLink,
  onPdf,
  busy = false,
  linkCopied = false,
  payUrl,
}: InvoiceSendSheetProps) {
  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Send invoice">
      {payUrl ? <QrCode value={payUrl} label="Scan to view or pay" className="invoice-send-qr" /> : null}
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
      <button
        type="button"
        className="vaul-option"
        disabled={busy}
        onClick={() => {
          onCopyLink()
        }}
      >
        <span className="invoice-sheet-option">
          <LinkIcon size={20} weight="duotone" />
          {linkCopied ? 'Link copied' : 'Copy payment link'}
        </span>
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
          Download PDF
        </span>
      </button>
      <button type="button" className="vaul-option vaul-option--muted" onClick={() => onOpenChange(false)}>
        <span className="invoice-sheet-option">
          <Copy size={20} weight="duotone" />
          Close
        </span>
      </button>
    </VaulSheet>
  )
}
