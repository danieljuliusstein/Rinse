import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { DeskInvoice, DeskInvoiceLineItem, InvoiceStatus } from '@/lib/types'
import { money } from '@/lib/metrics'
import {
  INVOICE_STATUSES,
  lineAmount,
  newInvoiceLine,
  previewInvoiceTotals,
  valuesFromInvoice,
  type InvoiceEditValues,
} from '@/lib/invoice-edit'

const EDITABLE_STATUSES: InvoiceStatus[] = [
  'draft',
  'sent',
  'overdue',
  'partial',
  'paid',
  'void',
  'cancelled',
]

type Props = {
  inv: DeskInvoice
  clientName: string
  saving?: boolean
  onClose: () => void
  onSave: (values: InvoiceEditValues) => void
}

export function InvoiceEditModal({ inv, clientName, saving, onClose, onSave }: Props) {
  const [status, setStatus] = useState<InvoiceStatus>(inv.status)
  const [tip, setTip] = useState('0')
  const [amountPaid, setAmountPaid] = useState('0')
  const [discount, setDiscount] = useState('0')
  const [taxRate, setTaxRate] = useState('0')
  const [po, setPo] = useState('')
  const [jobRevenue, setJobRevenue] = useState('0')
  const [lines, setLines] = useState<DeskInvoiceLineItem[]>([])

  useEffect(() => {
    const v = valuesFromInvoice(inv)
    setStatus(inv.status)
    setTip(v.tip)
    setAmountPaid(v.amount_paid)
    setDiscount(v.discount_amount)
    setTaxRate(v.tax_rate)
    setPo(v.po_number)
    setJobRevenue(v.job_revenue)
    setLines(v.extra_line_items)
  }, [inv])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const draft: InvoiceEditValues = useMemo(
    () => ({
      status,
      tip,
      amount_paid: amountPaid,
      discount_amount: discount,
      tax_rate: taxRate,
      po_number: po,
      job_revenue: jobRevenue,
      extra_line_items: lines,
    }),
    [status, tip, amountPaid, discount, taxRate, po, jobRevenue, lines],
  )

  const preview = useMemo(() => previewInvoiceTotals(draft), [draft])

  function updateLine(id: string, patch: Partial<DeskInvoiceLineItem>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const next = { ...l, ...patch }
        const quantity = typeof next.quantity === 'number' ? next.quantity : 1
        const unit_price =
          typeof next.unit_price === 'number' ? next.unit_price : Number(next.default_amount ?? 0)
        return {
          ...next,
          quantity,
          unit_price,
          default_amount: Math.round(quantity * unit_price * 100) / 100,
        }
      }),
    )
  }

  function submit() {
    onSave(draft)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-invoices-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[min(90vh,760px)] flex flex-col animate-invoices-pop-in">
        <div className="flex items-center justify-between px-5 h-14 border-b border-ink-100 shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-ink-900">Edit invoice</div>
            <div className="text-[11px] text-ink-400">
              {inv.invoice_number} · {clientName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 overflow-y-auto thin-scrollbar flex-1 min-h-0">
          <div>
            <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EDITABLE_STATUSES.map((s) => {
                const label = INVOICE_STATUSES.find((x) => x.value === s)?.label ?? s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 h-8 rounded-lg text-[12px] font-semibold ring-1 transition-colors ${
                      s === status
                        ? 'bg-ink-900 text-white ring-ink-900'
                        : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Line items
              </label>
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, newInvoiceLine()])}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add line
              </button>
            </div>

            <div className="grid grid-cols-[1fr_72px_88px_72px_36px] gap-2 mb-1.5 px-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                Description
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                Qty
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                Price
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 text-right">
                Amount
              </span>
              <span />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_72px_88px_72px_36px] gap-2 items-center">
                <input
                  value="Package / job"
                  readOnly
                  className="h-9 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] font-medium text-ink-500 bg-ink-50"
                />
                <input
                  value="1"
                  readOnly
                  className="h-9 px-2 rounded-lg ring-1 ring-ink-200 text-[13px] tabular-nums text-ink-400 bg-ink-50 text-center"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={jobRevenue}
                  onChange={(e) => setJobRevenue(e.target.value)}
                  className="h-9 px-2 rounded-lg ring-1 ring-ink-200 text-[13px] font-semibold tabular-nums text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                <div className="h-9 flex items-center justify-end text-[13px] font-semibold tabular-nums text-ink-700">
                  {money(Number(jobRevenue) || 0)}
                </div>
                <span />
              </div>

              {lines.map((line) => (
                <div
                  key={line.id}
                  className="grid grid-cols-[1fr_72px_88px_72px_36px] gap-2 items-center"
                >
                  <input
                    value={line.description}
                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                    placeholder="Add-on or fee"
                    className="h-9 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={line.quantity ?? 1}
                    onChange={(e) =>
                      updateLine(line.id, { quantity: Number(e.target.value) || 0 })
                    }
                    className="h-9 px-2 rounded-lg ring-1 ring-ink-200 text-[13px] tabular-nums text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-center"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={line.unit_price ?? 0}
                    onChange={(e) =>
                      updateLine(line.id, { unit_price: Number(e.target.value) || 0 })
                    }
                    className="h-9 px-2 rounded-lg ring-1 ring-ink-200 text-[13px] font-semibold tabular-nums text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                  <div className="h-9 flex items-center justify-end text-[13px] font-semibold tabular-nums text-ink-700">
                    {money(lineAmount(line))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                    className="h-9 w-9 rounded-lg text-ink-400 hover:text-rust-600 hover:bg-rust-50 flex items-center justify-center transition-colors"
                    aria-label="Remove line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Discount $" value={discount} onChange={setDiscount} />
            <Field label="Tax %" value={taxRate} onChange={setTaxRate} />
            <div className="sm:col-span-1 col-span-2">
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                PO number
              </label>
              <input
                value={po}
                onChange={(e) => setPo(e.target.value)}
                placeholder="Optional"
                className="mt-1.5 w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 text-[14px] font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <Field label="Tip" value={tip} onChange={setTip} />
            <Field label="Amount paid" value={amountPaid} onChange={setAmountPaid} />
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Balance due
              </label>
              <div className="mt-1.5 h-10 px-3 rounded-lg ring-1 ring-ink-200 flex items-center text-[14px] font-semibold tabular-nums bg-ink-50 text-ink-500">
                {money(preview.balance_due)}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-ink-50 border border-ink-200 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
            <span className="text-ink-500">
              Subtotal <strong className="text-ink-800 tabular-nums">{money(preview.subtotal)}</strong>
            </span>
            {preview.discount > 0 ? (
              <span className="text-ink-500">
                Discount{' '}
                <strong className="text-ink-800 tabular-nums">−{money(preview.discount)}</strong>
              </span>
            ) : null}
            {preview.tax_amount > 0 ? (
              <span className="text-ink-500">
                Tax <strong className="text-ink-800 tabular-nums">{money(preview.tax_amount)}</strong>
              </span>
            ) : null}
            <span className="text-ink-500">
              Total <strong className="text-ink-900 tabular-nums">{money(preview.total)}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 h-16 border-t border-ink-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-[13px] font-semibold text-ink-600 hover:bg-ink-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="h-9 px-4 rounded-lg bg-ink-900 text-white text-[13px] font-semibold hover:bg-ink-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 text-[14px] font-semibold tabular-nums text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
      />
    </div>
  )
}
