import { ArrowLeft, Search, Smartphone, Sparkles, UserPlus } from 'lucide-react'

export function EmptyNoContacts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex-1 min-h-0 grid place-items-center bg-white px-6 animate-contacts-fade-in">
      <div className="max-w-[560px] w-full text-center">
        <div className="relative mx-auto w-fit mb-7">
          <div className="absolute -inset-6 rounded-full bg-rinse-green/5 blur-2xl" />
          <div className="relative flex items-end gap-3">
            <div className="w-[78px] h-[132px] rounded-[18px] bg-rinse-sidebar-from ring-1 ring-black/10 shadow-[0_8px_24px_-8px_rgba(11,31,20,0.18)] p-2 flex flex-col">
              <div className="h-1 w-6 rounded-full bg-white/20 mx-auto mb-1.5" />
              <div className="flex-1 rounded-lg bg-white/5 p-1.5 flex flex-col gap-1">
                <div className="h-1.5 rounded bg-rinse-green/50 w-3/4" />
                <div className="h-1.5 rounded bg-white/15" />
                <div className="mt-auto h-5 rounded-md bg-rinse-green/80 grid place-items-center">
                  <Smartphone className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
            </div>
            <div className="pb-16 flex flex-col items-center gap-1">
              <Sparkles className="h-4 w-4 text-rinse-green-text" />
              <div className="text-[10px] font-semibold uppercase tracking-wider text-rinse-green-text">
                syncs
              </div>
              <svg width="46" height="10" viewBox="0 0 46 10" fill="none" className="text-rinse-green-text">
                <path
                  d="M0 5h42M38 1l5 4-5 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="w-[150px] h-[110px] rounded-xl bg-white ring-1 ring-rinse-border shadow-card p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-teal-100 text-teal-800 grid place-items-center text-[8px] font-bold">
                  MH
                </div>
                <div className="h-1.5 rounded bg-rinse-text/80 w-16" />
              </div>
              <div className="h-1.5 rounded bg-rinse-border w-20" />
              <div className="h-1.5 rounded bg-rinse-border w-12" />
              <div className="mt-auto flex gap-1">
                <span className="h-3.5 px-1.5 rounded-full bg-[#D1FAE5] text-[#065F46] text-[8px] font-semibold grid place-items-center">
                  Client
                </span>
                <span className="h-3.5 px-1.5 rounded-full bg-[#DBEAFE] text-[#1E40AF] text-[8px] font-semibold grid place-items-center">
                  Account
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-[22px] font-semibold text-rinse-text tracking-tight">No contacts yet</h2>
        <p className="mt-2 text-[13.5px] text-rinse-muted leading-relaxed">
          Clients you create in the <span className="font-medium text-rinse-text">Rinse mobile app</span>{' '}
          will show up here automatically. You can also add one from the desk — this is your client
          workbench for finding people, editing details, and taking quick bulk actions.
        </p>

        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            data-tour-target="contacts-add"
            onClick={onAdd}
            className="tour-armed h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-rinse-green-text text-white text-[13px] font-semibold hover:bg-rinse-green-hover transition shadow-sm relative z-[55] pointer-events-auto"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.4} />
            Add first contact
          </button>
        </div>

        <div className="mt-7 pt-5 border-t border-rinse-border/70 grid grid-cols-3 gap-3 text-left">
          {[
            { t: 'Search fast', d: 'Name, account, email, location, or identifier.' },
            { t: 'Group & filter', d: 'By identifier, account, or required phone/email.' },
            { t: 'Edit inline', d: 'Pencil any row to update details without leaving the list.' },
          ].map((x) => (
            <div key={x.t} className="p-3 rounded-lg bg-rinse-bg/70">
              <div className="text-[12px] font-semibold text-rinse-text">{x.t}</div>
              <div className="text-[11.5px] text-rinse-muted mt-0.5 leading-snug">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EmptyNoMatches({
  onClear,
  query,
  filters,
}: {
  onClear: () => void
  query: string
  filters: string[]
}) {
  return (
    <div className="flex-1 min-h-0 grid place-items-center bg-white px-6 animate-contacts-fade-in">
      <div className="max-w-[440px] w-full text-center">
        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-rinse-bg ring-1 ring-rinse-border grid place-items-center">
          <Search className="h-6 w-6 text-rinse-muted" strokeWidth={2} />
        </div>
        <h2 className="text-[18px] font-semibold text-rinse-text tracking-tight">No matching contacts</h2>
        <p className="mt-2 text-[13px] text-rinse-muted leading-relaxed">
          Nothing matches
          {query ? <span className="font-medium text-rinse-text"> “{query}”</span> : null}
          {filters.length > 0 ? <span> with {filters.join(' + ')}</span> : null}. Try a different search
          term, clear a filter, or widen your identifier chip.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-5 h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-rinse-sidebar-from text-white text-[13px] font-medium hover:bg-rinse-sidebar-active transition shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Clear search & filters
        </button>
      </div>
    </div>
  )
}
