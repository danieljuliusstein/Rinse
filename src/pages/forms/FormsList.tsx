import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  FileText,
  FilePlus2,
  LayoutGrid,
  CircleDot,
  Layers,
  Inbox,
  type LucideIcon,
} from 'lucide-react'
import type { DeskForm } from '@/lib/types'
import FormCard from '@/components/forms/FormCard'

type StatusFilter = 'all' | DeskForm['status']

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'draft', label: 'Draft' },
]

type Stat = {
  label: string
  value: number
  icon: LucideIcon
  hint: string
}

type Props = {
  rows: DeskForm[]
  busy?: boolean
  onNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export default function FormsList({ rows, busy, onNew, onOpen, onDelete }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')

  const stats: Stat[] = useMemo(() => {
    const live = rows.filter((f) => f.status === 'live').length
    const drafts = rows.filter((f) => f.status === 'draft').length
    const totalFields = rows.reduce((n, f) => n + f.fields.length, 0)
    return [
      { label: 'Marked live', value: live, icon: CircleDot, hint: 'published to Desk' },
      { label: 'Drafts', value: drafts, icon: FileText, hint: 'not yet published' },
      { label: 'Total fields', value: totalFields, icon: Layers, hint: 'across all forms' },
      { label: 'Total forms', value: rows.length, icon: LayoutGrid, hint: 'in workspace' },
    ]
  }, [rows])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((f) => {
      const matchesQuery = !q || f.name.toLowerCase().includes(q)
      const matchesFilter = filter === 'all' || f.status === filter
      return matchesQuery && matchesFilter
    })
  }, [rows, query, filter])

  const hasQuery = query.trim().length > 0 || filter !== 'all'

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-rinse-bg">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-8 sm:py-8">
        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="relative overflow-hidden rounded-2xl border border-rinse-green-border bg-gradient-to-br from-rinse-green-soft to-white p-4 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(34,197,94,0.25)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-500">{s.label}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 text-rinse-green-text ring-1 ring-inset ring-rinse-green-border">
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                </div>
                <div className="mt-2.5 text-[28px] font-bold leading-none tracking-tight text-ink-900 tabular-nums">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[11px] text-ink-500">{s.hint}</div>
              </div>
            )
          })}
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onNew}
            className="inline-flex items-center gap-2 rounded-xl bg-rinse-green px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition-all hover:-translate-y-px hover:bg-rinse-green-hover hover:shadow-[0_8px_20px_-8px_rgba(34,197,94,0.5)] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Form
          </button>

          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              strokeWidth={2}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by form name"
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-rinse-green focus:outline-none focus:ring-2 focus:ring-rinse-green/20"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1">
            {FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={[
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-all capitalize',
                    active
                      ? 'bg-rinse-green text-white shadow-[0_1px_2px_rgba(16,24,40,0.08)]'
                      : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {visible.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                busy={busy}
                onOpen={onOpen}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState hasQuery={hasQuery} busy={busy} onNew={onNew} />
        )}
      </div>
    </div>
  )
}

function EmptyState({
  hasQuery,
  busy,
  onNew,
}: {
  hasQuery: boolean
  busy?: boolean
  onNew: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-rinse-green-soft" />
        <span className="absolute inset-2 rounded-full bg-white" />
        <Inbox className="relative h-8 w-8 text-rinse-green-text" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-ink-900">
        {hasQuery ? 'No forms match your filters' : 'No forms yet'}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-ink-500">
        {hasQuery
          ? 'Try a different name or clear the status filter to see more forms.'
          : 'Create your first lead form to start collecting submissions in Desk.'}
      </p>
      {!hasQuery ? (
        <button
          type="button"
          disabled={busy}
          onClick={onNew}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rinse-green px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-rinse-green-hover hover:shadow-[0_8px_20px_-8px_rgba(34,197,94,0.5)] disabled:opacity-60"
        >
          <FilePlus2 className="h-4 w-4" strokeWidth={2.25} />
          New Form
        </button>
      ) : null}
    </div>
  )
}
