'use client'

import BackButton from '@/components/BackButton'
import { Badge, Card, ListRow, SectionGroup } from '@/components/ui'
import type { SentMessage } from '@/lib/messages'
import { formatMessageTimestamp } from '@/lib/messages'

interface Props {
  message: SentMessage
  onBack: () => void
}

export default function MessageDetailView({ message, onBack }: Props) {
  return (
    <div className="screen page-content body">
      <header className="page-header page-header--compact">
        <BackButton onClick={onBack} />
        <div className="page-header__title-block">
          <h1>Message</h1>
        </div>
      </header>

      <div className="message-detail-badges">
        <Badge tone={message.channel === 'sms' ? 'blue' : 'green'}>{message.channel}</Badge>
        <Badge tone={message.status === 'failed' ? 'red' : 'green'}>{message.status}</Badge>
      </div>

      <Card className="message-detail-body">
        <p className="message-detail-body__text">{message.body}</p>
      </Card>

      <SectionGroup title="Details">
        <ListRow title="Client" trailing={message.client_name} />
        <ListRow title="Sent" trailing={formatMessageTimestamp(message.sent_at)} />
        <ListRow title="Channel" trailing={message.channel.toUpperCase()} />
      </SectionGroup>
    </div>
  )
}
