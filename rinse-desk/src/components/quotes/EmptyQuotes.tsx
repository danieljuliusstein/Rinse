import { FileText, Plus, Search } from 'lucide-react'

type Props = {
  variant?: 'none' | 'no-match'
  onClearFilters?: () => void
  onCreate?: () => void
}

export function EmptyQuotes({ variant = 'none', onClearFilters, onCreate }: Props) {
  if (variant === 'no-match') {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-ink-200/80 py-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-ink-400" />
        </div>
        <h3 className="text-[15px] font-semibold text-ink-900">No quotes match</h3>
        <p className="text-[13px] text-ink-500 mt-1.5 max-w-xs">
          Try a different status or search term.
        </p>
        {onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 h-9 px-4 rounded-lg bg-white ring-1 ring-ink-200 text-[12.5px] font-semibold text-ink-700 hover:bg-ink-50 transition-colors"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mb-5">
        <FileText className="w-7 h-7 text-brand-600" />
      </div>
      <h2 className="text-[18px] font-bold text-ink-900 tracking-tight">No quotes yet</h2>
      <p className="text-[13px] text-ink-500 mt-2 max-w-sm text-center leading-relaxed">
        Send price estimates before you put a job on the calendar. Same quotes as mobile.
      </p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[13px] font-semibold hover:bg-brand-600 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New quote
        </button>
      ) : null}
    </div>
  )
}
