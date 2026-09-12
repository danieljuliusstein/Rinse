'use client'

import { useEffect, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { VaulSheet } from '@/components/ui'
import { FloatingField, SheetSubmitButton } from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { AUTO_MESSAGE_HINT } from '@/lib/messages'
import type { AutoMessageTemplate } from '@/lib/messages'
import { autoMessageEditSchema, type AutoMessageEditFormValues } from '@/lib/validation'

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

  const { control, watch, reset, submitWithToast } = useRinseForm<AutoMessageEditFormValues>({
    schema: autoMessageEditSchema,
    defaultValues: {
      emailBody: template.emailBody,
    },
  })

  const body = watch('emailBody')

  useEffect(() => {
    if (!open) return
    reset({ emailBody: template.emailBody })
  }, [open, template.emailBody, reset])

  useEffect(() => {
    if (!open) return
    syncPrefilledFloatingLabels(formRef.current)
  }, [open, body])

  const handleSave = submitWithToast((values) => {
    onSave(values.emailBody)
    onOpenChange(false)
  })

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title={`Edit ${template.name}`}>
      <div ref={formRef} className="auto-message-edit-sheet">
        <p className="auto-message-hint">{AUTO_MESSAGE_HINT}</p>
        <p className="auto-message-edit-sheet__tokens">
          Tokens: {'{{name}}'}, {'{{package}}'}, {'{{date}}'}, {'{{time}}'}, {'{{portal_link}}'}, {'{{review_link}}'}
        </p>
        <Controller
          control={control}
          name="emailBody"
          render={({ field, fieldState }) => (
            <FloatingField
              id="auto-msg-body"
              label="Email body"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <textarea
                id="auto-msg-body"
                className={`f-input f-input--textarea${field.value.trim() ? ' hv' : ''}`}
                placeholder=" "
                rows={8}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FloatingField>
          )}
        />
        <SheetSubmitButton label="Save template" ready onClick={() => void handleSave()} />
      </div>
    </VaulSheet>
  )
}
