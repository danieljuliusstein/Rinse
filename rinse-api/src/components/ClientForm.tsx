'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import {
  FloatingField,
  FloatingPhoneField,
  PillGroup,
  SheetSubmitButton,
} from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { createClient, updateClient } from '@/lib/api'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { normalizeUSPhone } from '@/lib/phone-format'
import { clientFormSchema, type ClientFormValues } from '@/lib/validation'
import { useActionToast } from '@/providers/ActionToastProvider'
import type { Client } from '@/lib/types'

const LEAD_SOURCE_PILLS = [
  { value: 'google', label: 'Google' },
  { value: 'referral', label: 'Referral' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'word_of_mouth', label: 'Word of mouth' },
  { value: 'other', label: 'Other' },
] as const

interface Props {
  client?: Client
}

export default function ClientForm({ client }: Props) {
  const router = useRouter()
  const { handleWriteError } = useActionToast()
  const formRef = useRef<HTMLDivElement>(null)
  const isEdit = !!client
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const {
    control,
    watch,
    setValue,
    submitWithToast,
  } = useRinseForm<ClientFormValues>({
    schema: clientFormSchema,
    defaultValues: {
      name: client?.name ?? '',
      phone: client?.phone ?? '',
      email: client?.email ?? '',
      address: client?.address ?? '',
      lead_source: client?.lead_source ?? 'other',
      notes: client?.notes ?? '',
    },
  })

  const name = watch('name')
  const email = watch('email')
  const address = watch('address')
  const notes = watch('notes')
  const leadSource = watch('lead_source')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [name, email, address, notes])

  const handleSave = submitWithToast(async (values) => {
    setSaving(true)
    setSubmitError('')
    const input = {
      name: values.name,
      phone: values.phone ? normalizeUSPhone(values.phone) : undefined,
      email: values.email,
      address: values.address,
      lead_source: values.lead_source,
      notes: values.notes,
    }
    try {
      if (isEdit && client) {
        const updated = await updateClient(client.id, input)
        if (!updated) throw new Error('Update failed')
        setSaved(true)
        window.setTimeout(() => router.push(`/clients/${client.id}`), 1500)
      } else {
        const created = await createClient(input)
        setSaved(true)
        window.setTimeout(() => router.push(`/clients/${created.id}`), 1500)
      }
    } catch (err) {
      if (handleWriteError(err)) return
      const message = err instanceof Error ? err.message : 'Save failed'
      setSubmitError(message)
    } finally {
      setSaving(false)
    }
  })

  return (
    <div className="screen page-content body">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>{isEdit ? 'Edit client' : 'New client'}</h1>
        </div>
      </header>

      <div ref={formRef} className="page-form-card page-form">
        <div className="page-form__grid2">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <FloatingField
                id="client-name"
                label="Name"
                filled={field.value.trim().length > 0}
                error={fieldState.error?.message}
              >
                <input
                  id="client-name"
                  className={`f-input${field.value.trim() ? ' hv' : ''}`}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder=" "
                  aria-invalid={fieldState.error ? true : undefined}
                  aria-describedby={fieldState.error ? 'client-name-error' : undefined}
                />
              </FloatingField>
            )}
          />
          <FloatingPhoneField control={control} name="phone" id="client-phone" label="Phone" optional />
        </div>

        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <FloatingField
              id="client-email"
              label="Email"
              filled={Boolean(field.value?.trim())}
              error={fieldState.error?.message}
              optional
            >
              <input
                id="client-email"
                className={`f-input${field.value?.trim() ? ' hv' : ''}`}
                type="email"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                aria-invalid={fieldState.error ? true : undefined}
              />
            </FloatingField>
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field, fieldState }) => (
            <FloatingField
              id="client-address"
              label="Address"
              filled={Boolean(field.value?.trim())}
              error={fieldState.error?.message}
              optional
            >
              <input
                id="client-address"
                className={`f-input${field.value?.trim() ? ' hv' : ''}`}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
              />
            </FloatingField>
          )}
        />

        <PillGroup
          label="Lead source"
          options={[...LEAD_SOURCE_PILLS]}
          value={LEAD_SOURCE_PILLS.some((p) => p.value === leadSource) ? (leadSource ?? 'other') : 'other'}
          onChange={(v) => setValue('lead_source', v)}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <FloatingField
              id="client-notes"
              label="Notes"
              filled={Boolean(field.value?.trim())}
              error={fieldState.error?.message}
              optional
              textarea
            >
              <textarea
                id="client-notes"
                className={`f-textarea${field.value?.trim() ? ' hv' : ''}`}
                rows={3}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
              />
            </FloatingField>
          )}
        />
      </div>

      {submitError ? (
        <div className="error-banner" role="alert" aria-live="assertive" style={{ marginBottom: 12 }}>
          {submitError}
        </div>
      ) : null}

      <div className="page-form-save">
        <SheetSubmitButton
          label={saved ? 'Saved' : saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
          ready={name.trim().length > 0}
          done={saved}
          disabled={saving || saved}
          onClick={() => void handleSave()}
        />
        {saved ? <p className="form-save-flash">Saved</p> : null}
      </div>
    </div>
  )
}
