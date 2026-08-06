import { useEffect, useState } from 'react'
import { Save, X } from 'lucide-react'
import type { DeskExpense } from '@/lib/types'
import {
  EXPENSE_CATEGORIES,
  CATEGORY_META,
  type KnownExpenseCategory,
  resolveCategoryMeta,
} from '@/components/receipts/categoryMeta'

type Props = {
  expense: DeskExpense | null
  saving?: boolean
  onClose: () => void
  onSave: (values: {
    description: string
    amount: number
    date: string
    category: string
  }) => void
}

export function ExpenseEditPanel({ expense, saving, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState<KnownExpenseCategory | 'Other'>('Supplies')
  const [customCategory, setCustomCategory] = useState('')

  useEffect(() => {
    if (!expense) return
    setName(expense.name || expense.description)
    setAmount(String(expense.amount))
    setDate(expense.date || '')
    const resolved = resolveCategoryMeta(expense.category)
    if (resolved.key === 'Other' && expense.category?.trim()) {
      setCategory('Other')
      setCustomCategory(expense.category.trim())
    } else if (resolved.key !== 'Other') {
      setCategory(resolved.key)
      setCustomCategory('')
    } else {
      setCategory('Supplies')
      setCustomCategory('')
    }
  }, [expense])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (expense) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expense, onClose])

  if (!expense) return null

  function submit() {
    const trimmed = name.trim()
    if (!trimmed || !amount) return
    const cat =
      category === 'Other'
        ? customCategory.trim() || expense!.category || ''
        : category
    onSave({
      description: trimmed,
      amount: Number(amount) || 0,
      date,
      category: cat,
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-ink-900/60 backdrop-blur-sm animate-receipts-fade-in"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-[400px] flex-col bg-white shadow-2xl animate-receipts-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
              Light edit
            </p>
            <h3 className="mt-0.5 text-[15px] font-semibold text-ink-900">Expense details</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto thin-scrollbar px-5 py-5">
          <div className="flex items-center gap-3 rounded-xl bg-ink-100 p-3 ring-1 ring-ink-200">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-ink-200">
              {expense.receipt_url ? (
                <img src={expense.receipt_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full rounded-lg border border-dashed border-ink-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-ink-500">
                {expense.receipt_url ? 'Receipt attached' : 'No receipt photo'}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-500">
                Receipt photos are captured on mobile — view-only here.
              </p>
            </div>
          </div>

          <Field label="Description">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 focus:border-brand-400 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-400">
                  $
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-6 pr-3 text-[13px] tabular-nums text-ink-900 focus:border-brand-400 focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Category">
            <div className="grid grid-cols-3 gap-1.5">
              {EXPENSE_CATEGORIES.map((c) => {
                const m = CATEGORY_META[c]
                const Icon = m.icon
                const active = c === category
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-2 text-[12px] transition-all ${
                      active
                        ? `border-transparent ${m.tint} ${m.text} ring-1 ${m.ring}`
                        : 'border-ink-200 bg-white text-ink-500 hover:bg-ink-100'
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{c}</span>
                  </button>
                )
              })}
            </div>
            {category === 'Other' ||
            (expense.category &&
              !EXPENSE_CATEGORIES.some(
                (c) => c.toLowerCase() === expense.category!.trim().toLowerCase(),
              )) ? (
              <input
                value={customCategory}
                onChange={(e) => {
                  setCategory('Other')
                  setCustomCategory(e.target.value)
                }}
                placeholder="Custom category"
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            ) : null}
          </Field>

          <div className="rounded-xl border border-dashed border-ink-300 bg-ink-100 p-3">
            <p className="text-[11px] leading-relaxed text-ink-400">
              Vendor and receipt photo stay on the original entry. This panel adjusts name, amount,
              date, and category.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-ink-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-[13px] font-medium text-ink-600 hover:bg-ink-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </aside>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        {label}
      </label>
      {children}
    </div>
  )
}
