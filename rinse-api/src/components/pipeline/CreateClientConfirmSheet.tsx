'use client'

import BottomSheet from '@/components/BottomSheet'
import { SheetFooter } from '@/components/forms'
import { Card } from '@/components/ui'
import type { LeadWithRelations } from '@/lib/types'

interface Props {
  lead: LeadWithRelations
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

export default function CreateClientConfirmSheet({ lead, onConfirm, onClose, loading }: Props) {
  return (
    <BottomSheet
      variant="light"
      title="Create client from lead?"
      subtitle="A client record is required before sending a quote"
      onClose={onClose}
      footer={
        <SheetFooter
          layout="save-only"
          saveLabel={loading ? 'Creating quote…' : 'Create & continue'}
          ready
          saving={loading}
          disabled={loading}
          onSave={onConfirm}
        />
      }
    >
      <Card className="pipeline-confirm-card">
        <p className="pipeline-confirm-card__name">{lead.name}</p>
        {lead.phone ? <p className="pipeline-confirm-card__line">{lead.phone}</p> : null}
        {lead.email ? <p className="pipeline-confirm-card__line">{lead.email}</p> : null}
        <p className="pipeline-confirm-card__hint">
          We will create a client profile and draft a quote you can send from the quote screen.
        </p>
      </Card>
    </BottomSheet>
  )
}
