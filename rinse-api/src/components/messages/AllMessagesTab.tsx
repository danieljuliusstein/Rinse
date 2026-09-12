'use client'

import { useRouter } from 'next/navigation'
import { Badge, EmptyState, ListRow, SectionGroup } from '@/components/ui'
import type { SentMessage } from '@/lib/messages'
import { formatMessageTimestamp } from '@/lib/messages'

interface Props {
  messages: SentMessage[]
  onSelect: (message: SentMessage) => void
}

export default function AllMessagesTab({ messages, onSelect }: Props) {
  const router = useRouter()

  if (messages.length === 0) {
    return (
      <EmptyState
        illustration="messages"
        title="No messages sent yet"
        description="Turn on auto messages for email, or text clients from their profile or a job — Messages opens with your draft ready."
        actionLabel="Set up auto messages"
        onAction={() => router.push('/messages?tab=auto')}
      />
    )
  }

  return (
    <SectionGroup title="Sent">
      {messages.map((msg) => (
        <ListRow
          key={msg.id}
          title={msg.client_name}
          subtitle={msg.preview}
          trailing={
            <span className="messages-list-row__time">{formatMessageTimestamp(msg.sent_at)}</span>
          }
          badge={
            <span className="messages-list-row__pills">
              <Badge tone={msg.channel === 'sms' ? 'blue' : 'green'}>{msg.channel}</Badge>
              <Badge tone={msg.status === 'failed' ? 'red' : 'green'}>{msg.status}</Badge>
            </span>
          }
          onClick={() => onSelect(msg)}
        />
      ))}
    </SectionGroup>
  )
}
