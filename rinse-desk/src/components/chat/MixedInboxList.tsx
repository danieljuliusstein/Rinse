import type { DeskActivity, DeskChatMessage, DeskChatThread, DeskClient } from '@/lib/types'
import { colors } from '@/theme/colors'
import {
  avatarTone,
  formatThreadTime,
  initialsFromName,
  isThreadUnread,
  lastMessageSnippet,
  lastVisitorMessageAt,
} from './chatUtils'

type Item =
  | { kind: 'thread'; thread: DeskChatThread }
  | { kind: 'activity'; activity: DeskActivity }

type Props = {
  title: string
  threads: DeskChatThread[]
  activities: DeskActivity[]
  messages: DeskChatMessage[]
  clients: DeskClient[]
  selectedThreadId: string | null
  selectedActivityId: string | null
  onSelectThread: (id: string) => void
  onSelectActivity: (id: string) => void
}

export function MixedInboxList({
  title,
  threads,
  activities,
  messages,
  clients,
  selectedThreadId,
  selectedActivityId,
  onSelectThread,
  onSelectActivity,
}: Props) {
  const items: Item[] = [
    ...threads.map((thread) => ({ kind: 'thread' as const, thread })),
    ...activities.map((activity) => ({ kind: 'activity' as const, activity })),
  ].sort((a, b) => {
    const ta = a.kind === 'thread' ? a.thread.last_message_at : a.activity.occurred_at
    const tb = b.kind === 'thread' ? b.thread.last_message_at : b.activity.occurred_at
    return tb.localeCompare(ta)
  })

  function contactName(id: string) {
    return clients.find((c) => c.id === id)?.name ?? 'Unknown'
  }

  return (
    <aside
      className="flex flex-col h-full border-r bg-white min-w-0"
      style={{ borderColor: colors.border }}
    >
      <div className="p-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <p className="text-xs font-semibold text-gray-800">{title}</p>
      </div>
      <div className="flex-1 overflow-auto">
        {items.length === 0 && <p className="text-[11px] text-gray-400 p-4">Empty</p>}
        {items.map((item) => {
          if (item.kind === 'thread') {
            const t = item.thread
            const unread = isThreadUnread(t, lastVisitorMessageAt(t.id, messages))
            const selected = selectedThreadId === t.id
            const tone = avatarTone(t.id)
            return (
              <button
                key={`t-${t.id}`}
                type="button"
                onClick={() => onSelectThread(t.id)}
                className={`w-full flex gap-2.5 px-3 py-2.5 text-left border-l-[3px] ${
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
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{t.visitor_name}</p>
                    <span className="text-[9px] text-gray-400 uppercase">Chat</span>
                    <span className="ml-auto text-[10px] text-gray-400">{formatThreadTime(t.last_message_at)}</span>
                  </div>
                  <p className={`text-[11px] truncate ${unread ? 'text-gray-700' : 'text-gray-400'}`}>
                    {lastMessageSnippet(t.id, messages, t.draft_body)}
                  </p>
                </div>
              </button>
            )
          }
          const a = item.activity
          const name = contactName(a.contact_id)
          const selected = selectedActivityId === a.id
          const tone = avatarTone(a.contact_id || a.id)
          return (
            <button
              key={`a-${a.id}`}
              type="button"
              onClick={() => onSelectActivity(a.id)}
              className={`w-full flex gap-2.5 px-3 py-2.5 text-left border-l-[3px] ${
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
                {initialsFromName(name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                  <span className="text-[9px] text-gray-400 uppercase">{a.type}</span>
                  <span className="ml-auto text-[10px] text-gray-400">{formatThreadTime(a.occurred_at)}</span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">{a.subject}</p>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
