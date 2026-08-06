import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  Mail,
  MessageSquare,
  Megaphone,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import type { CampaignChannel, CampaignStatus, DeskCampaign } from '@/lib/types'

type StatusFilter = 'All' | CampaignStatus
type ChannelFilter = 'All' | CampaignChannel

const STATUS_FILTERS: StatusFilter[] = ['All', 'active', 'draft', 'paused', 'completed']
const CHANNEL_FILTERS: ChannelFilter[] = ['All', 'email', 'sms', 'ads', 'other']

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  paused: 'Paused',
  completed: 'Completed',
}

const CHANNEL_LABEL: Record<CampaignChannel, string> = {
  email: 'Email',
  sms: 'SMS',
  ads: 'Ads',
  other: 'Other',
}

const channelStyles: Record<CampaignChannel, { pill: string; icon: LucideIcon }> = {
  email: { pill: 'bg-sky-50 text-sky-700 ring-sky-200', icon: Mail },
  sms: { pill: 'bg-violet-50 text-violet-700 ring-violet-200', icon: MessageSquare },
  ads: { pill: 'bg-amber-50 text-amber-700 ring-amber-200', icon: Megaphone },
  other: { pill: 'bg-ink-50 text-ink-600 ring-ink-200', icon: Layers },
}

const statusStyles: Record<CampaignStatus, string> = {
  active: 'bg-rinse-green-soft text-rinse-green-text ring-rinse-green-border',
  draft: 'bg-ink-50 text-ink-500 ring-ink-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
  completed: 'bg-ink-100 text-ink-600 ring-ink-200',
}

