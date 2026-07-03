'use client'

import { useEffect, useRef, useState } from 'react'
import BottomSheet from '@/components/BottomSheet'
import { FloatingField, SheetFooter } from '@/components/forms'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import type { LeadWithRelations } from '@/lib/types'

function defaultScheduleDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

export interface ScheduleLeadJobInput {
  date: string
  start_time?: string
}

interface Props {
  lead: LeadWithRelations
  loading?: boolean
  onConfirm: (input: ScheduleLeadJobInput) => void
  onClose: () => void
}

export default function ScheduleLeadJobSheet({ lead, loading, onConfirm, onClose }: Props) {
  const formRef = useRef<HTMLDivElement>(null)
  const [date, setDate] = useState(defaultScheduleDate)
  const [startTime, setStartTime] = useState('')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [date, startTime])

  const ready = date.trim().length > 0

  return (
    <BottomSheet
      variant="light"
      title="Schedule job"
      subtitle={`Create a job for ${lead.name}`}
      onClose={onClose}
      footer={
        <SheetFooter
          layout="save-only"
          saveLabel={loading ? 'Scheduling…' : 'Create job'}
          ready={ready}
          saving={loading}
          disabled={loading || !ready}
          onSave={() => onConfirm({ date, start_time: startTime.trim() || undefined })}
        />
      }
    >
      <div ref={formRef} className="premium-sheet__form">
        <FloatingField id="schedule-date" label="Date" filled={date.trim().length > 0}>
          <input
            id="schedule-date"
            className={`f-input${date.trim() ? ' hv' : ''}`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder=" "
          />
        </FloatingField>
        <FloatingField id="schedule-time" label="Start time" filled={startTime.trim().length > 0} optional>
          <input
            id="schedule-time"
            className={`f-input${startTime.trim() ? ' hv' : ''}`}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder=" "
          />
        </FloatingField>
        <p className="pipeline-confirm-card__hint">
          A client profile will be created if needed. You can edit revenue and location on the job screen.
        </p>
      </div>
    </BottomSheet>
  )
}
