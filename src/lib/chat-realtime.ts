import { getPocketBase } from './pocketbase'
import { isKnownMissingCollection } from './platform-api'

export type ChatRealtimeHandlers = {
  onThreadsChanged: () => void
  onMessagesChanged: (threadId?: string) => void
}

/**
 * Subscribe to PocketBase realtime for chat collections.
 * Returns an unsubscribe fn, or null if subscribe is unavailable (use poll fallback).
 */
export async function subscribeChatRealtime(
  handlers: ChatRealtimeHandlers,
): Promise<(() => void) | null> {
  // Fly may not have chat_* collections yet — skip subscribe to avoid 404 noise.
  if (isKnownMissingCollection('chat_threads') || isKnownMissingCollection('chat_messages')) {
    return null
  }

  const pb = getPocketBase()
  try {
    await pb.collection('chat_threads').subscribe('*', () => {
      handlers.onThreadsChanged()
    })
    await pb.collection('chat_messages').subscribe('*', (e) => {
      const record = e.record as { thread_id?: string } | undefined
      handlers.onMessagesChanged(record?.thread_id)
      handlers.onThreadsChanged()
    })
    return () => {
      void pb.collection('chat_threads').unsubscribe('*')
      void pb.collection('chat_messages').unsubscribe('*')
    }
  } catch {
    try {
      void pb.collection('chat_threads').unsubscribe('*')
      void pb.collection('chat_messages').unsubscribe('*')
    } catch {
      /* ignore */
    }
    return null
  }
}