function formatSent(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`
  return String(n)
}

function formatCreated(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function openRatePct(sent: number, opened: number) {
  if (sent <= 0) return 0
  return Math.round((opened / sent) * 100)
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-5 py-4">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-3xl font-semibold leading-none text-rinse-green-text tabular-nums">
          {value}
        </span>
        {suffix && <span className="text-sm font-medium text-ink-500">{suffix}</span>}
      </div>
    </div>
  )
}

function CampaignRow({
  campaign: c,
  busy,
  onOpen,
  onDelete,
}: {
  campaign: DeskCampaign
  busy?: boolean
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}) {
  const ChannelIcon = channelStyles[c.channel].icon
  const sent = c.stats_sent
  const openPct = openRatePct(sent, c.stats_opened)
  const hasOpens = c.stats_opened > 0
  const hasClicks = (c.stats_clicked || 0) > 0
  const tip = [
    hasOpens
      ? `${c.stats_opened} unique open${c.stats_opened === 1 ? '' : 's'}`
      : 'Open tracking not available yet',
    hasClicks
      ? `${c.stats_clicked} unique click${c.stats_clicked === 1 ? '' : 's'}`
      : 'Click tracking needs link tracking + Resend click webhooks',
  ].join(' · ')

  return (
    <tr
      className="group cursor-pointer border-t border-ink-200/70 transition-colors duration-150 hover:bg-brand-50"
      onClick={() => onOpen(c.id)}
    >
      <td className="py-3.5 pl-5 pr-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600 ring-1 ring-ink-200">
            <ChannelIcon size={16} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink-900">{c.name}</div>
            {c.subject ? (
              <div className="truncate text-xs text-ink-500">{c.subject}</div>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${channelStyles[c.channel].pill}`}
        >
          {CHANNEL_LABEL[c.channel]}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[c.status]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {STATUS_LABEL[c.status]}
        </span>
      </td>
      <td className="px-4 py-3.5">
        {sent > 0 ? (
          <div className="text-sm text-ink-600 tabular-nums" title={tip}>
            {formatSent(sent)} sent
            {hasOpens ? <span className="text-ink-500"> · {openPct}% open</span> : null}
          </div>
        ) : (
          <span className="text-sm text-ink-500">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-ink-600">
        {c.audience_ids.length} {c.audience_ids.length === 1 ? 'contact' : 'contacts'}
      </td>
      <td className="px-4 py-3.5 text-sm text-ink-500">{formatCreated(c.created)}</td>
      <td className="py-3.5 pl-4 pr-5 text-right">
        <div
          className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Edit campaign"
            onClick={() => onOpen(c.id)}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-rinse-green-soft hover:text-rinse-green-text"
          >
            <Pencil size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Delete campaign"
            disabled={busy}
            onClick={() => onDelete(c.id)}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function EmptyState({
  hasFilters,
  busy,
  onNew,
}: {
  hasFilters: boolean
  busy?: boolean
  onNew: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-campaigns-fade-up">
      <div className="relative mb-5 h-28 w-28">
        <div className="absolute inset-0 animate-pulse rounded-full bg-rinse-green-soft blur-xl" />
        <svg
          viewBox="0 0 120 120"
          className="relative h-28 w-28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44 18c10-6 24-6 34 1 9 7 14 19 12 30-2 12-11 22-23 26-11 4-25 2-34-6-9-7-13-20-10-31 2-9 9-15 21-20z"
            fill="#EAF9EF"
            stroke="#bbf7d0"
            strokeWidth="1.5"
          />
          <circle cx="48" cy="46" r="5" fill="#22C55E" opacity="0.85" />
          <circle cx="70" cy="40" r="3.5" fill="#16A34A" opacity="0.7" />
          <circle cx="62" cy="60" r="4.5" fill="#22C55E" opacity="0.55" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-ink-900">
        {hasFilters ? 'No campaigns match your filters' : 'No campaigns yet'}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-ink-500">
        {hasFilters
          ? 'Try adjusting your search or filters.'
          : 'Create your first campaign to start reaching your audience.'}
      </p>
      {!hasFilters ? (
        <button
          type="button"
          disabled={busy}
          onClick={onNew}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-rinse-green px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-rinse-green-hover hover:shadow-md active:scale-[0.98] disabled:opacity-60"
        >
          <Plus size={16} strokeWidth={2.25} />
          New Campaign
        </button>
      ) : null}
    </div>
  )
}

type Props = {
  rows: DeskCampaign[]
  busy?: boolean
  onNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export default function CampaignsList({ rows, busy, onNew, onOpen, onDelete }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('All')
  const [query, setQuery] = useState('')
  const [channelOpen, setChannelOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false
      if (channelFilter !== 'All' && c.channel !== channelFilter) return false
      if (q) {
        if (!c.name.toLowerCase().includes(q) && !(c.subject ?? '').toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [rows, statusFilter, channelFilter, query])

  const activeCount = rows.filter((c) => c.status === 'active').length
  const drafts = rows.filter((c) => c.status === 'draft').length
  const totalSent = rows.reduce((s, c) => s + c.stats_sent, 0)
  const totalOpened = rows.reduce((s, c) => s + c.stats_opened, 0)
  const totalClicked = rows.reduce((s, c) => s + (c.stats_clicked || 0), 0)
  const totalAudience = rows.reduce((s, c) => s + c.audience_ids.length, 0)
  const avgOpen = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
  const avgClick = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0
  const hasFilters = Boolean(query.trim()) || statusFilter !== 'All' || channelFilter !== 'All'

  const channelFilterLabel =
    channelFilter === 'All' ? 'All' : CHANNEL_LABEL[channelFilter]

  return (
    <div className="flex flex-1 flex-col overflow-auto px-5 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl animate-campaigns-fade-up">
        <section
          className="mb-6 overflow-hidden rounded-2xl border border-rinse-green-border shadow-sm"
          style={{
            background: 'linear-gradient(125deg, #eaf9ef 0%, #f0fdf4 38%, #ffffff 100%)',
          }}
        >
          <div className="campaigns-fade-up-stagger grid grid-cols-2 divide-x divide-y divide-ink-200/60 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
            <StatCard label="Active" value={String(activeCount)} />
            <StatCard label="Total Sent" value={formatSent(totalSent)} />
            <StatCard
              label="Open rate"
              value={totalSent > 0 ? String(avgOpen) : '—'}
              suffix={totalSent > 0 ? '%' : undefined}
            />
            <StatCard
              label="Click rate"
              value={totalOpened > 0 ? String(avgClick) : '—'}
              suffix={totalOpened > 0 ? '%' : undefined}
            />
            <StatCard label="Audience" value={formatSent(totalAudience)} />
            <StatCard label="Drafts" value={String(drafts)} />
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <button
            type="button"
            disabled={busy}
            onClick={onNew}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rinse-green px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-rinse-green-hover hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            <Plus size={16} strokeWidth={2.25} />
            New Campaign
          </button>

          <div className="relative flex-1">
            <Search
              size={16}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns"
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-500 transition-colors focus:border-rinse-green focus:outline-none focus:ring-2 focus:ring-rinse-green-border"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f
              const label = f === 'All' ? 'All' : STATUS_LABEL[f]
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'bg-rinse-green text-white shadow-sm'
                      : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-brand-50 hover:text-rinse-green-text'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setChannelOpen((v) => !v)}
              onBlur={() => setTimeout(() => setChannelOpen(false), 120)}
              className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-600 transition-colors hover:bg-brand-50 lg:w-40"
            >
              <span>
                Channel:{' '}
                <span className="font-medium text-ink-900">{channelFilterLabel}</span>
              </span>
              <ChevronDown
                size={15}
                strokeWidth={1.75}
                className={`text-ink-500 transition-transform duration-150 ${channelOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {channelOpen ? (
              <div className="absolute right-0 z-20 mt-1.5 w-full min-w-40 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg animate-campaigns-fade-up lg:w-40">
                {CHANNEL_FILTERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={() => {
                      setChannelFilter(c)
                      setChannelOpen(false)
                    }}
                    className={`block w-full px-3.5 py-2 text-left text-sm transition-colors ${
                      channelFilter === c
                        ? 'bg-rinse-green-soft font-medium text-rinse-green-text'
                        : 'text-ink-600 hover:bg-brand-50'
                    }`}
                  >
                    {c === 'All' ? 'All' : CHANNEL_LABEL[c]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-100/40">
                    <th className="py-2.5 pl-5 pr-4 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Campaign
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Channel
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Sent
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Audience
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Created
                    </th>
                    <th className="px-4 py-2.5 pr-5 text-[11px] font-semibold uppercase tracking-wider text-ink-500" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <CampaignRow
                      key={c.id}
                      campaign={c}
                      busy={busy}
                      onOpen={onOpen}
                      onDelete={onDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState hasFilters={hasFilters} busy={busy} onNew={onNew} />
          )}
        </section>
      </div>
    </div>
  )
}
