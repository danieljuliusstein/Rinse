'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { FloatingField, SheetSubmitButton } from '@/components/forms'
import VehicleColorSwatchPicker from '@/components/crm/VehicleColorSwatchPicker'
import { useRinseForm } from '@/hooks/useRinseForm'
import { createVehicle, updateVehicle } from '@/lib/api'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { vehicleFormSchema, type VehicleFormValues } from '@/lib/validation'
import type { Vehicle } from '@/lib/types'
import { VehicleTypeIcon, VehicleTypePicker } from '@/lib/vehicle-type-icons'
import { normalizeVehicleColorHex, vehicleIconColorOnPaint } from '@/lib/vehicle-color'

interface Props {
  clientId: string
  vehicle?: Vehicle
}

export default function VehicleForm({ clientId, vehicle }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const isEdit = !!vehicle
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const {
    control,
    watch,
    setValue,
    submitWithToast,
  } = useRinseForm<VehicleFormValues>({
    schema: vehicleFormSchema,
    defaultValues: {
      make: vehicle?.make ?? '',
      model: vehicle?.model ?? '',
      year: vehicle?.year,
      plate: vehicle?.plate ?? '',
      vin: vehicle?.vin ?? '',
      color: vehicle?.color ?? '',
      color_hex: vehicle?.color_hex ?? '',
      type: vehicle?.type ?? 'sedan',
    },
  })

  const make = watch('make')
  const model = watch('model')
  const year = watch('year')
  const plate = watch('plate')
  const vin = watch('vin')
  const color = watch('color')
  const colorHex = watch('color_hex')
  const type = watch('type')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [make, model, year, plate, vin, color])

  const handleSave = submitWithToast(async (values) => {
    setSaving(true)
    setError('')
    const input = {
      client_id: clientId,
      make: values.make,
      model: values.model,
      year: values.year,
      plate: values.plate,
      vin: values.vin,
      color: values.color,
      color_hex: normalizeVehicleColorHex(values.color_hex),
      type: values.type,
    }
    try {
      if (isEdit && vehicle) {
        const updated = await updateVehicle(vehicle.id, input)
        if (!updated) throw new Error('Update failed')
        router.push(`/clients/${clientId}/vehicles/${vehicle.id}`)
      } else {
        const created = await createVehicle(input)
        router.push(`/clients/${clientId}/vehicles/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  })

  const paintHex = normalizeVehicleColorHex(colorHex)
  const yearDisplay = year ? String(year) : ''

  return (
    <div className="screen page-content body">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>{isEdit ? 'Edit vehicle' : 'Add vehicle'}</h1>
        </div>
      </header>

      <div className="vehicle-hero job-form-section">
        <div
          className={`vehicle-hero__icon-wrap${paintHex ? ' vehicle-hero__icon-wrap--paint' : ''}`}
          style={paintHex ? ({ '--vehicle-paint': paintHex } as CSSProperties) : undefined}
        >
          <VehicleTypeIcon
            type={type}
            size={28}
            weight="duotone"
            color={vehicleIconColorOnPaint(colorHex)}
          />
        </div>
      </div>

      <div ref={formRef} className="page-form-card page-form">
        <Controller
          control={control}
          name="year"
          render={({ field, fieldState }) => (
            <FloatingField
              id="vehicle-year"
              label="Year"
              filled={yearDisplay.trim().length > 0}
              error={fieldState.error?.message}
              optional
            >
              <input
                id="vehicle-year"
                className={`f-input${yearDisplay.trim() ? ' hv' : ''}`}
                type="number"
                value={yearDisplay}
                onChange={(e) => {
                  const raw = e.target.value
                  field.onChange(raw === '' ? undefined : Number(raw))
                }}
                onBlur={field.onBlur}
                placeholder=" "
              />
            </FloatingField>
          )}
        />

        <Controller
          control={control}
          name="make"
          render={({ field, fieldState }) => (
            <FloatingField
              id="vehicle-make"
              label="Make"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="vehicle-make"
                className={`f-input${field.value.trim() ? ' hv' : ''}`}
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
          name="model"
          render={({ field, fieldState }) => (
            <FloatingField
              id="vehicle-model"
              label="Model"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="vehicle-model"
                className={`f-input${field.value.trim() ? ' hv' : ''}`}
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
          name="plate"
          render={({ field, fieldState }) => (
            <FloatingField
              id="vehicle-plate"
              label="Plate"
              filled={(field.value?.trim().length ?? 0) > 0}
              error={fieldState.error?.message}
              optional
            >
              <input
                id="vehicle-plate"
                className={`f-input${field.value?.trim() ? ' hv' : ''}`}
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
          name="vin"
          render={({ field, fieldState }) => (
            <FloatingField
              id="vehicle-vin"
              label="VIN"
              filled={(field.value?.trim().length ?? 0) > 0}
              error={fieldState.error?.message}
              optional
            >
              <input
                id="vehicle-vin"
                className={`f-input${field.value?.trim() ? ' hv' : ''}`}
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
          name="color"
          render={({ field, fieldState }) => (
            <FloatingField
              id="vehicle-color"
              label="Color"
              filled={(field.value?.trim().length ?? 0) > 0}
              error={fieldState.error?.message}
              optional
            >
              <input
                id="vehicle-color"
                className={`f-input${field.value?.trim() ? ' hv' : ''}`}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
              />
            </FloatingField>
          )}
        />

        <div>
          <div className="form-field-label form-field-label--tight">Color swatch</div>
          <VehicleColorSwatchPicker value={colorHex ?? ''} onChange={(v) => setValue('color_hex', v)} />
        </div>

        <div>
          <div className="form-field-label">Type</div>
          <VehicleTypePicker value={type} onChange={(v) => setValue('type', v)} />
        </div>
      </div>

      {error ? <div className="error-banner job-form-section">{error}</div> : null}

      <div className="page-form-save">
        <SheetSubmitButton
          label={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
          ready={make.trim().length > 0 && model.trim().length > 0}
          disabled={saving}
          onClick={() => void handleSave()}
        />
      </div>
    </div>
  )
}
