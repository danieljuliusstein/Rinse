import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type {
  DeskClient,
  DeskInvoiceLineItem,
  DeskPackage,
  DeskQuote,
  QuoteStatus,
  VehicleType,
} from '@/lib/types'
import { money, todayISO } from '@/lib/metrics'
import {
  lineAmount,
  newInvoiceLine,
  sumLineAmounts,
} from '@/lib/invoice-edit'

const STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined', 'expired']
const VEHICLE_TYPES: VehicleType[] = ['sedan', 'suv', 'truck', 'van', 'boat', 'other']

export type QuoteEditValues = {
  client_id: string
  package_id: string
  status: QuoteStatus
  date: string
  valid_until: string
  vehicle_type: VehicleType
  location_type: 'mobile' | 'shop'
  notes: string
  package_price: string
  extra_line_items: DeskInvoiceLineItem[]
}

type Props = {
  quote: DeskQuote | null
  clients: DeskClient[]
  packages: DeskPackage[]
  saving?: boolean
  onClose: () => void
  onSave: (values: QuoteEditValues) => void
}

function valuesFromQuote(
  quote: DeskQuote | null,
  clients: DeskClient[],
  packages: DeskPackage[],
): QuoteEditValues {
  const pkg =
    packages.find((p) => p.id === quote?.package_id) ?? packages.find((p) => p.active) ?? packages[0]
  const extras = quote?.extra_line_items ?? []
  const extrasSum = sumLineAmounts(extras)
  const packagePrice = quote
    ? Math.max(0, quote.subtotal - extrasSum)
    : pkg?.base_price ?? 0
  return {
    client_id: quote?.client_id || clients[0]?.id || '',
    package_id: quote?.package_id || pkg?.id || '',
    status: quote?.status ?? 'draft',
    date: quote?.date || todayISO(),
    valid_until: quote?.valid_until || '',
    vehicle_type: quote?.vehicle_type ?? 'sedan',
    location_type: quote?.location_type ?? 'mobile',
    notes: quote?.notes ?? '',
    package_price: String(packagePrice),
    extra_line_items: extras.map((l) => ({ ...l })),
  }
}

export function QuoteEditModal({ quote, clients, packages, saving, onClose, onSave }: Props) {
  const [values, setValues] = useState<QuoteEditValues>(() =>
    valuesFromQuote(quote, clients, packages),
  )

  useEffect(() => {
    setValues(valuesFromQuote(quote, clients, packages))
  }, [quote, clients, packages])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const subtotal = useMemo(() => {
    const base = Number(values.package_price) || 0
    return Math.round((base + sumLineAmounts(values.extra_line_items)) * 100) / 100
  }, [values.package_price, values.extra_line_items])

  const isCreate = !quote

  function updateLine(id: string, patch: Partial<DeskInvoiceLineItem>) {
    setValues((prev) => ({
      ...prev,
      extra_line_items: prev.extra_line_items.map((l) => {
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
    }))
  }

  function onPackageChange(packageId: string) {
    const pkg = packages.find((p) => p.id === packageId)
    setValues((prev) => ({
      ...prev,
      package_id: packageId,
      package_price: String(pkg?.base_price ?? (Number(prev.package_price) || 0)),
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[min(90vh,760px)] flex flex-col">
        <div className="flex items-center justify-between px-5 h-14 border-b border-ink-100 shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-ink-900">
              {isCreate ? 'New quote' : 'Edit quote'}
            </div>
            <div className="text-[11px] text-ink-400">
              {quote?.quote_number || 'Draft estimate'} · {money(subtotal)}
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

        <div className="px-5 py-5 space-y-4 overflow-y-auto thin-scrollbar flex-1 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Client
              </label>
              <select
                value={values.client_id}
                onChange={(e) => setValues((v) => ({ ...v, client_id: e.target.value }))}
                className="mt-1.5 w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] font-medium text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Package
              </label>
              <select
                value={values.package_id}
                onChange={(e) => onPackageChange(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] font-medium text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {money(p.base_price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Date
              </label>
              <input
                type="date"
                value={values.date}
                onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
                className="mt-1.5 w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Valid until
              </label>
              <input
                type="date"
                value={values.valid_until}
                onChange={(e) => setValues((v) => ({ ...v, valid_until: e.target.value }))}
                className="mt-1.5 w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Vehicle
              </label>
              <select
                value={values.vehicle_type}
                onChange={(e) =>
                  setValues((v) => ({ ...v, vehicle_type: e.target.value as VehicleType }))
                }
                className="mt-1.5 w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] font-medium text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Location
              </label>
              <select
                value={values.location_type}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    location_type: e.target.value as 'mobile' | 'shop',
                  }))
                }
                className="mt-1.5 w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] font-medium text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="mobile">Mobile</option>
                <option value="shop">Shop</option>
              </select>
            </div>
          </div>

          {!isCreate ? (
            <div>
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Status
              </label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValues((v) => ({ ...v, status: s }))}
                    className={`px-3 h-8 rounded-lg text-[12px] font-semibold ring-1 transition-colors ${
                      s === values.status
                        ? 'bg-ink-900 text-white ring-ink-900'
                        : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                Pricing
              </label>
              <button
                type="button"
                onClick={() =>
                  setValues((v) => ({
                    ...v,
                    extra_line_items: [...v.extra_line_items, newInvoiceLine()],
                  }))
                }
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100"
              >
                <Plus className="w-3.5 h-3.5" />
                Add line
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_100px] gap-2 items-center">
                <div className="h-9 px-3 rounded-lg ring-1 ring-ink-200 bg-ink-50 flex items-center text-[13px] font-medium text-ink-500">
                  Package
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={values.package_price}
                  onChange={(e) => setValues((v) => ({ ...v, package_price: e.target.value }))}
                  className="h-9 px-2 rounded-lg ring-1 ring-ink-200 text-[13px] font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>
              {values.extra_line_items.map((line) => (
                <div
                  key={line.id}
                  className="grid grid-cols-[1fr_64px_88px_72px_36px] gap-2 items-center"
                >
                  <input
                    value={line.description}
                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                    placeholder="Add-on"
                    className="h-9 px-3 rounded-lg ring-1 ring-ink-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={line.quantity ?? 1}
                    onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) || 0 })}
                    className="h-9 px-2 rounded-lg ring-1 ring-ink-200 text-[13px] tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={line.unit_price ?? 0}
                    onChange={(e) =>
                      updateLine(line.id, { unit_price: Number(e.target.value) || 0 })
                    }
                    className="h-9 px-2 rounded-lg ring-1 ring-ink-200 text-[13px] font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                  <div className="h-9 flex items-center justify-end text-[13px] font-semibold tabular-nums">
                    {money(lineAmount(line))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        extra_line_items: v.extra_line_items.filter((l) => l.id !== line.id),
                      }))
                    }
                    className="h-9 w-9 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right text-[13px] text-ink-500">
              Subtotal{' '}
              <strong className="text-ink-900 tabular-nums">{money(subtotal)}</strong>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
              Notes
            </label>
            <textarea
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              rows={3}
              placeholder="Scope, vehicle notes, deposit terms…"
              className="mt-1.5 w-full px-3 py-2 rounded-lg ring-1 ring-ink-200 text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 h-16 border-t border-ink-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-[13px] font-semibold text-ink-600 hover:bg-ink-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !values.client_id || !values.package_id}
            onClick={() => onSave(values)}
            className="h-9 px-4 rounded-lg bg-ink-900 text-white text-[13px] font-semibold hover:bg-ink-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isCreate ? 'Create quote' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
