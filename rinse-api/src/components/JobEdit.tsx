'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { CalendarBlank } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, PillGroup, SheetSubmitButton } from '@/components/forms'
import { PackagePickerGrid } from '@/components/jobs/JobFormPickers'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import JobSuppliesConfirmSheet from '@/components/jobs/JobSuppliesConfirmSheet'
import JobSuppliesPicker from '@/components/jobs/JobSuppliesPicker'
import { buildJobIcs, downloadIcs } from '@/lib/calendar-ics'
import { isCompletingJob } from '@/lib/supplies-logic'
import { loadSettingsAsync } from '@/lib/settings'
import { useActionToast } from '@/providers/ActionToastProvider'
import { useRinseForm } from '@/hooks/useRinseForm'
import { VehicleTypePicker } from '@/lib/vehicle-type-icons'
import { RECURRENCE_CADENCE_OPTIONS } from '@/lib/recurrence'
import { successHaptic } from '@/lib/haptics'
import { jobEditFormSchema, type JobEditFormValues } from '@/lib/validation'
import type { JobEditData, JobStatus, JobWithRelations, Package, Supply, SupplyUsage } from '@/lib/types'

const LOCATION_PILLS = [
  { value: 'mobile' as const, label: 'Mobile' },
  { value: 'fixed' as const, label: 'Fixed' },
]

const STATUSES: { id: JobStatus; label: string; badge: string }[] = [
  { id: 'scheduled', label: 'Scheduled', badge: 'badge-scheduled' },
  { id: 'in_progress', label: 'In progress', badge: 'badge-pending' },
  { id: 'completed', label: 'Completed', badge: 'badge-draft' },
  { id: 'invoiced', label: 'Invoiced', badge: 'badge-pending' },
  { id: 'paid', label: 'Paid', badge: 'badge-paid' },
]

interface JobEditProps {
  job: JobWithRelations
  packages: Package[]
  supplies: Supply[]
  onSave: (data: JobEditData) => Promise<void>
}

