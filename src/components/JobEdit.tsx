'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
import { VehicleTypePicker } from '@/lib/vehicle-type-icons'
import { RECURRENCE_CADENCE_OPTIONS } from '@/lib/recurrence'
import { successHaptic } from '@/lib/haptics'
import type { JobEditData, JobStatus, JobWithRelations, Package, RecurrenceCadence, Supply, SupplyUsage } from '@/lib/types'

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
  const [date, setDate] = useState(job.date)
  const [packageId, setPackageId] = useState(job.package_id)
  const [vehicleType, setVehicleType] = useState(job.vehicle_type)
  const [locationType, setLocationType] = useState(job.location_type)
  const [revenue, setRevenue] = useState(job.revenue)
  const [tip, setTip] = useState(job.tip)
  const [hoursWorked, setHoursWorked] = useState(job.hours_worked)
  const [startTime, setStartTime] = useState(job.start_time ?? '')
  const [status, setStatus] = useState<JobStatus>(job.status)
  const [notes, setNotes] = useState(job.notes ?? '')
  const [travelCost, setTravelCost] = useState(job.travel_cost)
  const [marketingCost, setMarketingCost] = useState(job.marketing_cost)
  const [equipmentCost, setEquipmentCost] = useState(job.equipment_depreciation)
  const [recurrenceCadence, setRecurrenceCadence] = useState<RecurrenceCadence | 'none'>(
    job.recurrence_cadence ?? 'none'
  )
  const [suppliesUsed, setSuppliesUsed] = useState<SupplyUsage[]>(job.supplies_used)
  const [suppliesSheetOpen, setSuppliesSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [date, revenue, tip, hoursWorked, startTime, notes, travelCost, marketingCost, equipmentCost])

  const handlePackageSelect = useCallback((pkg: Package) => {
    setPackageId(pkg.id)
    setRevenue(pkg.base_price)
    if (pkg.default_supplies?.length) {
      setSuppliesUsed(pkg.default_supplies.map((d) => ({
        supply_id: d.supply_id,
        quantity_used: d.default_qty,
      })))
    }
  }, [])

  const saveJob = async (used: SupplyUsage[]) => {
    setSaving(true)
    setSaveError('')
    try {
      await onSave({
        date,
        packageId,
        vehicleType,
        locationType,
        revenue,
        tip,
        hours_worked: hoursWorked,
        start_time: startTime || undefined,
        status,
        notes: notes || undefined,
        supplies_used: used,
        travel_cost: travelCost,
        marketing_cost: marketingCost,
        equipment_depreciation: equipmentCost,
        recurrence_cadence: recurrenceCadence === 'none' ? undefined : recurrenceCadence,
        recurrence_anchor_date:
          recurrenceCadence === 'none'
            ? undefined
            : job.recurrence_anchor_date ?? date,
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

  const handleSave = async () => {
    if (isCompletingJob(job.status, status)) {
      const appSettings = await loadSettingsAsync()
      if (appSettings.track_job_supplies) {
        setSuppliesSheetOpen(true)
        return
      }
    }
    await saveJob(suppliesUsed)
  }

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
        <FloatingField id="job-edit-date" label="Job date" filled={date.trim().length > 0}>
          <input
            id="job-edit-date"
            className={`f-input${date.trim() ? ' hv' : ''}`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

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
          <FloatingAffixField
            id="job-edit-revenue"
            label="Revenue"
            filled={revenue > 0}
            type="number"
            inputMode="decimal"
            value={revenue || ''}
            onChange={(e) => setRevenue(e.target.value === '' ? 0 : Number(e.target.value))}
          />
          <FloatingAffixField
            id="job-edit-tip"
            label="Tip"
            filled={tip > 0}
            type="number"
            inputMode="decimal"
            value={tip || ''}
            onChange={(e) => setTip(e.target.value === '' ? 0 : Number(e.target.value))}
          />
        </div>

        <div className="job-form-grid-2">
          <FloatingField id="job-edit-hours" label="Hours worked" filled={hoursWorked > 0}>
            <input
              id="job-edit-hours"
              className={`f-input${hoursWorked > 0 ? ' hv' : ''}`}
              type="number"
              step="0.5"
              value={hoursWorked || ''}
              onChange={(e) => setHoursWorked(e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField id="job-edit-start-time" label="Start time" filled={startTime.trim().length > 0}>
            <input
              id="job-edit-start-time"
              className={`f-input${startTime.trim() ? ' hv' : ''}`}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder=" "
            />
          </FloatingField>
        </div>

        <div className="section-title">Repeat schedule</div>
        <PillGroup
          label="Repeat"
          value={recurrenceCadence}
          options={RECURRENCE_CADENCE_OPTIONS}
          onChange={setRecurrenceCadence}
        />

        <div className="section-title">Status</div>
        <div className="job-form-status-chips">
          {STATUSES.map((s) => (
            <span
              key={s.id}
              className={`badge ${s.badge}${status === s.id ? '' : ' badge--dim'}`}
              onClick={() => setStatus(s.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setStatus(s.id)
              }}
            >
              {s.label}
            </span>
          ))}
        </div>

        <div className="job-form-grid-3">
          <FloatingAffixField
            id="job-edit-travel"
            label="Travel"
            filled={travelCost > 0}
            type="number"
            inputMode="decimal"
            value={travelCost || ''}
            onChange={(e) => setTravelCost(e.target.value === '' ? 0 : Number(e.target.value))}
          />
          <FloatingAffixField
            id="job-edit-marketing"
            label="Marketing"
            filled={marketingCost > 0}
            type="number"
            inputMode="decimal"
            value={marketingCost || ''}
            onChange={(e) => setMarketingCost(e.target.value === '' ? 0 : Number(e.target.value))}
          />
          <FloatingAffixField
            id="job-edit-equipment"
            label="Equipment"
            filled={equipmentCost > 0}
            type="number"
            inputMode="decimal"
            value={equipmentCost || ''}
            onChange={(e) => setEquipmentCost(e.target.value === '' ? 0 : Number(e.target.value))}
          />
        </div>

        <div className="section-title">Supplies used</div>
        <div className="card job-form-supplies-card">
          <JobSuppliesPicker supplies={supplies} value={suppliesUsed} onChange={setSuppliesUsed} />
        </div>

        <FloatingField id="job-edit-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
          <textarea
            id="job-edit-notes"
            className={`f-textarea${notes.trim() ? ' hv' : ''}`}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder=" "
          />
        </FloatingField>
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
            void saveJob(used)
          }}
          onClose={() => setSuppliesSheetOpen(false)}
        />
      )}
    </div>
  )
}
