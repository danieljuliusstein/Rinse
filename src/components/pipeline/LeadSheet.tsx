'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import BottomSheet from '@/components/BottomSheet'
import {
  FloatingAffixField,
  FloatingField,
  FloatingPhoneField,
  FormProgressBar,
  PillGroup,
  SheetSubmitButton,
} from '@/components/forms'
import { createLead, updateLead } from '@/lib/api'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { computeLeadFormProgress, isLeadFormSubmittable } from '@/lib/lead-form-progress'
import { normalizeUSPhone } from '@/lib/phone-format'
import { LEAD_SOURCES } from '@/lib/lead-sources'
import { leadFormSchema, type LeadFormValues } from '@/lib/validation'
import { useRinseForm } from '@/hooks/useRinseForm'
import { useActionToast } from '@/providers/ActionToastProvider'
import { usePremiumGate } from '@/hooks/usePremiumGate'
import type { Lead, LeadInput, LeadSource, Package, VehicleType } from '@/lib/types'

const VEHICLE_PILLS: { value: VehicleType; label: string }[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
]

const SOURCE_PILLS: { value: LeadSource; label: string }[] = [
  { value: 'google', label: 'Google' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Walk-in' },
]

interface LeadSheetProps {
  lead?: Lead | null
  packages: Package[]
  onClose: () => void
  onSaved?: () => void
}

export default function LeadSheet({ lead, packages, onClose, onSaved }: LeadSheetProps) {
  const { handleWriteError } = useActionToast()
  const { runGated: runNewLeadGated } = usePremiumGate('new_lead')
  const isEdit = Boolean(lead)
  const formRef = useRef<HTMLDivElement>(null)
  const packageRef = useRef<HTMLSelectElement>(null)

  const [packageId, setPackageId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    watch,
    setValue,
    reset,
    submitWithToast,
  } = useRinseForm<LeadFormValues>({
    schema: leadFormSchema,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      source: 'other',
      vehicle_type: 'sedan',
      service_interest: '',
      estimated_value: 0,
      notes: '',
    },
  })

  const name = watch('name')
  const phone = watch('phone')
  const email = watch('email')
  const source = watch('source')
  const vehicleType = watch('vehicle_type')
  const serviceInterest = watch('service_interest')
  const estimatedValue = watch('estimated_value')
  const notes = watch('notes')

  const progress = computeLeadFormProgress({
    name,
    phone: phone ?? '',
    email: email ?? '',
    quoteAmount: estimatedValue && estimatedValue > 0 ? String(estimatedValue) : '',
    serviceInterest: serviceInterest ?? '',
    notes: notes ?? '',
    hasVehicle: true,
    hasSource: true,
  })

  const canSubmit = isLeadFormSubmittable(progress, name, isEdit) && !saving && !saved

  useEffect(() => {
    if (!lead) {
      reset({
        name: '',
        phone: '',
        email: '',
        source: 'other',
        vehicle_type: 'sedan',
        service_interest: '',
        estimated_value: 0,
        notes: '',
      })
      setPackageId('')
      setSaved(false)
      return
    }
    reset({
      name: lead.name,
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source,
      vehicle_type: lead.vehicle_type,
      service_interest: lead.service_interest ?? '',
      estimated_value: lead.quote_amount ?? 0,
      notes: lead.notes ?? '',
    })
    setPackageId(lead.package_id ?? '')
    setSaved(false)
  }, [lead, reset])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(packageRef.current)
  }, [name, phone, email, source, vehicleType, packageId, serviceInterest, estimatedValue, notes, lead])

  const buildInput = (values: LeadFormValues): LeadInput => ({
    name: values.name,
    phone: values.phone ? normalizeUSPhone(values.phone) : undefined,
    email: values.email,
    source: (values.source ?? 'other') as LeadSource,
    vehicle_type: (values.vehicle_type ?? 'sedan') as VehicleType,
    package_id: packageId || undefined,
    service_interest: values.service_interest,
    quote_amount: values.estimated_value && values.estimated_value > 0 ? values.estimated_value : undefined,
    notes: values.notes,
    stage: lead?.stage ?? 'inquiry',
    client_id: lead?.client_id,
    quote_id: lead?.quote_id,
    job_id: lead?.job_id,
  })

  const handleSave = submitWithToast(async (values) => {
    if (!canSubmit && !isEdit) return
    const input = buildInput(values)

    if (isEdit && lead) {
      setSaving(true)
      setSubmitError(null)
      try {
        await updateLead(lead.id, input)
        onSaved?.()
        onClose()
      } catch (err) {
        if (handleWriteError(err)) {
          setSaving(false)
          setSaved(false)
          return
        }
        setSubmitError(err instanceof Error ? err.message : 'Could not save lead')
        setSaving(false)
        setSaved(false)
      }
      return
    }

    runNewLeadGated(() => {
      void (async () => {
        setSaving(true)
        setSubmitError(null)
        try {
          await createLead({ ...input, stage: 'inquiry' })
          setSaving(false)
          setSaved(true)
          window.setTimeout(() => {
            onSaved?.()
            onClose()
          }, 1500)
        } catch (err) {
          if (handleWriteError(err)) {
            setSaving(false)
            setSaved(false)
            return
          }
          setSubmitError(err instanceof Error ? err.message : 'Could not save lead')
          setSaving(false)
          setSaved(false)
        }
      })()
    })
  })

  const submitLabel = saved
    ? '✓ Added to pipeline'
    : saving
      ? 'Saving…'
      : isEdit
        ? 'Save changes'
        : 'Add to pipeline'

  return (
    <BottomSheet
      variant="light"
      title={isEdit ? 'Edit lead' : 'New lead'}
      subtitle="Capture an inquiry before they are a client"
      onClose={onClose}
      footer={
        <SheetSubmitButton
          label={submitLabel}
          ready={canSubmit || isEdit}
          done={saved}
          disabled={saving || saved || !isLeadFormSubmittable(progress, name, isEdit)}
          onClick={() => void handleSave()}
        />
      }
    >
      {submitError ? (
        <div className="error-banner premium-sheet__section" role="alert" aria-live="assertive">
          {submitError}
        </div>
      ) : null}

      {!isEdit ? <FormProgressBar progress={progress} /> : null}

      <div ref={formRef} className="premium-sheet__form">
        <div className="premium-sheet__grid2">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <FloatingField
                id="lead-name"
                label="Name"
                filled={field.value.trim().length > 0}
                error={fieldState.error?.message}
              >
                <input
                  id="lead-name"
                  className={`f-input${field.value.trim() ? ' hv' : ''}`}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder=" "
                  autoFocus
                  aria-invalid={fieldState.error ? true : undefined}
                />
              </FloatingField>
            )}
          />

          <FloatingPhoneField control={control} name="phone" id="lead-phone" label="Phone" optional />
        </div>

        <div className="premium-sheet__grid2">
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FloatingField
                id="lead-email"
                label="Email"
                filled={(field.value ?? '').trim().length > 0}
                error={fieldState.error?.message}
              >
                <input
                  id="lead-email"
                  className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
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
            name="estimated_value"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="lead-quote-amount"
                label="Quote ($)"
                currency
                value={field.value ?? 0}
                onValueChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div className="f-form-divider" />

        <PillGroup
          label="Vehicle type"
          options={VEHICLE_PILLS}
          value={(vehicleType ?? 'sedan') as VehicleType}
          onChange={(v) => setValue('vehicle_type', v)}
        />

        <PillGroup
          label="Source"
          options={isEdit ? LEAD_SOURCES : SOURCE_PILLS}
          value={(source ?? 'other') as LeadSource}
          onChange={(v) => setValue('source', v)}
        />

        {packages.length > 0 ? (
          <FloatingField id="lead-package" label="Service package" filled={Boolean(packageId)}>
            <select
              ref={packageRef}
              id="lead-package"
              className={`f-select${packageId ? ' hv' : ''}`}
              value={packageId}
              onChange={(e) => {
                setPackageId(e.target.value)
                syncSelectFloatingLabel(packageRef.current)
              }}
            >
              <option value=""> </option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — ${pkg.base_price}
                </option>
              ))}
            </select>
          </FloatingField>
        ) : null}

        <Controller
          control={control}
          name="service_interest"
          render={({ field, fieldState }) => (
            <FloatingField
              id="lead-service"
              label="Service interest"
              filled={(field.value ?? '').trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="lead-service"
                className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
              />
            </FloatingField>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <FloatingField
              id="lead-notes"
              label="Notes"
              filled={(field.value ?? '').trim().length > 0}
              error={fieldState.error?.message}
              textarea
            >
              <textarea
                id="lead-notes"
                className={`f-textarea${(field.value ?? '').trim() ? ' hv' : ''}`}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                rows={3}
              />
            </FloatingField>
          )}
        />
      </div>
    </BottomSheet>
  )
}
