import { Search, type LucideIcon } from 'lucide-react'
import { NAV_ITEMS, GROUP_ORDER, type NavItem, type SectionId } from './types'

export function LeftRail({
  active,
  onSelect,
  query,
  onQuery,
}: {
  active: SectionId
  onSelect: (id: SectionId) => void
  query: string
  onQuery: (q: string) => void
}) {
  const q = query.trim().toLowerCase()
  const matches = (item: NavItem) =>
    q === '' ||
    item.label.toLowerCase().includes(q) ||
    item.group.toLowerCase().includes(q) ||
    item.keywords.some((k) => k.includes(q))

  const filtered = NAV_ITEMS.filter(matches)
  const groupHasMatch = (group: NavItem['group']) => filtered.some((i) => i.group === group)

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="px-3 pt-3">
        <div className="group flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-100/60 px-3 py-2 transition-all duration-150 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10">
          <Search
            size={15}
            className="text-ink-400 transition-colors group-focus-within:text-brand-600"
          />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search settings…"
            className="w-full bg-transparent text-[13px] text-ink-900 placeholder:text-ink-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery('')}
              className="text-[11px] font-medium text-ink-400 transition hover:text-ink-500"
            >
              clear
            </button>
          )}
        </div>
      </div>

      <nav className="settings-thin-scroll mt-2.5 flex-1 overflow-y-auto px-2 pb-4">
        {GROUP_ORDER.map((group) => {
          if (!groupHasMatch(group)) return null
          const items = filtered.filter((i) => i.group === group)
          return (
            <div key={group} className="mb-3">
              <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                {group}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    active={item.id === active}
                    onSelect={() => onSelect(item.id)}
                  />
                ))}
              </ul>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="px-2.5 pt-8 text-center">
            <p className="text-[12.5px] text-ink-400">No matches for “{query}”.</p>
            <button
              type="button"
              onClick={() => onQuery('')}
              className="mt-1.5 text-[12px] font-medium text-brand-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </nav>

      <div className="border-t border-ink-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-settings-pulse-dot absolute inline-flex h-full w-full rounded-full bg-brand-500" />
          </span>
          <p className="text-[11.5px] text-ink-500">Mobile sync · live</p>
        </div>
      </div>
    </aside>
  )
}

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: NavItem
  active: boolean
  onSelect: () => void
}) {
  const Icon: LucideIcon = item.icon
  return (
    <li>
      <button
        type="button"
        data-tour-target={item.id === 'schedule' ? 'settings-schedule-tab' : undefined}
        onClick={onSelect}
        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-all duration-150 ${
          active
            ? 'bg-brand-50 font-medium text-brand-700'
            : 'text-ink-700 hover:bg-ink-100'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" />
        )}
        <Icon
          size={15.5}
          className={`transition-colors ${
            active ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-500'
          }`}
        />
        <span className="truncate">{item.label}</span>
      </button>
    </li>
  )
}
