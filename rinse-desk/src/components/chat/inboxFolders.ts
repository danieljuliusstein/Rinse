import type { DeskActivity, DeskChatMessage, DeskChatThread } from '@/lib/types'
import { isActivitySpam, isActivityTrashed, isOutboundEmailActivity } from '@/lib/activity-meta'
import { lastVisitorMessageAt, isThreadUnread } from './chatUtils'

export type InboxFolderId =
  | 'assigned'
  | 'unassigned'
  | 'all_open'
  | 'email'
  | 'chat'
  | 'calls'
  | 'sent'
  | 'all_closed'
  | 'schedule'
  | 'draft'
  | 'spam'
  | 'trash'
  | 'manage_labels'
  | `label:${string}`

export type InboxMode = 'chat' | 'activity' | 'labels'

export function folderMode(folder: InboxFolderId): InboxMode {
  if (folder === 'manage_labels') return 'labels'
  if (folder === 'email' || folder === 'calls' || folder === 'schedule') return 'activity'
  if (folder === 'sent') return 'activity'
  return 'chat'
}

export function activityTypeForFolder(folder: InboxFolderId): DeskActivity['type'] | null {
  if (folder === 'email' || folder === 'sent') return 'email'
  if (folder === 'calls') return 'call'
  if (folder === 'schedule') return 'meeting'
  return null
}

export function isChatFolder(folder: InboxFolderId): boolean {
  return (
    folder === 'assigned' ||
    folder === 'unassigned' ||
    folder === 'all_open' ||
    folder === 'chat' ||
    folder === 'all_closed' ||
    folder === 'draft' ||
    folder === 'spam' ||
    folder === 'trash' ||
    folder.startsWith('label:')
  )
}

function activeThread(t: DeskChatThread): boolean {
  return !t.trashed && !t.spam
}

function threadHasMessages(threadId: string, messages: DeskChatMessage[]): boolean {
  return messages.some((m) => m.thread_id === threadId)
}

export function filterThreadsForFolder(
  threads: DeskChatThread[],
  folder: InboxFolderId,
  userId: string | null,
  messages: DeskChatMessage[],
): DeskChatThread[] {
  if (folder === 'manage_labels') return []
  if (folder === 'email' || folder === 'calls' || folder === 'schedule' || folder === 'sent') return []

  return threads.filter((t) => {
    switch (folder) {
      case 'assigned':
        return activeThread(t) && t.status === 'open' && Boolean(userId) && t.assignee_id === userId
      case 'unassigned':
        return activeThread(t) && t.status === 'open' && !t.assignee_id
      case 'all_open':
        // Every open, non-archived thread (including empty)
        return activeThread(t) && t.status === 'open' && !t.archived
      case 'chat':
        // Active conversations only — open threads that already have messages
        return (
          activeThread(t) &&
          t.status === 'open' &&
          !t.archived &&
          threadHasMessages(t.id, messages)
        )
      case 'all_closed':
        return activeThread(t) && (t.status === 'closed' || Boolean(t.archived))
      case 'draft':
        return activeThread(t) && Boolean(t.draft_body?.trim())
      case 'spam':
        return Boolean(t.spam) && !t.trashed
      case 'trash':
        return Boolean(t.trashed)
      default: {
        if (folder.startsWith('label:')) {
          const labelId = folder.slice('label:'.length)
          return activeThread(t) && (t.label_ids ?? []).includes(labelId)
        }
        return false
      }
    }
  })
}

export function filterActivitiesForFolder(
  activities: DeskActivity[],
  folder: InboxFolderId,
): DeskActivity[] {
  if (folder === 'trash') {
    return activities.filter((a) => isActivityTrashed(a.id))
  }
  if (folder === 'spam') {
    return activities.filter((a) => isActivitySpam(a.id) && !isActivityTrashed(a.id))
  }
  const live = activities.filter((a) => !isActivityTrashed(a.id) && !isActivitySpam(a.id))
  if (folder === 'email') {
    // Inbound / uncategorized emails (not marked outbound)
    return live.filter((a) => a.type === 'email' && !isOutboundEmailActivity(a))
  }
  if (folder === 'sent') {
    return live.filter((a) => isOutboundEmailActivity(a))
  }
  if (folder === 'calls') return live.filter((a) => a.type === 'call')
  if (folder === 'schedule') return live.filter((a) => a.type === 'meeting')
  return []
}

export function countForFolder(
  folder: InboxFolderId,
  threads: DeskChatThread[],
  activities: DeskActivity[],
  messages: DeskChatMessage[],
  userId: string | null,
): number {
  if (folder === 'manage_labels') return 0
  if (folder === 'email' || folder === 'calls' || folder === 'schedule' || folder === 'sent') {
    return filterActivitiesForFolder(activities, folder).length
  }
  if (folder === 'spam') {
    return (
      filterThreadsForFolder(threads, 'spam', userId, messages).length +
      filterActivitiesForFolder(activities, 'spam').length
    )
  }
  if (folder === 'trash') {
    return (
      filterThreadsForFolder(threads, 'trash', userId, messages).length +
      filterActivitiesForFolder(activities, 'trash').length
    )
  }
  return filterThreadsForFolder(threads, folder, userId, messages).length
}

export function unreadOpenCount(threads: DeskChatThread[], messages: DeskChatMessage[]): number {
  return threads.filter(
    (t) =>
      t.status === 'open' &&
      !t.trashed &&
      !t.spam &&
      !t.archived &&
      isThreadUnread(t, lastVisitorMessageAt(t.id, messages)),
  ).length
}
