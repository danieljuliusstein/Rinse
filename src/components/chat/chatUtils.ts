import type { DeskChatMessage, DeskChatThread } from '@/lib/types'
import { AVATAR_TONES, type AvatarTone } from '@/theme/colors'

export type ChatFilterTab = 'all' | 'unread' | 'draft' | 'archived'

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase() || '?'
}

/** Deterministic soft pastel avatar tone from a contact/thread seed. */
export function avatarTone(seed: string): AvatarTone {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length
  return AVATAR_TONES[h] ?? AVATAR_TONES[0]!
}

export function formatMessageTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatThreadTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return formatMessageTime(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function formatDatePill(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'long' })
}

export function dayKey(iso: string): string {
  return new Date(iso).toDateString()
}

export function isThreadUnread(thread: DeskChatThread, lastVisitorAt?: string): boolean {
  if (!lastVisitorAt) return false
  if (!thread.agent_last_read_at) return true
  return new Date(lastVisitorAt).getTime() > new Date(thread.agent_last_read_at).getTime()
}

export function lastVisitorMessageAt(
  threadId: string,
  messages: DeskChatMessage[],
): string | undefined {
  const visitor = messages.filter((m) => m.thread_id === threadId && m.sender === 'visitor')
  if (visitor.length === 0) return undefined
  return visitor[visitor.length - 1]?.created
}

export function lastMessageSnippet(
  threadId: string,
  messages: DeskChatMessage[],
  draft?: string,
): string {
  if (draft?.trim()) return draft.trim()
  const threadMsgs = messages.filter((m) => m.thread_id === threadId)
  const last = threadMsgs[threadMsgs.length - 1]
  return last?.body ?? 'No messages yet'
}

export function filterThreads(
  threads: DeskChatThread[],
  tab: ChatFilterTab,
  messages: DeskChatMessage[],
  search: string,
): DeskChatThread[] {
  const q = search.trim().toLowerCase()
  return threads.filter((t) => {
    if (q && !t.visitor_name.toLowerCase().includes(q) && !(t.visitor_email ?? '').toLowerCase().includes(q)) {
      return false
    }
    const unread = isThreadUnread(t, lastVisitorMessageAt(t.id, messages))
    switch (tab) {
      case 'unread':
        return !t.archived && unread
      case 'draft':
        return !t.archived && Boolean(t.draft_body?.trim())
      case 'archived':
        return Boolean(t.archived)
      default:
        return !t.archived
    }
  })
}
