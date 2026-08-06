import { useState } from 'react'
import { AlertTriangle, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'
import {
  FILTERS,
  TYPE_META,
  localTime,
  relativeTime,
  type ActivityFilter,
  type ActivityRow,
} from './activityMeta'

type Props = {
  activities: ActivityRow[]
  filter: ActivityFilter
  onFilterChange: (f: ActivityFilter) => void
  editingId: string | null
  onEdit: (a: ActivityRow) => void
  onDelete: (id: string) => void
  onRefresh: () => void
  refreshing: boolean
  loading?: boolean
}

export function Timeline({
  activities,
  filter,
  onFilterChange,
  editingId,
  onEdit,
  onDelete,
  onRefresh,
  refreshing,
  loading,
}: Props) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = activities.filter((a) => {
    if (filter !== 'all' && a.type !== filter) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      return (
        a.subject.toLowerCase().includes(q) ||
        a.contactName.toLowerCase().includes(q) ||
        (a.dealLabel?.toLowerCase().includes(q) ?? false) ||
        a.body.toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = FILTERS.map((f) => ({
    ...f,
    count: f.key === 'all' ? activities.length : activities.filter((a) => a.type === f.key).length,
  }))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-ink-200/70 px-6 pb-4 pt-5">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {counts.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(f.key)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all',
                    active
                      ? 'bg-ink-900 text-white shadow-card'
                      : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:text-ink-900 hover:ring-ink-300',
                  ].join(' ')}
                >
                  {f.label}
                  <span
                    className={[
                      'rounded-full px-1.5 py-0.5 text-[10.5px] tabular-nums',
                      active ? 'bg-white/15 text-white' : 'bg-ink-100 text-ink-500',
                    ].join(' ')}
                  >
                    {f.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search activities…"
                className="w-40 rounded-lg border border-ink-200 bg-white py-1.5 pl-8 pr-3 text-[12.5px] text-ink-900 placeholder-ink-400 outline-none transition-colors focus:border-brand-500 lg:w-56"
              />
            </div>
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh"
              className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-900"
            >
              <RefreshCw className={['h-4 w-4', refreshing || loading ? 'animate-spin' : ''].join(' ')} />
            </button>
          </div>
        </div>
      </div>

      <div className="activities-scroll flex-1 overflow-y-auto px-6 py-4">
        {loading && activities.length === 0 ? (
          <p className="py-12 text-center text-[13px] text-ink-400">Loading activities…</p>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} hasActivities={activities.length > 0} query={query} />
        ) : (
          <ul className="space-y-2">
            {filtered.map((a) => {
              const meta = TYPE_META[a.type]
              const Icon = meta.icon
              const isEditing = editingId === a.id
              const isPendingDelete = pendingDelete === a.id
              return (
                <li
                  key={a.id}
                  className={[
                    'group relative rounded-xl border bg-white transition-all animate-activities-fade-in',
                    isEditing
                      ? 'border-brand-500 shadow-card ring-2 ring-brand-100'
                      : 'border-ink-200/70 hover:border-ink-300 hover:shadow-card',
                  ].join(' ')}
                >
                  <span
                    className={['absolute bottom-3 left-0 top-3 w-1 rounded-r-full', meta.dot].join(' ')}
                  />
                  <div className="flex items-start gap-3 py-3.5 pl-4 pr-3">
                    <div
                      className={[
                        'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                        meta.iconBg,
                      ].join(' ')}
                    >
                      <Icon className={['h-4 w-4', meta.iconColor].join(' ')} strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-0.5 flex items-center gap-2">
                            <span
                              className={[
                                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                                meta.chip,
                              ].join(' ')}
                            >
                              {meta.label}
                            </span>
                            {isEditing ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-brand-600">
                                <Pencil className="h-2.5 w-2.5" /> Editing
                              </span>
                            ) : null}
                          </div>
                          <h3 className="truncate text-[13.5px] font-semibold text-ink-900">
                            {a.subject}
                          </h3>
                          <p className="mt-0.5 text-[12px] text-ink-600">
                            {a.contactName}
                            {a.dealLabel ? (
                              <span className="text-ink-400"> · {a.dealLabel}</span>
                            ) : null}
                          </p>
                          {a.body ? (
                            <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">
                              {a.body}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <time
                            className="whitespace-nowrap text-[11px] tabular-nums text-ink-400"
                            title={localTime(a.at)}
                          >
                            {relativeTime(a.at)}
                          </time>
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => onEdit(a)}
                              title="Edit"
                              className="grid h-7 w-7 place-items-center rounded-md text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(a.id)}
                              title="Delete"
                              className="grid h-7 w-7 place-items-center rounded-md text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isPendingDelete ? (
                    <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-xl bg-white/95 px-4 backdrop-blur-sm animate-activities-fade-in">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                      <span className="text-[12.5px] text-ink-700">
                        Delete this activity? This can&rsquo;t be undone.
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingDelete(null)}
                          className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-600 transition-colors hover:bg-ink-100"
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(a.id)
                            setPendingDelete(null)
                          }}
                          className="rounded-md bg-red-500 px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function EmptyState({
  filter,
  hasActivities,
  query,
}: {
  filter: ActivityFilter
  hasActivities: boolean
  query: string
}) {
  if (hasActivities && filter !== 'all') {
    const label = TYPE_META[filter].label.toLowerCase()
    return (
      <div className="grid h-full place-items-center py-16 animate-activities-fade-in">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 ring-1 ring-ink-200">
            <Search className="h-6 w-6 text-ink-400" />
          </div>
          <h3 className="text-[15px] font-semibold text-ink-900">
            No {label}s logged {query ? 'matching your search' : ''}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
            {query
              ? 'Try a different search term, or clear the filter to see every touchpoint.'
              : `Switch the filter to All, or log a new ${label} from the panel on the left.`}
          </p>
        </div>
      </div>
    )
  }

  if (hasActivities && query) {
    return (
      <div className="grid h-full place-items-center py-16 animate-activities-fade-in">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 ring-1 ring-ink-200">
            <Search className="h-6 w-6 text-ink-400" />
          </div>
          <h3 className="text-[15px] font-semibold text-ink-900">
            No activities match &ldquo;{query}&rdquo;
          </h3>
          <p className="mt-1.5 text-[13px] text-ink-500">
            Try a different client, subject, or keyword.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-full place-items-center py-12 animate-activities-fade-in">
      <div className="max-w-md px-6 text-center">
        <div className="relative mx-auto mb-6 w-fit">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 shadow-card ring-1 ring-brand-200">
            <DropletStack />
          </div>
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white shadow-card ring-1 ring-ink-200">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-500" />
          </span>
        </div>
        <h2 className="text-[19px] font-semibold tracking-tight text-ink-900">
          Log your first touchpoint
        </h2>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-500">
          Every call, email, note, and meeting you log against a client lives here as a running
          timeline — so the next person at the desk picks up right where you left off.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2.5 text-left">
          <Hint color="brand" icon="phone" label="Log a call" desc="Voicemails, follow-ups, slot confirmations" />
          <Hint color="teal" icon="mail" label="Log an email" desc="Quotes, proposals, membership terms" />
          <Hint color="amber" icon="note" label="Drop a note" desc="Gate codes, upcharges, site-visit details" />
          <Hint color="blue" icon="calendar" label="Log a meeting" desc="In-shop consults, walkthroughs, pickups" />
        </div>

        <p className="mt-6 text-[11.5px] text-ink-400">
          Start on the left — pick a client, choose a type, and save.
        </p>
      </div>
    </div>
  )
}

function Hint({
  color,
  icon,
  label,
  desc,
}: {
  color: 'brand' | 'teal' | 'amber' | 'blue'
  icon: 'phone' | 'mail' | 'note' | 'calendar'
  label: string
  desc: string
}) {
  const map = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-600' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  } as const
  const icons = {
    phone: <PhoneMini />,
    mail: <MailMini />,
    note: <NoteMini />,
    calendar: <CalMini />,
  } as const
  const c = map[color]
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 ring-1 ring-ink-200/70">
      <div className={['grid h-7 w-7 shrink-0 place-items-center rounded-lg', c.bg, c.text].join(' ')}>
        {icons[icon]}
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-ink-900">{label}</div>
        <div className="text-[11px] leading-snug text-ink-500">{desc}</div>
      </div>
    </div>
  )
}

const PhoneMini = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const MailMini = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)
const NoteMini = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
    <path d="M15 3v6h6" />
  </svg>
)
const CalMini = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const DropletStack = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69 17.66 8.35a8 8 0 1 1-11.31 0z" />
  </svg>
)
