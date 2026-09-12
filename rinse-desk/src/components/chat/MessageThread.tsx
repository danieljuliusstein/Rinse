import { useEffect, useRef, useState } from 'react'
import type { DeskChatMessage, DeskChatThread } from '@/lib/types'
import { getDisplayName, getInitials } from '@/lib/auth'
import { colors } from '@/theme/colors'
import {
  avatarTone,
  dayKey,
  formatDatePill,
  formatMessageTime,
  initialsFromName,
} from './chatUtils'

const EMOJIS = ['😀', '👍', '🙏', '😊', '🎉', '✅', '👋', '💡', '🔥', '❤️']

type Props = {
  thread: DeskChatThread
  messages: DeskChatMessage[]
  reply: string
  onReplyChange: (v: string) => void
  onSend: () => void
  onSparkle: () => void
  onArchive: () => void
  onAssignToMe: () => void
  onUnassign: () => void
  onMarkSpam: () => void
  onMoveTrash: () => void
  onCloseThread: () => void
  onReopenThread: () => void
  labels: { id: string; name: string }[]
  onToggleLabel: (labelId: string) => void
  contactPhone?: string
}

export function MessageThread({
  thread,
  messages,
  reply,
  onReplyChange,
  onSend,
  onSparkle,
  onArchive,
  onAssignToMe,
  onUnassign,
  onMarkSpam,
  onMoveTrash,
  onCloseThread,
  onReopenThread,
  labels,
  onToggleLabel,
  contactPhone,
}: Props) {
  const agentName = getDisplayName()
  const agentInitials = getInitials(agentName)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const visitorTone = avatarTone(thread.id)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, thread.id])

  function wrapSelection(before: string, after = before) {
    const el = textareaRef.current
    if (!el) {
      onReplyChange(`${before}${reply}${after}`)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = reply.slice(start, end) || 'text'
    const next = reply.slice(0, start) + before + selected + after + reply.slice(end)
    onReplyChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current
    if (!el) {
      onReplyChange(reply + text)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = reply.slice(0, start) + text + reply.slice(end)
    onReplyChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + text.length
      el.setSelectionRange(pos, pos)
    })
  }

  let lastDay = ''

  return (
    <div className="flex flex-col h-full min-w-0" style={{ background: colors.bg }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5 bg-white"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold"
          style={{ background: visitorTone.bg, color: visitorTone.fg }}
        >
          {initialsFromName(thread.visitor_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{thread.visitor_name}</p>
          {thread.visitor_email ? (
            <p className="text-[10px] text-gray-400 truncate">{thread.visitor_email}</p>
          ) : (
            <p className="text-[10px] text-gray-400 truncate">Visitor · Website chat</p>
          )}
        </div>
        <button
          type="button"
          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
          title="Call"
          disabled={!contactPhone}
          onClick={() => {
            if (contactPhone) window.location.href = `tel:${contactPhone}`
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
        <button
          type="button"
          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
          title={thread.archived ? 'Unarchive' : 'Archive'}
          onClick={onArchive}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
          </svg>
        </button>
        <div className="relative">
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
            title="More"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg z-30 overflow-hidden"
              style={{ border: `1px solid ${colors.border}` }}
            >
              <button type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50" onClick={() => { setMenuOpen(false); onAssignToMe() }}>
                Assign to me
              </button>
              <button type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50" onClick={() => { setMenuOpen(false); onUnassign() }}>
                Unassign
              </button>
              <button type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50" onClick={() => { setMenuOpen(false); thread.status === 'closed' ? onReopenThread() : onCloseThread() }}>
                {thread.status === 'closed' ? 'Reopen' : 'Close conversation'}
              </button>
              <div style={{ borderTop: `1px solid ${colors.borderSubtle}` }} />
              {labels.map((l) => {
                const on = (thread.label_ids ?? []).includes(l.id)
                return (
                  <button
                    key={l.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                    onClick={() => {
                      setMenuOpen(false)
                      onToggleLabel(l.id)
                    }}
                  >
                    {on ? '✓ ' : ''}{l.name}
                  </button>
                )
              })}
              {labels.length > 0 && <div style={{ borderTop: `1px solid ${colors.borderSubtle}` }} />}
              <button type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50" onClick={() => { setMenuOpen(false); onMarkSpam() }}>
                Mark as spam
              </button>
              <button type="button" className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { setMenuOpen(false); onMoveTrash() }}>
                Move to trash
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4 space-y-1">
        {messages.map((m) => {
          const day = dayKey(m.created)
          const showPill = day !== lastDay
          lastDay = day
          const outbound = m.sender === 'agent'
          const name = outbound ? agentName : thread.visitor_name
          const initials = outbound ? agentInitials : initialsFromName(thread.visitor_name)
          return (
            <div key={m.id}>
              {showPill && (
                <div className="flex justify-center my-3">
                  <span
                    className="text-[10px] px-2.5 py-0.5 rounded-full shadow-sm"
                    style={{
                      color: colors.textMuted,
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {formatDatePill(m.created)}
                  </span>
                </div>
              )}
              <div className={`flex gap-2 mb-3 ${outbound ? 'justify-end' : 'justify-start'}`}>
                {!outbound && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 mt-4"
                    style={{ background: visitorTone.bg, color: visitorTone.fg }}
                  >
                    {initials}
                  </div>
                )}
                <div className={`max-w-[70%] ${outbound ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-baseline gap-1.5 mb-1 ${outbound ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] font-medium text-gray-600">{name}</span>
                    <span className="text-[10px] text-gray-400">{formatMessageTime(m.created)}</span>
                  </div>
                  <div
                    className="text-xs px-3.5 py-2.5 rounded-[14px] whitespace-pre-wrap break-words"
                    style={
                      outbound
                        ? { background: colors.green, color: '#fff' }
                        : {
                            background: colors.surface,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }
                    }
                  >
                    {m.body}
                  </div>
                </div>
                {outbound && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-4 text-white"
                    style={{ background: colors.green }}
                  >
                    {initials}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <form
        className="bg-white p-3"
        style={{ borderTop: `1px solid ${colors.border}` }}
        onSubmit={(e) => {
          e.preventDefault()
          onSend()
        }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={reply}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 text-xs px-4 py-2.5 resize-none focus:outline-none rounded-full"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
          />
          <button
            type="submit"
            disabled={!reply.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: colors.green }}
            title="Send"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-1 mt-2 relative">
          <button type="button" title="Bold" className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg text-[11px] font-bold" onClick={() => wrapSelection('**')}>
            B
          </button>
          <button type="button" title="Italic" className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg text-[11px] italic" onClick={() => wrapSelection('_')}>
            I
          </button>
          <button
            type="button"
            title="Attach"
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
            onClick={() => fileRef.current?.click()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) insertAtCursor(`[Attachment: ${file.name}]`)
              e.target.value = ''
            }}
          />
          <div className="relative">
            <button
              type="button"
              title="Emoji"
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
              onClick={() => setEmojiOpen((v) => !v)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            {emojiOpen && (
              <div
                className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg p-2 flex flex-wrap gap-1 w-40 z-20"
                style={{ border: `1px solid ${colors.border}` }}
              >
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="text-sm hover:bg-gray-50 rounded p-1"
                    onClick={() => {
                      insertAtCursor(em)
                      setEmojiOpen(false)
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            title="AI suggest"
            className="p-1.5 rounded-lg"
            style={{ color: colors.green }}
            onClick={onSparkle}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
