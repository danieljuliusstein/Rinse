import { AlertCircle, ArrowUpRight, ReceiptText } from 'lucide-react'
import type { DeskInvoice } from '@/lib/types'
import { money } from '@/lib/metrics'
import { paymentReceiptDate } from '@/lib/invoice-edit'
import { formatReceiptDate } from '@/components/receipts/categoryMeta'

export type PaymentRowModel = {
  invoice: DeskInvoice
  clientName: string
  subtitle?: string
}

type ListProps = {
  payments: PaymentRowModel[]
  onOpenInvoice: (p: PaymentRowModel) => void
}

function PaymentRow({
  payment,
  index,
  onOpenInvoice,
}: {
  payment: PaymentRowModel
  index: number
  onOpenInvoice: () => void
}) {
  const { invoice } = payment
  const partial = invoice.status !== 'paid' && invoice.amount_paid > 0
  const remaining = Math.max(invoice.total - invoice.amount_paid, 0)
  const invNum = invoice.invoice_number || '—'
  const shortNum = invNum.replace(/^INV-?/i, '') || invNum

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenInvoice}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenInvoice()
        }
      }}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group relative grid animate-receipts-fade-up cursor-pointer grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-ink-200 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-sky-50/40"
    >
      <span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-sky-400 transition-transform duration-200 group-hover:scale-y-100" />

      <div className="flex h-10 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-ink-100 ring-1 ring-ink-200 transition-all group-hover:ring-sky-300">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-ink-400">Invoice</span>
        <span className="text-[12px] font-bold tabular-nums text-ink-900 truncate max-w-full px-1">
          {shortNum}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-medium text-ink-900 transition-colors group-hover:text-sky-700">
            {payment.clientName}
          </p>
          {partial ? (
            <span className="flex animate-receipts-pop-in items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <AlertCircle className="h-2.5 w-2.5" />
              Partial · {money(remaining)} due
            </span>
          ) : (
            <span className="animate-receipts-pop-in rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
              Paid
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-500">
          {payment.subtitle ? (
            <>
              <span className="truncate">{payment.subtitle}</span>
              <span className="text-ink-300">·</span>
            </>
          ) : null}
          <span>{formatReceiptDate(paymentReceiptDate(invoice))}</span>
          {invoice.tip > 0 ? (
            <>
              <span className="text-ink-300">·</span>
              <span className="text-brand-600">+{money(invoice.tip)} tip</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="text-right">
        <p className="text-[15px] font-semibold tabular-nums text-ink-900">
          {money(invoice.amount_paid)}
        </p>
        {partial ? (
          <p className="text-[11px] tabular-nums text-ink-400">of {money(invoice.total)}</p>
        ) : null}
      </div>

      <div className="flex w-8 translate-x-1 justify-end opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
        <span className="flex h-7 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-sky-600">
          Open
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )
}

export function PaymentsList({ payments, onOpenInvoice }: ListProps) {
  const collected = payments.reduce((s, p) => s + p.invoice.amount_paid, 0)
  const partialCount = payments.filter(
    (p) => p.invoice.status !== 'paid' && p.invoice.amount_paid > 0,
  ).length

  return (
    <div className="mx-8 animate-receipts-fade-up overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200 shadow-card">
      <div className="relative flex items-center justify-between overflow-hidden border-b border-ink-200 bg-ink-50 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          {payments.length} payment receipt{payments.length === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-4 text-[12px]">
          {partialCount > 0 ? (
            <span className="text-amber-700">
              {partialCount} partial {partialCount === 1 ? 'payment' : 'payments'}
            </span>
          ) : null}
          <span className="text-ink-500">
            Collected{' '}
            <span className="font-semibold tabular-nums text-ink-900">{money(collected)}</span>
          </span>
        </div>
        <span className="receipts-shimmer-bar pointer-events-none absolute bottom-0 left-0 h-px w-full" />
      </div>

      <div>
        {payments.map((p, i) => (
          <PaymentRow
            key={p.invoice.id}
            payment={p}
            index={i}
            onOpenInvoice={() => onOpenInvoice(p)}
          />
        ))}
      </div>
    </div>
  )
}

export function EmptyPayments({ query }: { query?: string }) {
  if (query) {
    return (
      <div className="mx-8 flex flex-col items-center justify-center rounded-2xl bg-white px-8 py-16 text-center ring-1 ring-ink-200">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
          <ReceiptText className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-[16px] font-semibold text-ink-900">
          No payments match “{query}”
        </h3>
        <p className="mt-1.5 max-w-sm text-[13px] text-ink-500">
          Search by invoice number or client name. Payment receipts appear here automatically once an
          invoice is paid or partially paid.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-8 flex flex-col items-center justify-center rounded-2xl bg-white px-8 py-20 text-center ring-1 ring-ink-200">
      <div className="relative">
        <div className="absolute inset-0 animate-receipts-pulse-ring rounded-2xl bg-sky-200" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
          <ReceiptText className="h-8 w-8" />
        </div>
      </div>
      <h3 className="mt-5 text-[18px] font-semibold text-ink-900">No payment receipts yet</h3>
      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-500">
        When you mark an invoice as paid — or record a partial payment — a receipt lands here
        automatically. You don&apos;t create payment receipts; they mirror what happened in{' '}
        <span className="font-medium text-ink-700">Invoices</span>.
      </p>
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-ink-300 bg-ink-100 px-4 py-2.5 text-[12px] text-ink-500">
        <ArrowUpRight className="h-4 w-4 text-sky-500" />
        Tip: record payments from the Invoices tab
      </div>
    </div>
  )
}
