import { Pencil } from 'lucide-react'
import type { DeskExpense } from '@/lib/types'
import { money } from '@/lib/metrics'
import { formatReceiptDate, resolveCategoryMeta } from '@/components/receipts/categoryMeta'
import { ReceiptThumb } from '@/components/receipts/ReceiptThumb'

type Props = {
  expenses: DeskExpense[]
  onOpenReceipt: (e: DeskExpense) => void
  onEdit: (e: DeskExpense) => void
}

function ExpenseRow({
  expense,
  index,
  onOpenReceipt,
  onEdit,
}: {
  expense: DeskExpense
  index: number
  onOpenReceipt: (e: DeskExpense) => void
  onEdit: (e: DeskExpense) => void
}) {
  const meta = resolveCategoryMeta(expense.category)
  const Icon = meta.icon
  const label = expense.name || expense.description

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(expense)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit(expense)
        }
      }}
      style={{ animationDelay: `${index * 50}ms` }}
      className="group relative grid animate-receipts-fade-up cursor-pointer grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-ink-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-brand-50/40"
    >
      <span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-brand-400 transition-transform duration-200 group-hover:scale-y-100" />

      <ReceiptThumb
        url={expense.receipt_url}
        alt={`Receipt for ${label}`}
        onClick={(e) => {
          e.stopPropagation()
          if (expense.receipt_url) onOpenReceipt(expense)
        }}
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-medium text-ink-900 transition-colors group-hover:text-brand-700">
            {label}
          </p>
          {!expense.receipt_url && (
            <span className="hidden rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-400 sm:inline">
              no receipt
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-500">
          <span className="flex items-center gap-1">
            <span className={`flex h-4 w-4 items-center justify-center rounded ${meta.tint} ${meta.text}`}>
              <Icon className="h-2.5 w-2.5" />
            </span>
            {meta.label}
          </span>
          {expense.vendor ? (
            <>
              <span className="text-ink-300">·</span>
              <span className="truncate">{expense.vendor}</span>
            </>
          ) : null}
          <span className="text-ink-300">·</span>
          <span>{formatReceiptDate(expense.date)}</span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-[15px] font-semibold tabular-nums text-ink-900">−{money(expense.amount)}</p>
      </div>

      <div className="flex w-8 justify-end opacity-0 transition-opacity group-hover:opacity-100">
        <span className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-white hover:text-brand-600">
          <Pencil className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )
}

export function ExpensesList({ expenses, onOpenReceipt, onEdit }: Props) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="mx-8 animate-receipts-fade-up overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200 shadow-card">
      <div className="relative flex items-center justify-between overflow-hidden border-b border-ink-200 bg-ink-50 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          {expenses.length} expense{expenses.length === 1 ? '' : 's'}
        </p>
        <p className="text-[12px] text-ink-500">
          Total spend <span className="font-semibold tabular-nums text-ink-900">{money(total)}</span>
        </p>
        <span className="receipts-shimmer-bar pointer-events-none absolute bottom-0 left-0 h-px w-full" />
      </div>

      <div>
        {expenses.map((e, i) => (
          <ExpenseRow
            key={e.id}
            expense={e}
            index={i}
            onOpenReceipt={onOpenReceipt}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  )
}
