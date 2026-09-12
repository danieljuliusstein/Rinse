import type { DeskChatMessage, DeskChatThread } from '@/lib/types'
import { colors } from '@/theme/colors'
import {
  avatarTone,
  formatThreadTime,
  initialsFromName,
  isThreadUnread,
  lastMessageSnippet,
  lastVisitorMessageAt,
} from './chatUtils'
import { EmptyState } from '@/components/graphics/SoftBlobs'

type Props = {
  title?: string
  threads: DeskChatThread[]
  messages: DeskChatMessage[]
  selectedId: string | null
  search: string
  onSearchChange: (q: string) => void
  onSelect: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
  onSimulateVisitor: () => void
}

export function ThreadList({
  title = 'Chat',
  threads,
  messages,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onTogglePin,
  onSimulateVisitor,
}: Props) {
  const q = search.trim().toLowerCase()
  const filtered = q
    ? threads.filter(
        (t) =>
          t.visitor_name.toLowerCase().includes(q) ||
          (t.visitor_email ?? '').toLowerCase().includes(q),
      )
    : threads
  const pinned = filtered.filter((t) => t.pinned)
  const recent = filtered.filter((t) => !t.pinned)

  function row(t: DeskChatThread) {
    const unread = isThreadUnread(t, lastVisitorMessageAt(t.id, messages))
    const snippet = lastMessageSnippet(t.id, messages, t.draft_body)
    const selected = selectedId === t.id
    const tone = avatarTone(t.id)
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => onSelect(t.id)}
        className={`w-full flex gap-2.5 px-3 py-2.5 text-left transition-colors border-l-[3px] ${
          selected ? '' : 'border-l-transparent hover:bg-gray-50'
        }`}
        style={
          selected
            ? { background: colors.greenSoft, borderLeftColor: colors.green }
            : undefined
        }
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {initialsFromName(t.visitor_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={`text-xs truncate ${unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
              {t.visitor_name}
            </p>
            {t.pinned && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 flex-shrink-0">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
            <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{formatThreadTime(t.last_message_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className={`text-[11px] truncate ${unread ? 'text-gray-700' : 'text-gray-400'}`}>
              {t.draft_body?.trim() ? `Draft: ${snippet}` : snippet}
            </p>
            {unread && (
              <span
                className="ml-auto w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0"
                style={{ background: colors.green }}
              >
                •
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          title={t.pinned ? 'Unpin' : 'Pin'}
          className="self-start p-1 text-gray-300 hover:text-gray-500 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(t.id, !t.pinned)
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={t.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        </button>
      </button>
    )
  }

  return (
    <aside className="flex flex-col h-full border-r bg-white min-w-0" style={{ borderColor: colors.border }}>
      <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-800">{title}</p>
          <button
            type="button"
            onClick={onSimulateVisitor}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors"
            style={{
              background: colors.surface,
              color: colors.greenHover,
              border: `1px solid ${colors.green}`,
            }}
          >
            Simulate visitor
          </button>
        </div>
        <div className="relative">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages"
            className="w-full text-xs pl-7 pr-3 py-1.5 border rounded-full focus:outline-none"
            style={{
              background: colors.bg,
              borderColor: colors.border,
            }}
          />
          <svg className="absolute left-2.5 top-2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 && (
          <EmptyState
            scene="inbox"
            compact
            title="No conversations"
            description="Simulate a visitor or wait for the next message"
          />
        )}
        {pinned.length > 0 && (
          <>
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Pinned</p>
            {pinned.map(row)}
          </>
        )}
        {recent.length > 0 && (
          <>
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Recent</p>
            {recent.map(row)}
          </>
        )}
      </div>
    </aside>
  )
}
