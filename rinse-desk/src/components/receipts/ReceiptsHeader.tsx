import { ArrowDownLeft, ReceiptText, Search, X } from 'lucide-react'

export type ReceiptsSegment = 'expenses' | 'payments'

type Props = {
  segment: ReceiptsSegment
  onSegmentChange: (s: ReceiptsSegment) => void
  expenseCount: number
  paymentCount: number
  query: string
  onQueryChange: (q: string) => void
}

function SegmentTab({
  active,
  onClick,
  icon,
  label,
  count,
  accent,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
  accent: 'emerald' | 'sky'
}) {
  const accentText = accent === 'emerald' ? 'text-brand-600' : 'text-sky-600'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
        active
          ? 'bg-white shadow-[0_1px_0_rgba(11,31,20,0.04),0_8px_24px_-12px_rgba(11,31,20,0.18)] ring-1 ring-ink-200'
          : 'hover:bg-white/60'
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          active
            ? accent === 'emerald'
              ? 'bg-brand-100 text-brand-600'
              : 'bg-sky-100 text-sky-600'
            : 'bg-ink-100 text-ink-400 group-hover:text-ink-600'
        }`}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className={`text-[13px] font-semibold ${active ? 'text-ink-900' : 'text-ink-500'}`}>
          {label}
        </span>
        <span className={`flex items-center gap-1 text-[11px] ${active ? accentText : 'text-ink-400'}`}>
          {count} {count === 1 ? 'record' : 'records'}
        </span>
      </span>
      {active && (
        <span
          className={`absolute -bottom-px left-4 right-4 h-px ${
            accent === 'emerald' ? 'bg-brand-400' : 'bg-sky-400'
          }`}
        />
      )}
    </button>
  )
}

/** Segment tabs + search — page title/nav live in shared Header. */
export function ReceiptsHeader({
  segment,
  onSegmentChange,
  expenseCount,
  paymentCount,
  query,
  onQueryChange,
}: Props) {
  return (
    <div className="px-8 pt-5 pb-4">
      <div className="flex animate-receipts-header-in items-center gap-3">
        <div className="relative flex items-center gap-2 rounded-2xl bg-ink-100 p-1.5 ring-1 ring-ink-200">
          <SegmentTab
            active={segment === 'expenses'}
            onClick={() => onSegmentChange('expenses')}
            icon={<ArrowDownLeft className="h-5 w-5" />}
            label="Expenses"
            count={expenseCount}
            accent="emerald"
          />
          <SegmentTab
            active={segment === 'payments'}
            onClick={() => onSegmentChange('payments')}
            icon={<ReceiptText className="h-5 w-5" />}
            label="Payments"
            count={paymentCount}
            accent="sky"
          />
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={
              segment === 'expenses'
                ? 'Search expenses — vendor, name, category…'
                : 'Search payments — invoice #, client…'
            }
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-9 text-[13px] text-ink-800 transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-brand-50/30 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="hidden items-center gap-1.5 text-[11px] text-ink-400 xl:flex">
          <span className="h-1 w-1 rounded-full bg-ink-300" />
          <span>
            {segment === 'expenses'
              ? 'Field techs can capture receipts from the mobile app'
              : 'Payments mirror paid / partial invoices'}
          </span>
        </div>
      </div>
    </div>
  )
}
