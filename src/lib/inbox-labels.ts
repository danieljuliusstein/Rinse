/** Inbox labels / team inboxes (local). */

export type InboxLabel = {
  id: string
  name: string
}

const LABELS_KEY = 'desk.inbox_labels_v1'

export const BUILTIN_LABELS: InboxLabel[] = [
  { id: 'subscription', name: 'Manage Subscription' },
]

function readLabels(): InboxLabel[] {
  try {
    const raw = localStorage.getItem(LABELS_KEY)
    if (!raw) return [...BUILTIN_LABELS]
    const parsed = JSON.parse(raw) as InboxLabel[]
    if (!Array.isArray(parsed)) return [...BUILTIN_LABELS]
    const ids = new Set(parsed.map((l) => l.id))
    const merged = [...parsed]
    for (const b of BUILTIN_LABELS) {
      if (!ids.has(b.id)) merged.push(b)
    }
    return merged
  } catch {
    return [...BUILTIN_LABELS]
  }
}

function writeLabels(labels: InboxLabel[]) {
  localStorage.setItem(LABELS_KEY, JSON.stringify(labels))
}

export function listInboxLabels(): InboxLabel[] {
  return readLabels()
}

export function createInboxLabel(name: string): InboxLabel {
  const label: InboxLabel = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled',
  }
  const labels = readLabels()
  labels.push(label)
  writeLabels(labels)
  return label
}

export function renameInboxLabel(id: string, name: string): InboxLabel | null {
  const labels = readLabels()
  const i = labels.findIndex((l) => l.id === id)
  if (i < 0) return null
  labels[i] = { ...labels[i]!, name: name.trim() || labels[i]!.name }
  writeLabels(labels)
  return labels[i]!
}

export function deleteInboxLabel(id: string): void {
  if (BUILTIN_LABELS.some((b) => b.id === id)) return
  writeLabels(readLabels().filter((l) => l.id !== id))
}
