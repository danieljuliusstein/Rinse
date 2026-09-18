import { ArrowRight, CalendarPlus, Plus, Receipt, Search, Smartphone } from 'lucide-react'

type Props = {
  variant?: 'none' | 'no-match'
  onClearFilters?: () => void
  /** Create draft from an existing calendar job. */
  onCreateInvoice?: () => void
  createInvoiceAvailable?: boolean
  creating?: boolean
  /** When no jobs exist yet — send the operator to Calendar. */
  onScheduleJob?: () => void
}

export function EmptyInvoices({
  variant = 'none',
  onClearFilters,
  onCreateInvoice,
  createInvoiceAvailable = false,
  creating = false,
  onScheduleJob,
}: Props) {
  if (variant === 'no-match') {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-ink-200/80 py-16 flex flex-col items-center text-center animate-invoices-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-ink-400" />
        </div>
        <h3 className="text-[15px] font-semibold text-ink-900">No invoices match</h3>
        <p className="text-[13px] text-ink-500 mt-1.5 max-w-xs">
          Try a different status, aging bucket, or search term. Overdue invoices are also filed under{' '}
          <span className="font-semibold text-ink-700">Open</span>.
        </p>
        {onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 h-9 px-4 rounded-lg bg-white ring-1 ring-ink-200 text-[12.5px] font-semibold text-ink-700 hover:bg-ink-50 transition-colors inline-flex items-center gap-1.5"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className="flex-1 flex items-center justify-center px-6 py-10"
      data-tour-target="invoices-panel"
    >
      <div className="max-w-lg w-full text-center animate-invoices-fade-up">
        <div className="relative mx-auto w-44 h-44 mb-8">
          <div className="absolute left-6 top-4 w-24 h-40 rounded-[20px] bg-brand-900 shadow-xl flex flex-col items-center justify-center gap-2 p-3">
            <div className="w-full h-1.5 rounded-full bg-white/10" />
            <div className="w-full h-1.5 rounded-full bg-white/10" />
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mt-1">
              <Smartphone className="w-5 h-5 text-brand-900" strokeWidth={2.5} />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10" />
            <div className="w-3/4 h-1.5 rounded-full bg-white/10" />
          </div>
          <div className="absolute right-0 bottom-2 w-32 bg-white rounded-xl shadow-lg ring-1 ring-ink-200 p-3 animate-invoices-fade-in">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-md bg-brand-100 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <div className="h-1.5 w-14 rounded-full bg-ink-200" />
            </div>
            <div className="h-1.5 w-full rounded-full bg-ink-100 mb-1.5" />
            <div className="h-1.5 w-2/3 rounded-full bg-ink-100 mb-2" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-10 rounded-full bg-brand-500" />
              <div className="h-1.5 w-8 rounded-full bg-ink-100" />
            </div>
          </div>
          <div className="absolute top-16 left-24 text-brand-500">
            <ArrowRight className="w-6 h-6" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-[22px] font-semibold text-ink-900 tracking-tight">No invoices yet</h2>
        <p className="text-[14px] text-ink-500 mt-2 leading-relaxed">
          {createInvoiceAvailable
            ? 'Pick a calendar job to create a draft, then mark it sent and track what’s owed here.'
            : 'Create your first invoice in one step — we’ll schedule a job and open the draft.'}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
          {createInvoiceAvailable && onCreateInvoice ? (
            <button
              type="button"
              data-tour-target="invoices-create"
              disabled={creating}
              onClick={onCreateInvoice}
              className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[13px] font-semibold hover:bg-brand-600 transition shadow-sm relative z-[55] pointer-events-auto disabled:opacity-60"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {creating ? 'Creating…' : 'Create invoice'}
            </button>
          ) : onScheduleJob ? (
            <button
              type="button"
              data-tour-target="invoices-create"
              disabled={creating}
              onClick={onScheduleJob}
              className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[13px] font-semibold hover:bg-brand-600 transition shadow-sm relative z-[55] pointer-events-auto disabled:opacity-60"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {creating ? 'Creating…' : 'Create invoice'}
            </button>
          ) : null}
          {createInvoiceAvailable && onScheduleJob ? (
            <button
              type="button"
              disabled={creating}
              onClick={onScheduleJob}
              className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-white ring-1 ring-ink-200 text-ink-700 text-[13px] font-semibold hover:bg-ink-50 transition disabled:opacity-60"
            >
              <CalendarPlus className="h-4 w-4" />
              New job + invoice
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-7 text-left">
          <div className="rounded-xl bg-white ring-1 ring-ink-200 p-4">
            <div className="w-8 h-8 rounded-lg bg-ink-900 flex items-center justify-center mb-2.5">
              <Smartphone className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-[12.5px] font-semibold text-ink-900">Mobile or Desk</div>
            <div className="text-[11.5px] text-ink-500 mt-0.5 leading-snug">
              Field crews and Desk both create drafts from completed jobs.
            </div>
          </div>
          <div className="rounded-xl bg-white ring-1 ring-ink-200 p-4">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center mb-2.5">
              <Search className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-[12.5px] font-semibold text-ink-900">Collected at the desk</div>
            <div className="text-[11.5px] text-ink-500 mt-0.5 leading-snug">
              Track balances, aging &amp; mark invoices sent or paid.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
