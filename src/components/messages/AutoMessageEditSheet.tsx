'use client'

import { useEffect, useRef, useState } from 'react'
import { VaulSheet } from '@/components/ui'
import { FloatingField, SheetSubmitButton } from '@/components/forms'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { AUTO_MESSAGE_HINT } from '@/lib/messages'
import type { AutoMessageTemplate } from '@/lib/messages'

interface AutoMessageEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: AutoMessageTemplate
  onSave: (emailBody: string) => void
}

export default function AutoMessageEditSheet({
  open,
  onOpenChange,
  template,
  onSave,
}: AutoMessageEditSheetProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const [body, setBody] = useState(template.emailBody)

  useEffect(() => {
    if (open) setBody(template.emailBody)
  }, [open, template.emailBody])

  useEffect(() => {
    if (!open) return
    syncPrefilledFloatingLabels(formRef.current)
  }, [open, body])

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title={`Edit ${template.name}`}>
      <div ref={formRef} className="auto-message-edit-sheet">
        <p className="auto-message-hint">{AUTO_MESSAGE_HINT}</p>
        <p className="auto-message-edit-sheet__tokens">
          Tokens: {'{{name}}'}, {'{{package}}'}, {'{{date}}'}, {'{{time}}'}, {'{{portal_link}}'}, {'{{review_link}}'}
        </p>
        <FloatingField id="auto-msg-body" label="Email body" filled={body.trim().length > 0}>
          <textarea
            id="auto-msg-body"
            className={`f-input f-input--textarea${body.trim() ? ' hv' : ''}`}
            placeholder=" "
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </FloatingField>
        <SheetSubmitButton
          label="Save template"
          ready
          onClick={() => {
            onSave(body)
            onOpenChange(false)
          }}
        />
      </div>
    </VaulSheet>
  )
}