export default function JobEdit({ job, packages, supplies, onSave }: JobEditProps) {
  const router = useRouter()
  const { handleWriteError } = useActionToast()
  const formRef = useRef<HTMLDivElement>(null)
  const [packageId, setPackageId] = useState(job.package_id)
  const [vehicleType, setVehicleType] = useState(job.vehicle_type)
  const [locationType, setLocationType] = useState(job.location_type)
  const [suppliesUsed, setSuppliesUsed] = useState<SupplyUsage[]>(job.supplies_used)
  const [suppliesSheetOpen, setSuppliesSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const {
    control,
    watch,
    setValue,
    submitWithToast,
  } = useRinseForm<JobEditFormValues>({
    schema: jobEditFormSchema,
    defaultValues: {
      date: job.date,
      revenue: job.revenue,
      tip: job.tip,
      hours_worked: job.hours_worked,
      start_time: job.start_time ?? '',
      status: job.status,
      notes: job.notes ?? '',
      travel_cost: job.travel_cost,
      marketing_cost: job.marketing_cost,
      equipment_depreciation: job.equipment_depreciation,
      recurrence_cadence: job.recurrence_cadence ?? 'none',
    },
  })

  const date = watch('date')
  const revenue = watch('revenue')
  const tip = watch('tip')
  const hoursWorked = watch('hours_worked')
  const startTime = watch('start_time')
  const notes = watch('notes')
  const travelCost = watch('travel_cost')
  const marketingCost = watch('marketing_cost')
  const equipmentCost = watch('equipment_depreciation')
  const status = watch('status')
  const recurrenceCadence = watch('recurrence_cadence')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [date, revenue, tip, hoursWorked, startTime, notes, travelCost, marketingCost, equipmentCost])

  const handlePackageSelect = useCallback((pkg: Package) => {
    setPackageId(pkg.id)
    setValue('revenue', pkg.base_price)
    if (pkg.default_supplies?.length) {
      setSuppliesUsed(pkg.default_supplies.map((d) => ({
        supply_id: d.supply_id,
        quantity_used: d.default_qty,
      })))
    }
  }, [setValue])

  const saveJob = async (values: JobEditFormValues, used: SupplyUsage[]) => {
    setSaving(true)
    setSaveError('')
    try {
      await onSave({
        date: values.date,
        packageId,
        vehicleType,
        locationType,
        revenue: values.revenue,
        tip: values.tip,
        hours_worked: values.hours_worked,
        start_time: values.start_time || undefined,
        status: values.status,
        notes: values.notes || undefined,
        supplies_used: used,
        travel_cost: values.travel_cost,
        marketing_cost: values.marketing_cost,
        equipment_depreciation: values.equipment_depreciation,
        recurrence_cadence:
          values.recurrence_cadence === 'none' || !values.recurrence_cadence
            ? undefined
            : values.recurrence_cadence,
        recurrence_anchor_date:
          values.recurrence_cadence === 'none'
            ? undefined
            : job.recurrence_anchor_date ?? values.date,
      })
      successHaptic()
      setSaved(true)
      window.setTimeout(() => router.push(`/jobs/${job.id}`), 1500)
    } catch (err) {
      if (handleWriteError(err)) return
      setSaveError(err instanceof Error ? err.message : 'Could not save job')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = submitWithToast(async (values) => {
    if (isCompletingJob(job.status, values.status)) {
      const appSettings = await loadSettingsAsync()
      if (appSettings.track_job_supplies) {
        setSuppliesSheetOpen(true)
        return
      }
    }
    await saveJob(values, suppliesUsed)
  })

  const handleAddToCalendar = () => {
    const pkg = packages.find((p) => p.id === packageId)
    const ics = buildJobIcs({
      uid: job.id,
      title: `${job.client?.name ?? 'Client'} — ${pkg?.name ?? 'Detail'}`,
      description: notes || undefined,
      date,
      startTime: startTime || undefined,
    })
    downloadIcs(`job-${job.id}`, ics)
  }

  return (
    <div className="screen page-content body">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>Edit job</h1>
        </div>
      </header>

      <div className="section-title">Client</div>
      <div className="card job-form-client-card">{job.client?.name ?? 'Unknown'}</div>

      <div ref={formRef} className="page-form-card page-form">
        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <FloatingField
              id="job-edit-date"
              label="Job date"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="job-edit-date"
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

        {status === 'scheduled' && (
          <button type="button" className="btn-ghost job-form-calendar-btn" onClick={handleAddToCalendar}>
            <CalendarBlank size={18} aria-hidden="true" />
            Add to calendar
          </button>
        )}

        <div className="section-title">Package</div>
        <PackagePickerGrid packages={packages} value={packageId} onChange={handlePackageSelect} />

        <div className="section-title">Vehicle type</div>
        <VehicleTypePicker value={vehicleType} onChange={setVehicleType} />

        <PillGroup label="Location" options={LOCATION_PILLS} value={locationType} onChange={setLocationType} />

        <div className="job-form-grid-2">
          <Controller
            control={control}
            name="revenue"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="job-edit-revenue"
                label="Revenue"
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
            name="tip"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="job-edit-tip"
                label="Tip"
                currency
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div className="job-form-grid-2">
          <Controller
            control={control}
            name="hours_worked"
            render={({ field, fieldState }) => (
              <FloatingField
                id="job-edit-hours"
                label="Hours worked"
                filled={field.value > 0}
                error={fieldState.error?.message}
              >
                <input
                  id="job-edit-hours"
                  className={`f-input${field.value > 0 ? ' hv' : ''}`}
                  type="number"
                  step="0.5"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  onBlur={field.onBlur}
                  placeholder=" "
                />
              </FloatingField>
            )}
          />
          <Controller
            control={control}
            name="start_time"
            render={({ field, fieldState }) => (
              <FloatingField
                id="job-edit-start-time"
                label="Start time"
                filled={(field.value?.trim().length ?? 0) > 0}
                error={fieldState.error?.message}
              >
                <input
                  id="job-edit-start-time"
                  className={`f-input${field.value?.trim() ? ' hv' : ''}`}
                  type="time"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder=" "
                />
              </FloatingField>
            )}
          />
        </div>

        <div className="section-title">Repeat schedule</div>
        <PillGroup
          label="Repeat"
          value={recurrenceCadence ?? 'none'}
          options={RECURRENCE_CADENCE_OPTIONS}
          onChange={(v) => setValue('recurrence_cadence', v)}
        />

        <div className="section-title">Status</div>
        <div className="job-form-status-chips">
          {STATUSES.map((s) => (
            <span
              key={s.id}
              className={`badge ${s.badge}${status === s.id ? '' : ' badge--dim'}`}
              onClick={() => setValue('status', s.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setValue('status', s.id)
              }}
            >
              {s.label}
            </span>
          ))}
        </div>

        <div className="job-form-grid-3">
          <Controller
            control={control}
            name="travel_cost"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="job-edit-travel"
                label="Travel"
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
            name="marketing_cost"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="job-edit-marketing"
                label="Marketing"
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
            name="equipment_depreciation"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="job-edit-equipment"
                label="Equipment"
                currency
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div className="section-title">Supplies used</div>
        <div className="card job-form-supplies-card">
          <JobSuppliesPicker supplies={supplies} value={suppliesUsed} onChange={setSuppliesUsed} />
        </div>

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <FloatingField
              id="job-edit-notes"
              label="Notes"
              filled={(field.value?.trim().length ?? 0) > 0}
              error={fieldState.error?.message}
              optional
              textarea
            >
              <textarea
                id="job-edit-notes"
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

      {saveError ? <div className="error-banner job-form-section">{saveError}</div> : null}

      <div className="page-form-save">
        <SheetSubmitButton
          label={saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
          ready
          done={saved}
          disabled={saving || saved}
          onClick={() => void handleSave()}
        />
        {saved ? <p className="form-save-flash">Saved</p> : null}
      </div>

      {suppliesSheetOpen && (
        <JobSuppliesConfirmSheet
          supplies={supplies}
          pkg={packages.find((p) => p.id === packageId)}
          initialUsed={suppliesUsed}
          onConfirm={(used) => {
            setSuppliesUsed(used)
            setSuppliesSheetOpen(false)
            void saveJob(watch(), used)
          }}
          onClose={() => setSuppliesSheetOpen(false)}
        />
      )}
    </div>
  )
}
