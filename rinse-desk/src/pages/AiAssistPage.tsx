import { useEffect, useMemo, useState, type ElementType } from 'react'
import {
  Sparkles,
  Mail,
  GitBranch,
  MessageSquare,
  CalendarClock,
  ArrowRight,
  CornerDownLeft,
  Users,
  Briefcase,
  Hash,
  CheckCircle2,
  Clock,
  Phone,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import * as platform from '@/lib/platform-api'
import {
  buildAssistContactOptions,
  buildAssistSnapshot,
  buildAssistSuggestions,
  inferAssistChip,
  type AssistChip,
  type AssistIcon,
  type AssistSuggestion,
} from '@/lib/ai-assist'
import type { DeskActivity, DeskChatThread, PageId } from '@/lib/types'

const CHIPS: { key: AssistChip; label: string; icon: ElementType }[] = [
  { key: 'draft', label: 'Draft email', icon: Mail },
  { key: 'pipeline', label: 'Pipeline tip', icon: GitBranch },
  { key: 'chat', label: 'Chat priority', icon: MessageSquare },
  { key: 'activity', label: 'Next activity', icon: CalendarClock },
]

const JUMP_LINKS: { label: string; page: PageId; icon: ElementType }[] = [
  { label: 'Go to Deals', page: 'deals', icon: Briefcase },
  { label: 'Go to Inbox', page: 'chat', icon: MessageSquare },
  { label: 'Go to Activities', page: 'activities', icon: CalendarClock },
]

const ICON_MAP: Record<AssistIcon, ElementType> = {
  mail: Mail,
  calendar: CalendarClock,
  briefcase: Briefcase,
  chat: MessageSquare,
  phone: Phone,
  clock: Clock,
  shield: ShieldCheck,
  warn: AlertCircle,
  check: CheckCircle2,
}

function AssistBlob() {
  return (
    <div className="relative h-28 w-28 shrink-0">
      <div className="absolute inset-0 animate-assist-blob rounded-full bg-gradient-to-br from-teal-200 via-brand-200 to-brand-100 blur-[2px] opacity-80" />
      <div className="absolute inset-3 animate-assist-blob rounded-full bg-gradient-to-tr from-brand-100 to-teal-100 opacity-70 [animation-delay:-6s]" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-brand-200">
          <Sparkles className="h-7 w-7 text-brand-600" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: number
  hint: string
  icon: ElementType
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-2xl font-semibold tracking-tight text-neutral-800">{value}</span>
      <span className="text-[11px] text-neutral-400">{hint}</span>
    </div>
  )
}

function SuggestionCard({ s, index }: { s: AssistSuggestion; index: number }) {
  const Icon = ICON_MAP[s.icon] ?? Sparkles
  const toneRing =
    s.tone === 'warn'
      ? 'border-amber-200 bg-amber-50/40'
      : s.tone === 'good'
        ? 'border-brand-200 bg-brand-50/50'
        : 'border-brand-200 bg-white'
  const toneChip =
    s.tone === 'warn'
      ? 'bg-amber-100 text-amber-700'
      : s.tone === 'good'
        ? 'bg-brand-100 text-brand-700'
        : 'bg-neutral-100 text-neutral-600'

  return (
    <div
      className={`animate-assist-fade-up rounded-xl border ${toneRing} p-4 shadow-sm`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-brand-200">
          <Icon className="h-4 w-4 text-brand-600" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-neutral-800">{s.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">{s.body}</p>
          {s.meta && (
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${toneChip}`}
            >
              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
              {s.meta}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** Wave 9 — assist panel over existing CRM data (no external model required for MVP). */
export default function AiAssistPanel({ embedded }: { embedded?: boolean }) {
  const { clients, vehicles, leads, jobs } = useData()
  const { setPage } = useDeskNav()
  const [activities, setActivities] = useState<DeskActivity[]>([])
  const [threads, setThreads] = useState<DeskChatThread[]>([])
  const [chip, setChip] = useState<AssistChip | null>(null)
  const [contactId, setContactId] = useState('')
  const [submitted, setSubmitted] = useState<AssistChip | null>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const [nextThreads, nextActivities] = await Promise.all([
          platform.listChatThreads(),
          platform.listActivities(),
        ])
        setThreads(nextThreads)
        setActivities(nextActivities)
      } catch {
        /* empty */
      }
    })()
  }, [])

  const assistCtx = useMemo(
    () => ({
      clients,
      vehicles,
      leads,
      jobs,
      activities,
      threads,
      focusContactId: contactId || undefined,
    }),
    [clients, vehicles, leads, jobs, activities, threads, contactId],
  )

  const contactOptions = useMemo(() => buildAssistContactOptions(assistCtx), [assistCtx])
  const snapshot = useMemo(() => buildAssistSnapshot(assistCtx), [assistCtx])
  const suggestions = useMemo(
    () => (submitted ? buildAssistSuggestions(submitted, assistCtx) : []),
    [submitted, assistCtx],
  )

  const activeContact = contactOptions.find((c) => c.id === contactId)
  const isGeneral = !contactId

  function run(c: AssistChip) {
    setChip(c)
    setSubmitted(c)
    setText('')
  }

  function onAsk() {
    const next = chip ?? (text.trim() ? inferAssistChip(text) : null)
    if (!next) return
    setChip(next)
    setSubmitted(next)
  }

  const panel = (
    <div className={`mx-auto max-w-xl ${embedded ? 'px-0 py-0' : 'px-6 py-8'}`}>
      {!embedded && (
        <div className="flex flex-col items-center text-center">
          <AssistBlob />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-900">
            What can I help with?
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
            Rule-based tips from your Desk data — counts of open deals, chats, and recent activities.
            Not a live AI model.
          </p>
        </div>
      )}

      <div className={`${embedded ? '' : 'mt-7'} rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm`}>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => {
            const Icon = c.icon
            const active = chip === c.key
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => run(c.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-brand-300 bg-brand-100 text-brand-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                {c.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
            Focus contact
            <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          >
            {contactOptions.map((c) => (
              <option key={c.id || 'general'} value={c.id}>
                {c.name} — {c.sub}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAsk()}
            placeholder="Ask a question or tap a chip above…"
            className="flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 outline-none"
          />
          <button
            type="button"
            onClick={onAsk}
            disabled={!chip && !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ask
            <CornerDownLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatTile
          label="Open deals"
          value={snapshot.openDeals}
          hint={snapshot.openDealsHint}
          icon={Briefcase}
        />
        <StatTile
          label="Open chats"
          value={snapshot.openChats}
          hint={snapshot.openChatsHint}
          icon={Hash}
        />
        <StatTile
          label="Activities (24h)"
          value={snapshot.activities24h}
          hint={snapshot.activitiesHint}
          icon={CalendarClock}
        />
      </div>

      {submitted ? (
        <div className="mt-6 animate-assist-fade-in">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" strokeWidth={1.8} />
              Suggestions · AI-assisted from your CRM data
            </div>
            <button
              type="button"
              onClick={() => setSubmitted(null)}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 ring-1 ring-brand-200">
              {CHIPS.find((c) => c.key === submitted)?.label}
              {!isGeneral && activeContact && (
                <>
                  {' · for '}
                  <span className="font-semibold">{activeContact.name}</span>
                </>
              )}
            </div>
            {suggestions.map((s, i) => (
              <SuggestionCard key={s.id} s={s} index={i} />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-400">Jump to:</span>
            {JUMP_LINKS.map((l) => (
              <button
                key={l.page}
                type="button"
                onClick={() => setPage(l.page)}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {l.label}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            Jump links open Deals, Inbox, or Activities — those full surfaces live in their own tabs
            and aren’t part of AI Assist.
          </p>
        </div>
      ) : (
        !embedded && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white/50 px-4 py-5 text-center text-sm text-neutral-400">
            <Sparkles className="h-4 w-4 text-neutral-300" strokeWidth={1.8} />
            Tap a suggestion chip or type a question to get started.
          </div>
        )
      )}
    </div>
  )

  if (embedded) return panel

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-atmosphere">
      <Header title="AI Assist" subtitle="Rule-based tips from your Desk data" />
      <div className="flex-1 overflow-y-auto">{panel}</div>
    </div>
  )
}
