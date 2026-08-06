import type { InvoiceStatus } from '@/lib/types'

const STYLES: Record<InvoiceStatus, { label: string; cls: string; dot: string }> = {
  draft: {
    label: 'Draft',
    cls: 'bg-ink-100 text-ink-600 ring-ink-200',
    dot: 'bg-ink-400',
  },
  sent: {
    label: 'Sent',
    cls: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  overdue: {
    label: 'Overdue',
    cls: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
  partial: {
    label: 'Partial',
    cls: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    cls: 'bg-brand-50 text-brand-700 ring-brand-200',
    dot: 'bg-brand-500',
  },
  void: {
    label: 'Void',
    cls: 'bg-ink-100 text-ink-500 ring-ink-200',
    dot: 'bg-ink-400',
  },
  cancelled: {
    label: 'Cancelled',
    cls: 'bg-ink-100 text-ink-500 ring-ink-200',
    dot: 'bg-ink-400',
  },
}

export function StatusChip({ status }: { status: InvoiceStatus }) {
  const s = STYLES[status] ?? STYLES.sent
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset ${s.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
