import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { DeskInvoice, InvoiceStatus } from '@/lib/types'
import { money } from '@/lib/metrics'
import { INVOICE_STATUSES, type InvoiceEditValues } from '@/lib/invoice-edit'

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
  const [total, setTotal] = useState(String(inv.total))
  const [amountPaid, setAmountPaid] = useState(String(inv.amount_paid))
  const [tip, setTip] = useState(String(inv.tip))

  useEffect(() => {
    setStatus(inv.status)
    setTotal(String(inv.total))
    setAmountPaid(String(inv.amount_paid))
    setTip(String(inv.tip))
  }, [inv])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const totalN = Number(total) || 0
  const paidN = Number(amountPaid) || 0
  const balance = Math.max(0, totalN - paidN)

  function submit() {
    onSave({
      status,
      total,
      amount_paid: amountPaid,
      tip,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-invoices-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-invoices-pop-in">
        <div className="flex items-center justify-between px-5 h-14 border-b border-ink-100">
          <div>
            <div className="text-[15px] font-semibold text-ink-900">Light edit</div>
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

        <div className="px-5 py-5 space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Total" value={total} onChange={setTotal} />
            <Field label="Amount paid" value={amountPaid} onChange={setAmountPaid} />
            <Field label="Tip" value={tip} onChange={setTip} />
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Balance due
              </label>
              <div className="mt-1.5 h-10 px-3 rounded-lg ring-1 ring-ink-200 flex items-center text-[14px] font-semibold tabular-nums bg-ink-50 text-ink-500">
                {money(balance)}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-brand-50 border border-brand-200 px-3 py-2.5 text-[11.5px] text-brand-700 flex items-start gap-2">
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Desk-light edits only. Line items, packages &amp; tax live on the mobile invoice
              builder.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 h-16 border-t border-ink-100">
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
