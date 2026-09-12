'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { PencilSimple, Plus, Package as PackageIcon } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { ListRow, SectionGroup } from '@/components/ui'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import { useRinseForm } from '@/hooks/useRinseForm'
import { createPackage, getAllPackages, updatePackage } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import { CADENCE_PRESETS, cadencePresetLabel, DEFAULT_RETURN_DAYS } from '@/lib/package-cadence'
import { PACKAGE_DURATION_PRESETS, durationPresetLabel } from '@/lib/package-duration'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { packageFormSchema, type PackageFormValues } from '@/lib/validation'
import type { Package } from '@/lib/types'

function packageToFormValues(pkg?: Package): PackageFormValues {
  if (!pkg) {
    return {
      name: '',
      description: '',
      base_price: 0,
      expected_return_days: DEFAULT_RETURN_DAYS,
      duration_minutes: 120,
      custom_duration_minutes: undefined,
    }
  }
  const preset = PACKAGE_DURATION_PRESETS.find((p) => p.minutes === pkg.duration_minutes)
  if (preset) {
    return {
      name: pkg.name,
      description: pkg.description ?? '',
      base_price: pkg.base_price,
      expected_return_days: pkg.expected_return_days,
      duration_minutes: pkg.duration_minutes,
      custom_duration_minutes: undefined,
    }
  }
  return {
    name: pkg.name,
    description: pkg.description ?? '',
    base_price: pkg.base_price,
    expected_return_days: pkg.expected_return_days,
    duration_minutes: 0,
    custom_duration_minutes: pkg.duration_minutes,
  }
}

function resolvedDuration(values: PackageFormValues): number {
  if (values.duration_minutes === 0) {
    return values.custom_duration_minutes && values.custom_duration_minutes > 0
      ? values.custom_duration_minutes
      : 120
  }
  return values.duration_minutes
}

