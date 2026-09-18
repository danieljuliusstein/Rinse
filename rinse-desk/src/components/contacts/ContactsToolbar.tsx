import {
  Check,
  ChevronDown,
  Columns3,
  Eraser,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { IDENTIFIERS, type ContactIdentifier } from '@/lib/contact-identifier'
import { IDENTIFIER_META } from './identifierMeta'

export type GroupBy = 'none' | 'identifier' | 'account'
export type FilterFlag = 'Has phone' | 'Has email'

export type ContactsToolbarState = {
  query: string
  activeIdentifier: ContactIdentifier | 'All'
  groupBy: GroupBy
  filters: FilterFlag[]
  selectedCount: number
}

type Props = {
  state: ContactsToolbarState
  setState: (s: ContactsToolbarState) => void
  filterOpen: boolean
  setFilterOpen: (b: boolean) => void
  groupOpen: boolean
  setGroupOpen: (b: boolean) => void
  onNewContact: () => void
  onClearNotes: () => void
  onClearSelection: () => void
  busy?: boolean
}

const GROUP_LABEL: Record<GroupBy, string> = {
  none: 'None',
  identifier: 'Identifier',
  account: 'Account',
}

export function ContactsToolbar({
  state,
  setState,
  filterOpen,
  setFilterOpen,
  groupOpen,
  setGroupOpen,
  onNewContact,
  onClearNotes,
  onClearSelection,
  busy,
}: Props) {
  const chips: (ContactIdentifier | 'All')[] = ['All', ...IDENTIFIERS]

  const toggleFilter = (f: FilterFlag) => {
    const has = state.filters.includes(f)
    setState({
      ...state,
      filters: has ? state.filters.filter((x) => x !== f) : [...state.filters, f],
    })
  }

  return (
    <div className="relative z-30 px-5 pt-3 pb-2.5 bg-white border-b border-rinse-border shrink-0">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[420px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rinse-muted"
            strokeWidth={2}
          />
          <input
            value={state.query}
            onChange={(e) => setState({ ...state, query: e.target.value })}
            placeholder="Search name, account, email, location…"
            className="w-full h-9 pl-9 pr-9 rounded-lg bg-rinse-bg border border-rinse-border text-[13px] text-rinse-text placeholder:text-rinse-muted focus:outline-none focus:ring-2 focus:ring-rinse-green/30 focus:border-rinse-green-border transition"
          />
          {state.query ? (
            <button
              type="button"
              onClick={() => setState({ ...state, query: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rinse-muted hover:text-rinse-text"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {state.selectedCount > 0 ? (
            <div className="flex items-center gap-2 animate-contacts-fade-in">
              <span className="text-[12px] font-medium px-2.5 h-8 inline-flex items-center rounded-md bg-rinse-green-soft text-rinse-green-text">
                {state.selectedCount} selected
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={onClearNotes}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-rinse-sidebar-from text-white text-[12.5px] font-medium hover:bg-rinse-sidebar-active transition shadow-sm disabled:opacity-60"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear notes ({state.selectedCount})
              </button>
              <button
                type="button"
                onClick={onClearSelection}
                className="h-8 px-2.5 inline-flex items-center rounded-md border border-rinse-border text-rinse-muted text-[12.5px] hover:bg-rinse-bg transition"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpen(!filterOpen)
                    setGroupOpen(false)
                  }}
                  className={[
                    'h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border text-[12.5px] font-medium transition',
                    state.filters.length > 0 || filterOpen
                      ? 'border-rinse-green-border bg-rinse-green-soft/60 text-rinse-green-text'
                      : 'border-rinse-border bg-white text-rinse-muted hover:bg-rinse-bg',
                  ].join(' ')}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter
                  {state.filters.length > 0 ? (
                    <span className="ml-0.5 h-4 min-w-4 px-1 inline-flex items-center justify-center rounded-full bg-rinse-green-text text-white text-[10px] font-semibold">
                      {state.filters.length}
                    </span>
                  ) : null}
                  <ChevronDown className={`h-3 w-3 transition ${filterOpen ? 'rotate-180' : ''}`} />
                </button>
                {filterOpen ? (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-rinse-border shadow-[0_8px_24px_-8px_rgba(11,31,20,0.18)] p-1.5 z-30 animate-contacts-slide-down">
                    <div className="px-2.5 py-1.5 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold">
                      Contact filters
                    </div>
                    {(['Has phone', 'Has email'] as FilterFlag[]).map((f) => {
                      const on = state.filters.includes(f)
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => toggleFilter(f)}
                          className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md hover:bg-rinse-bg text-[13px] text-rinse-text"
                        >
                          <span
                            className={`h-4 w-4 rounded border grid place-items-center ${
                              on
                                ? 'bg-rinse-green-text border-rinse-green-text'
                                : 'border-rinse-border bg-white'
                            }`}
                          >
                            {on ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
                          </span>
                          {f}
                        </button>
                      )
                    })}
                    <div className="h-px bg-rinse-border my-1" />
                    <button
                      type="button"
                      onClick={() => setState({ ...state, filters: [] })}
                      className="w-full text-left px-2.5 h-8 rounded-md hover:bg-rinse-bg text-[12.5px] text-rinse-muted"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setGroupOpen(!groupOpen)
                    setFilterOpen(false)
                  }}
                  className={[
                    'h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border text-[12.5px] font-medium transition',
                    state.groupBy !== 'none' || groupOpen
                      ? 'border-rinse-green-border bg-rinse-green-soft/60 text-rinse-green-text'
                      : 'border-rinse-border bg-white text-rinse-muted hover:bg-rinse-bg',
                  ].join(' ')}
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  Group: {GROUP_LABEL[state.groupBy]}
                  <ChevronDown className={`h-3 w-3 transition ${groupOpen ? 'rotate-180' : ''}`} />
                </button>
                {groupOpen ? (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-rinse-border shadow-[0_8px_24px_-8px_rgba(11,31,20,0.18)] p-1.5 z-30 animate-contacts-slide-down">
                    <div className="px-2.5 py-1.5 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold">
                      Group by
                    </div>
                    {([
                      { id: 'none' as const, label: 'None' },
                      { id: 'identifier' as const, label: 'Identifier' },
                      { id: 'account' as const, label: 'Account' },
                    ]).map((g) => {
                      const on = state.groupBy === g.id
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setState({ ...state, groupBy: g.id })
                            setGroupOpen(false)
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md hover:bg-rinse-bg text-[13px] text-rinse-text"
                        >
                          <span
                            className={`h-3.5 w-3.5 rounded-full border ${
                              on
                                ? 'bg-rinse-green-text border-rinse-green-text'
                                : 'border-rinse-border'
                            }`}
                          />
                          {g.label}
                          {on ? (
                            <Check className="h-3 w-3 ml-auto text-rinse-green-text" strokeWidth={3} />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                disabled={busy}
                data-tour-target="contacts-add"
                onClick={onNewContact}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-rinse-green-text text-white text-[12.5px] font-semibold hover:bg-rinse-green-hover transition shadow-sm disabled:opacity-60 relative z-[55] pointer-events-auto"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                New contact
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
        {chips.map((c) => {
          const on = state.activeIdentifier === c
          const meta = c === 'All' ? null : IDENTIFIER_META[c]
          return (
            <button
              key={c}
              type="button"
              onClick={() => setState({ ...state, activeIdentifier: c })}
              className={[
                'h-7 px-3 inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium border transition',
                on
                  ? 'bg-rinse-sidebar-from text-white border-rinse-sidebar-from'
                  : 'bg-white text-rinse-muted border-rinse-border hover:border-rinse-muted hover:text-rinse-text',
              ].join(' ')}
            >
              {meta ? <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> : null}
              {c}
            </button>
          )
        })}

        {state.filters.length > 0 || state.query ? (
          <div className="ml-auto flex items-center gap-1.5 text-[11.5px] text-rinse-muted">
            <SlidersHorizontal className="h-3 w-3" />
            {[state.query && `"${state.query}"`, ...state.filters].filter(Boolean).join(' · ')}
          </div>
        ) : null}
      </div>
    </div>
  )
}
