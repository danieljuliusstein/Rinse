import { useEffect } from 'react'
import { AlertCircle, ArrowUpRight, FileText, X } from 'lucide-react'
import type { DeskInvoice } from '@/lib/types'
import { money } from '@/lib/metrics'
import { paymentReceiptDate } from '@/lib/invoice-edit'
import { formatReceiptDateLong } from '@/components/receipts/categoryMeta'

type Props = {
  invoice: DeskInvoice | null
  clientName: string
  subtitle?: string
  onClose: () => void
  onOpenInvoices: () => void
}

export function InvoicePeek({
  invoice,
  clientName,
  subtitle,
  onClose,
  onOpenInvoices,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (invoice) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [invoice, onClose])

  if (!invoice) return null

  const partial = invoice.status !== 'paid' && invoice.amount_paid > 0
  const remaining = Math.max(invoice.total - invoice.amount_paid, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/85 p-8 backdrop-blur-md animate-receipts-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-receipts-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-ink-200 bg-ink-50 px-6 py-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-600">
            <FileText className="h-3.5 w-3.5" />
            Invoice peek
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <h3 className="text-[20px] font-bold tabular-nums text-ink-900">
              {invoice.invoice_number || 'Invoice'}
            </h3>
            {partial ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <AlertCircle className="h-3 w-3" />
                Partial payment
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                Paid in full
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-500">{clientName}</p>
          {subtitle ? <p className="text-[12px] text-ink-400">{subtitle}</p> : null}
        </div>

        <div className="px-6 py-5">
          <div className="space-y-3 text-[13px]">
            <Row label="Invoice total" value={money(invoice.total)} />
            <Row label="Amount paid" value={money(invoice.amount_paid)} strong />
            {partial ? (
              <Row label="Remaining balance" value={money(remaining)} accent="amber" />
            ) : null}
            {invoice.tip > 0 ? (
              <Row label="Tip" value={`+${money(invoice.tip)}`} accent="emerald" />
            ) : null}
            <div className="my-1 border-t border-dashed border-ink-300" />
            <Row label="Status" value={invoice.status} />
            <Row label="Payment date" value={formatReceiptDateLong(paymentReceiptDate(invoice))} />
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-ink-300 bg-ink-100 p-3">
            <p className="text-[11px] leading-relaxed text-ink-500">
              This is a peek, not the full editor. Editing the invoice happens in the{' '}
              <span className="font-medium text-ink-700">Invoices</span> tab.
            </p>
          </div>
        </div>

        <div className="border-t border-ink-200 px-6 py-4">
          <button
            type="button"
            onClick={onOpenInvoices}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink-900 py-2.5 text-[13px] font-semibold text-white hover:bg-ink-800"
          >
            Open in Invoices
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string
  value: string
  strong?: boolean
  accent?: 'amber' | 'emerald'
}) {
  const valueClass = strong
    ? 'font-semibold text-ink-900'
    : accent === 'amber'
      ? 'font-semibold text-amber-700'
      : accent === 'emerald'
        ? 'font-semibold text-brand-600'
        : 'text-ink-700'
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-500">{label}</span>
      <span className={`tabular-nums ${valueClass}`}>{value}</span>
    </div>
  )
}