export default function PackagesSettings() {
  const goBack = useSettingsBack()
  const formRef = useRef<HTMLDivElement>(null)
  const returnDaysRef = useRef<HTMLSelectElement>(null)
  const durationRef = useRef<HTMLSelectElement>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const {
    control,
    watch,
    reset,
    submitWithToast,
  } = useRinseForm<PackageFormValues>({
    schema: packageFormSchema,
    defaultValues: packageToFormValues(),
  })

  const name = watch('name')
  const price = watch('base_price')
  const description = watch('description')
  const returnDays = watch('expected_return_days')
  const durationMinutes = watch('duration_minutes')
  const customDuration = watch('custom_duration_minutes')

  const load = async () => setPackages(await getAllPackages())
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!showAdd && !editingId) return
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(returnDaysRef.current)
    syncSelectFloatingLabel(durationRef.current)
  }, [showAdd, editingId, name, price, description, returnDays, durationMinutes, customDuration])

  const resetForm = () => {
    reset(packageToFormValues())
  }

  const startEdit = (pkg: Package) => {
    setEditingId(pkg.id)
    reset(packageToFormValues(pkg))
    setShowAdd(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  const handleToggle = async (pkg: Package) => {
    await updatePackage(pkg.id, { active: !pkg.active })
    await load()
  }

  const handleSaveEdit = submitWithToast(async (values) => {
    if (!editingId) return
    await updatePackage(editingId, {
      name: values.name,
      base_price: values.base_price,
      description: values.description,
      expected_return_days: values.expected_return_days,
      duration_minutes: resolvedDuration(values),
    })
    cancelEdit()
    await load()
  })

  const handleAdd = submitWithToast(async (values) => {
    await createPackage({
      name: values.name,
      base_price: values.base_price,
      description: values.description,
      expected_return_days: values.expected_return_days,
      duration_minutes: resolvedDuration(values),
      active: true,
    })
    setShowAdd(false)
    resetForm()
    await load()
  })

  const customDurationDisplay =
    customDuration !== undefined && customDuration !== null ? String(customDuration) : ''

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">Services &amp; pricing</h1>
        <button
          type="button"
          className="page-header__action"
          onClick={() => {
            setShowAdd(!showAdd)
            cancelEdit()
          }}
          aria-label="Add service"
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <p className="settings-lead">
        Set base prices and revisit cadence for each service. Client follow-up timing and visit
        frequency scores use the cadence from their last booked service.
      </p>

      {(showAdd || editingId) && (
        <div ref={formRef} className="page-form-card page-form job-form-section">
          <div className="section-title">{editingId ? 'Edit service' : 'New service'}</div>

          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <FloatingField
                id="pkg-name"
                label="Service name"
                filled={field.value.trim().length > 0}
                error={fieldState.error?.message}
              >
                <input
                  id="pkg-name"
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
            name="base_price"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="pkg-price"
                label="Price"
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
            name="description"
            render={({ field, fieldState }) => (
              <FloatingField
                id="pkg-description"
                label="Description"
                filled={(field.value?.trim().length ?? 0) > 0}
                error={fieldState.error?.message}
                optional
              >
                <input
                  id="pkg-description"
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
            name="expected_return_days"
            render={({ field, fieldState }) => (
              <FloatingField
                id="pkg-return-days"
                label="Expected revisit"
                filled={Boolean(field.value)}
                error={fieldState.error?.message}
              >
                <select
                  ref={returnDaysRef}
                  id="pkg-return-days"
                  className={`f-select${field.value ? ' hv' : ''}`}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(Number(e.target.value))
                    syncSelectFloatingLabel(returnDaysRef.current)
                  }}
                  onBlur={field.onBlur}
                >
                  {CADENCE_PRESETS.map((preset) => (
                    <option key={preset.days} value={preset.days}>
                      {preset.label} — {preset.hint}
                    </option>
                  ))}
                </select>
              </FloatingField>
            )}
          />

          <Controller
            control={control}
            name="duration_minutes"
            render={({ field, fieldState }) => (
              <FloatingField
                id="pkg-duration"
                label="Booking duration"
                filled={Boolean(field.value || customDurationDisplay)}
                error={fieldState.error?.message}
              >
                <select
                  ref={durationRef}
                  id="pkg-duration"
                  className={`f-select${field.value || customDurationDisplay ? ' hv' : ''}`}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(Number(e.target.value))
                    syncSelectFloatingLabel(durationRef.current)
                  }}
                  onBlur={field.onBlur}
                >
                  {PACKAGE_DURATION_PRESETS.map((preset) => (
                    <option key={preset.minutes} value={preset.minutes}>
                      {preset.label}
                    </option>
                  ))}
                  <option value={0}>Custom</option>
                </select>
              </FloatingField>
            )}
          />

          {durationMinutes === 0 && (
            <Controller
              control={control}
              name="custom_duration_minutes"
              render={({ field, fieldState }) => (
                <FloatingField
                  id="pkg-duration-custom"
                  label="Custom minutes"
                  filled={customDurationDisplay.trim().length > 0}
                  error={fieldState.error?.message}
                >
                  <input
                    id="pkg-duration-custom"
                    type="number"
                    min={15}
                    step={15}
                    className={`f-input${customDurationDisplay.trim() ? ' hv' : ''}`}
                    value={customDurationDisplay}
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
          )}

          <p className="form-field-hint-block">Used to block your calendar when clients book online.</p>

          <div className="package-form-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => (showAdd ? setShowAdd(false) : cancelEdit())}
            >
              Cancel
            </button>
            <div className="page-form-save">
              <SheetSubmitButton
                label={editingId ? 'Save' : 'Add service'}
                ready={name.trim().length > 0}
                onClick={() => void (editingId ? handleSaveEdit() : handleAdd())}
              />
            </div>
          </div>
        </div>
      )}

      <SectionGroup title="Your services">
        {packages.map((pkg) => (
          <ListRow
            key={pkg.id}
            icon={<PackageIcon size={18} weight="duotone" />}
            iconTone="green"
            title={pkg.name}
            subtitle={`${fmt(pkg.base_price)}${pkg.description ? ` · ${pkg.description}` : ''} · ${cadencePresetLabel(pkg.expected_return_days)} · ${durationPresetLabel(pkg.duration_minutes)}`}
            trailing={
              <div className="package-row-actions">
                <button type="button" className="btn-ghost" onClick={() => startEdit(pkg)}>
                  <PencilSimple size={14} weight="bold" aria-hidden="true" />
                  Edit
                </button>
                <button type="button" className="btn-ghost" onClick={() => void handleToggle(pkg)}>
                  {pkg.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            }
          />
        ))}
      </SectionGroup>
    </div>
  )
}
