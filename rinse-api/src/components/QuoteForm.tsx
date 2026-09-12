'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, PillGroup, SheetSubmitButton } from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { usePremiumGate } from '@/hooks/usePremiumGate'
import { createQuote } from '@/lib/api'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { quoteFormSchema, type QuoteFormValues } from '@/lib/validation'
import { useActionToast } from '@/providers/ActionToastProvider'
import type { Client, Package, VehicleType } from '@/lib/types'

const VEHICLE_TYPES: VehicleType[] = ['sedan', 'suv', 'truck', 'van', 'boat', 'other']

const VEHICLE_PILLS = VEHICLE_TYPES.map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}))

const LOCATION_PILLS = [
  { value: 'mobile' as const, label: 'Mobile' },
  { value: 'fixed' as const, label: 'Fixed' },
]

export default function QuoteForm({
  clients,
  packages,
  initialClientId,
  initialPackageId,
  initialVehicleType,
  initialLocationType,
}: {
  clients: Client[]
  packages: Package[]
  initialClientId?: string
  initialPackageId?: string
  initialVehicleType?: VehicleType
  initialLocationType?: 'mobile' | 'fixed'
}) {
  const router = useRouter()
  const { handleWriteError } = useActionToast()
  const { runGated: runCreateQuoteGated } = usePremiumGate('create_quote')
  const formRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<HTMLSelectElement>(null)
  const packageRef = useRef<HTMLSelectElement>(null)
  const defaultPackageId =
    initialPackageId ?? packages.find((p) => p.active)?.id ?? packages[0]?.id ?? ''
  const defaultClientId =
    initialClientId && clients.some((c) => c.id === initialClientId)
      ? initialClientId
      : clients[0]?.id ?? ''
  const defaultSubtotal = packages.find((p) => p.id === defaultPackageId)?.base_price ?? 0

  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const {
    control,
    watch,
    setValue,
    submitWithToast,
  } = useRinseForm<QuoteFormValues>({
    schema: quoteFormSchema,
    defaultValues: {
      client_id: defaultClientId,
      package_id: defaultPackageId,
      date: new Date().toISOString().slice(0, 10),
      vehicle_type: initialVehicleType ?? 'sedan',
      location_type: initialLocationType ?? 'mobile',
      subtotal: defaultSubtotal,
      notes: '',
      valid_until: (() => {
        const d = new Date()
        d.setDate(d.getDate() + 14)
        return d.toISOString().slice(0, 10)
      })(),
    },
  })

  const clientId = watch('client_id')
  const packageId = watch('package_id')
  const date = watch('date')
  const validUntil = watch('valid_until')
  const subtotal = watch('subtotal')
  const notes = watch('notes')
  const vehicleType = watch('vehicle_type')
  const locationType = watch('location_type')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(clientRef.current)
    syncSelectFloatingLabel(packageRef.current)
  }, [clientId, packageId, date, validUntil, subtotal, notes])

  const onPackageChange = (id: string) => {
    setValue('package_id', id)
    const pkg = packages.find((p) => p.id === id)
    if (pkg) setValue('subtotal', pkg.base_price)
    syncSelectFloatingLabel(packageRef.current)
  }

  const handleSave = submitWithToast(async (values) => {
    runCreateQuoteGated(() => {
      void (async () => {
        setBusy(true)
        setError('')
        try {
          const quote = await createQuote({
            client_id: values.client_id,
            package_id: values.package_id,
            vehicle_type: values.vehicle_type,
            location_type: values.location_type,
            date: values.date,
            subtotal: values.subtotal,
            notes: values.notes,
            valid_until: values.valid_until,
          })
          setSaved(true)
          window.setTimeout(() => router.replace(`/quotes/${quote.id}`), 1500)
        } catch (err) {
          if (handleWriteError(err)) return
          setError(err instanceof Error ? err.message : 'Could not create quote')
        } finally {
          setBusy(false)
        }
      })()
    })
  })

  return (
    <div className="screen page-content body">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>New quote</h1>
        </div>
      </header>

      <div ref={formRef} className="page-form-card page-form">
        <Controller
          control={control}
          name="client_id"
          render={({ field, fieldState }) => (
            <FloatingField
              id="quote-client"
              label="Client"
              filled={Boolean(field.value)}
              error={fieldState.error?.message}
            >
              <select
                ref={clientRef}
                id="quote-client"
                className={`f-select${field.value ? ' hv' : ''}`}
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value)
                  syncSelectFloatingLabel(clientRef.current)
                }}
                onBlur={field.onBlur}
                aria-invalid={fieldState.error ? true : undefined}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FloatingField>
          )}
        />

        <Controller
          control={control}
          name="package_id"
          render={({ field, fieldState }) => (
            <FloatingField
              id="quote-package"
              label="Package"
              filled={Boolean(field.value)}
              error={fieldState.error?.message}
            >
              <select
                ref={packageRef}
                id="quote-package"
                className={`f-select${field.value ? ' hv' : ''}`}
                value={field.value}
                onChange={(e) => onPackageChange(e.target.value)}
                onBlur={field.onBlur}
                aria-invalid={fieldState.error ? true : undefined}
              >
                {packages.filter((p) => p.active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ${p.base_price}</option>
                ))}
              </select>
            </FloatingField>
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <FloatingField
              id="quote-date"
              label="Proposed date"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="quote-date"
                className={`f-input${field.value.trim() ? ' hv' : ''}`}
                type="date"
                value={field.value}
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
          name="valid_until"
          render={({ field, fieldState }) => (
            <FloatingField
              id="quote-valid-until"
              label="Valid until"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="quote-valid-until"
                className={`f-input${field.value.trim() ? ' hv' : ''}`}
                type="date"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                aria-invalid={fieldState.error ? true : undefined}
              />
            </FloatingField>
          )}
        />

        <PillGroup
          label="Vehicle"
          options={VEHICLE_PILLS}
          value={vehicleType}
          onChange={(v) => setValue('vehicle_type', v)}
        />

        <PillGroup
          label="Location"
          options={LOCATION_PILLS}
          value={locationType}
          onChange={(v) => setValue('location_type', v)}
        />

        <Controller
          control={control}
          name="subtotal"
          render={({ field, fieldState }) => (
            <FloatingAffixField
              id="quote-amount"
              label="Amount"
              currency
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <FloatingField
              id="quote-notes"
              label="Notes"
              filled={(field.value?.trim().length ?? 0) > 0}
              error={fieldState.error?.message}
              optional
              textarea
            >
              <textarea
                id="quote-notes"
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

      {error ? <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="page-form-save">
        <SheetSubmitButton
          label={saved ? 'Saved' : busy ? 'Saving…' : 'Create quote'}
          ready={Boolean(clientId && packageId)}
          done={saved}
          disabled={busy || saved}
          onClick={() => void handleSave()}
        />
        {saved ? <p className="form-save-flash">Saved</p> : null}
      </div>
    </div>
  )
}
