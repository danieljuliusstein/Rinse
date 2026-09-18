/** Local overlay for chat thread meta when PocketBase lacks schema fields. */

export type ChatThreadMeta = {
  pinned?: boolean
  archived?: boolean
  draft_body?: string
  agent_last_read_at?: string
  assignee_id?: string | null
  spam?: boolean
  trashed?: boolean
  label_ids?: string[]
}

const META_KEY = 'desk.chat_thread_meta_v1'

function readAll(): Record<string, ChatThreadMeta> {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, ChatThreadMeta>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map: Record<string, ChatThreadMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(map))
}

export function getChatThreadMeta(threadId: string): ChatThreadMeta {
  return readAll()[threadId] ?? {}
}

export function patchChatThreadMeta(threadId: string, patch: ChatThreadMeta): ChatThreadMeta {
  const all = readAll()
  const next: ChatThreadMeta = { ...all[threadId], ...patch }
  if (patch.draft_body !== undefined && !patch.draft_body.trim()) {
    next.draft_body = undefined
  }
  if (patch.assignee_id === null) {
    next.assignee_id = undefined
  }
  all[threadId] = next
  writeAll(all)
  return next
}

export function mergeChatThreadMeta<T extends { id: string } & ChatThreadMeta>(thread: T): T {
  const meta = getChatThreadMeta(thread.id)
  const draft =
    thread.draft_body !== undefined ? thread.draft_body || undefined : meta.draft_body
  const assignee =
    thread.assignee_id !== undefined
      ? thread.assignee_id || undefined
      : meta.assignee_id || undefined
  return {
    ...thread,
    pinned: thread.pinned ?? meta.pinned ?? false,
    archived: thread.archived ?? meta.archived ?? false,
    draft_body: draft,
    agent_last_read_at: thread.agent_last_read_at ?? meta.agent_last_read_at,
    assignee_id: assignee,
    spam: thread.spam ?? meta.spam ?? false,
    trashed: thread.trashed ?? meta.trashed ?? false,
    label_ids: thread.label_ids ?? meta.label_ids ?? [],
  }
}

export function clearTourChatThreadMeta(): void {
  const isTourId = (id: string) => id.startsWith('tour-') || id.startsWith('dummy-') || id.startsWith('temp-')
  const all = readAll()
  let changed = false
  for (const k of Object.keys(all)) {
    if (isTourId(k)) {
      delete all[k]
      changed = true
    }
  }
  if (changed) writeAll(all)
}
