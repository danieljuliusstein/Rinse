'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  CalendarBlank,
  CheckCircle,
  Circle,
  Clock,
  House,
  MagnifyingGlass,
  MapPin,
  Plus,
} from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import JobExpensesSheet, { type JobExpenseDraft } from '@/components/jobs/JobExpensesSheet'
import JobSuppliesConfirmSheet from '@/components/jobs/JobSuppliesConfirmSheet'
import { useActionToast } from '@/providers/ActionToastProvider'
import { getSupplies } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import { deriveInitials } from '@/lib/client-relationship-logic'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { loadSettingsAsync } from '@/lib/settings'
import { usePremiumGate } from '@/hooks/usePremiumGate'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { useRinseForm } from '@/hooks/useRinseForm'
import { PillGroup } from '@/components/forms'
import { RECURRENCE_CADENCE_OPTIONS } from '@/lib/recurrence'
import { quickJobFormSchema, type QuickJobFormValues } from '@/lib/validation'
import type { ClientWithStats, Package, QuickJobData, Supply, SupplyUsage, VehicleType } from '@/lib/types'
import { VEHICLE_TYPE_OPTIONS } from '@/lib/vehicle-type-icons'

interface QuickAddJobProps {
  packages: Package[]
  clients: ClientWithStats[]
  initialClient?: ClientWithStats | null
  initialPackageId?: string
  initialDate?: string
  onSave: (data: QuickJobData) => Promise<{ id: string }>
}

const VEHICLE_TYPES = VEHICLE_TYPE_OPTIONS

function formatHeaderDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function QuickAddJob({
  packages,
  clients,
  initialClient,
  initialPackageId,
  initialDate,
  onSave,
}: QuickAddJobProps) {
  const router = useRouter()
  const { handleWriteError } = useActionToast()
  const { runGated: runCreateJobGated } = usePremiumGate('create_job')
  const formRef = useRef<HTMLDivElement>(null)

  const initialPkg = packages.find((p) => p.id === initialPackageId) ?? packages[0]

  const [clientSearch, setClientSearch] = useState('')
  const debouncedClientSearch = useDebouncedSearch(clientSearch)
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(initialClient ?? null)
  const [showClientList, setShowClientList] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(initialPkg ?? null)
  const [expenses, setExpenses] = useState<JobExpenseDraft>({
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
  })
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [suppliesSheetOpen, setSuppliesSheetOpen] = useState(false)
  const [catalogSupplies, setCatalogSupplies] = useState<Supply[]>([])
  const [pendingSupplies, setPendingSupplies] = useState<SupplyUsage[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [travelRatePerMile, setTravelRatePerMile] = useState<number | undefined>()

  const {
    control,
    watch,
    setValue,
    getValues,
    submitWithToast,
  } = useRinseForm<QuickJobFormValues>({
    schema: quickJobFormSchema,
    defaultValues: {
      clientId: initialClient?.id ?? '',
      packageId: initialPackageId ?? initialPkg?.id ?? '',
      vehicleType: 'sedan',
      locationType: 'mobile',
      revenue: initialPkg?.base_price ?? 0,
      tip: 0,
      date: initialDate ?? new Date().toISOString().slice(0, 10),
      start_time: '',
      notes: '',
      travel_cost: 0,
      marketing_cost: 0,
      equipment_depreciation: 0,
      recurrence_cadence: 'none',
    },
  })

  const clientId = watch('clientId')
  const packageId = watch('packageId')
  const vehicleType = watch('vehicleType') as VehicleType
  const locationType = watch('locationType')
  const revenue = watch('revenue')
  const tip = watch('tip')
  const jobDate = watch('date')
  const startTime = watch('start_time')
  const notes = watch('notes')
  const recurrenceCadence = watch('recurrence_cadence')

  useEffect(() => {
    void loadSettingsAsync().then((s) => setTravelRatePerMile(s.travel_rate_per_mile))
  }, [])

  useEffect(() => {
    if (initialClient) {
      setSelectedClient(initialClient)
      setValue('clientId', initialClient.id)
      setClientSearch('')
    }
  }, [initialClient, setValue])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [revenue, tip, notes, startTime])

  const filteredClients = clients.filter((c) => {
    const q = debouncedClientSearch.toLowerCase()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone?.includes(debouncedClientSearch) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const isValid =
    Boolean(clientId) &&
    Boolean(packageId) &&
    Boolean(vehicleType) &&
    revenue > 0

  const handlePackageSelect = useCallback((pkg: Package) => {
    setSelectedPackage(pkg)
    setValue('packageId', pkg.id)
    setValue('revenue', pkg.base_price)
  }, [setValue])

  const buildPayload = (values: QuickJobFormValues, supplies_used?: SupplyUsage[]): QuickJobData => ({
    clientId: values.clientId,
    clientName: selectedClient!.name,
    packageId: values.packageId,
    vehicleType: values.vehicleType as VehicleType,
    locationType: values.locationType,
    revenue: values.revenue,
    tip: values.tip,
    date: values.date,
    start_time: values.start_time || undefined,
    notes: values.notes?.trim() || undefined,
    travel_cost: expenses.travel_cost,
    marketing_cost: expenses.marketing_cost,
    equipment_depreciation: expenses.equipment_depreciation,
    supplies_used,
    recurrence_cadence:
      values.recurrence_cadence === 'none' || !values.recurrence_cadence
        ? undefined
        : values.recurrence_cadence,
    recurrence_anchor_date:
      values.recurrence_cadence === 'none' || !values.recurrence_cadence
        ? undefined
        : values.date,
  })

  const performSave = async (values: QuickJobFormValues, supplies_used?: SupplyUsage[]) => {
    setSaving(true)
    try {
      const job = await onSave(buildPayload(values, supplies_used))
      router.push(`/jobs/${job.id}`)
    } catch (err) {
      if (handleWriteError(err)) return
      setSaveError(err instanceof Error ? err.message : 'Could not save job.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = submitWithToast((values) => {
    setSaveError(null)
    runCreateJobGated(() => {
      void (async () => {
        const appSettings = await loadSettingsAsync()
        if (!appSettings.track_job_supplies) {
          await performSave(values)
          return
        }
        const supplies = await getSupplies()
        setCatalogSupplies(supplies)
        setPendingSupplies(null)
        setSuppliesSheetOpen(true)
      })()
    })
  })

  const headerDate = formatHeaderDate(new Date())

  return (
    <div className="screen page-content body new-job">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>New job</h1>
        </div>
        <span className="page-header__meta">{headerDate}</span>
      </header>

      {/* 1. Client */}
      <section id="nj-client" className="new-job-section">
        <div className="section-title">Client</div>
          {selectedClient ? (
            <button
              type="button"
              className="new-job-client-selected"
              onClick={() => {
                setSelectedClient(null)
                setValue('clientId', '')
                setClientSearch('')
                setShowClientList(true)
              }}
            >
              <span className="new-job-client-avatar new-job-client-avatar--selected">
                {deriveInitials(selectedClient.name)}
              </span>
              <span className="new-job-client-selected-text">
                <span className="new-job-client-selected-name">{selectedClient.name}</span>
                <span className="new-job-client-selected-meta">
                  {selectedClient.jobCount} job{selectedClient.jobCount !== 1 ? 's' : ''} ·{' '}
                  {fmt(selectedClient.totalRevenue)} lifetime
                </span>
              </span>
              <CheckCircle size={18} weight="fill" color="var(--green-text)" className="new-job-client-check" />
            </button>
          ) : (
            <div className="new-job-client-search-wrap">
              <MagnifyingGlass size={16} className="new-job-search-icon" aria-hidden="true" />
              <input
                className="new-job-input new-job-input--search"
                placeholder="Search clients..."
                value={clientSearch}
                onFocus={() => setShowClientList(true)}
                onBlur={() => setTimeout(() => setShowClientList(false), 150)}
                onChange={(e) => setClientSearch(e.target.value)}
              />
              {showClientList && filteredClients.length > 0 && (
                <div className="new-job-client-dropdown">
                  {filteredClients.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="new-job-client-option"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedClient(c)
                        setValue('clientId', c.id)
                        setClientSearch('')
                        setShowClientList(false)
                      }}
                    >
                      <span className="new-job-client-avatar">{deriveInitials(c.name)}</span>
                      <span className="new-job-client-option-text">
                        <span className="new-job-client-option-name">{c.name}</span>
                        <span className="new-job-client-option-meta">
                          {c.jobCount} job{c.jobCount !== 1 ? 's' : ''} · {fmt(c.totalRevenue)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Date & Time */}
        <section id="nj-datetime" className="new-job-section">
          <div className="section-title">Date &amp; Time</div>
          <div className="new-job-datetime-grid">
            <label className="new-job-datetime-box" htmlFor="nj-date">
              <CalendarBlank size={16} color="var(--text-muted)" aria-hidden="true" />
              <input
                id="nj-date"
                type="date"
                className="new-job-datetime-native"
                value={jobDate}
                onChange={(e) => setValue('date', e.target.value)}
              />
            </label>
            <label className="new-job-datetime-box" htmlFor="nj-time">
              <Clock size={16} color="var(--text-muted)" aria-hidden="true" />
              <input
                id="nj-time"
                type="time"
                className="new-job-datetime-native"
                value={startTime ?? ''}
                onChange={(e) => setValue('start_time', e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* 3. Service & Vehicle */}
        <section id="nj-service" className="new-job-section">
          <div className="section-title">Package</div>
          {packages.length === 0 ? (
            <p className="new-job-empty-hint">
              No packages yet.{' '}
              <a href="/settings/packages" className="new-job-link">
                Add one in Settings
              </a>
            </p>
          ) : (
            <div className="new-job-package-list">
              {packages.map((pkg) => {
                const selected = packageId === pkg.id
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`new-job-package-card${selected ? ' new-job-package-card--selected' : ''}`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <span className="new-job-package-left">
                      <span className="new-job-package-name">{pkg.name}</span>
                      {pkg.description && (
                        <span className="new-job-package-desc">{pkg.description}</span>
                      )}
                    </span>
                    <span className="new-job-package-right">
                      <span className="new-job-package-price">{fmt(pkg.base_price)}</span>
                      {selected ? (
                        <CheckCircle size={18} weight="fill" color="var(--green-text)" />
                      ) : (
                        <Circle size={18} className="new-job-package-card__ring" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                )
              })}
              <button
                type="button"
                className="new-job-add-package"
                onClick={() => router.push('/settings/packages')}
              >
                <Plus size={14} aria-hidden="true" />
                Add new package
              </button>
            </div>
          )}

          <div className="section-title new-job-section-title--tight">Vehicle type</div>
          <div className="new-job-vehicle-grid">
            {VEHICLE_TYPES.map((v) => {
              const active = vehicleType === v.id
              const { Icon } = v
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`new-job-vehicle-btn${active ? ' new-job-vehicle-btn--selected' : ''}`}
                  onClick={() => setValue('vehicleType', v.id)}
                >
                  <Icon size={22} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                  <span>{v.label}</span>
                </button>
              )
            })}
          </div>

          <div className="section-title">Location</div>
          <div className="new-job-location-toggle">
            <button
              type="button"
              className={`new-job-location-opt${locationType === 'mobile' ? ' new-job-location-opt--selected' : ''}`}
              onClick={() => setValue('locationType', 'mobile')}
            >
              <MapPin size={15} aria-hidden="true" />
              Mobile
            </button>
            <button
              type="button"
              className={`new-job-location-opt${locationType === 'fixed' ? ' new-job-location-opt--selected' : ''}`}
              onClick={() => setValue('locationType', 'fixed')}
            >
              <House size={15} aria-hidden="true" />
              Fixed
            </button>
          </div>
        </section>

        <div ref={formRef} className="page-form">
          {/* 4. Revenue */}
          <section id="nj-revenue" className="new-job-section">
            <div className="page-form__grid2">
              <Controller
                control={control}
                name="revenue"
                render={({ field, fieldState }) => (
                  <FloatingAffixField
                    id="nj-revenue"
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
                    id="nj-tip"
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
          </section>

          {/* 5. Notes */}
          <section id="nj-notes" className="new-job-section">
            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <FloatingField
                  id="nj-notes"
                  label="Notes"
                  filled={Boolean(field.value?.trim())}
                  error={fieldState.error?.message}
                  optional
                  textarea
                >
                  <textarea
                    id="nj-notes"
                    className={`f-textarea${field.value?.trim() ? ' hv' : ''}`}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    rows={3}
                    placeholder=" "
                  />
                </FloatingField>
              )}
            />
          </section>

          <section id="nj-recurrence" className="new-job-section">
            <PillGroup
              label="Repeat"
              value={recurrenceCadence ?? 'none'}
              options={RECURRENCE_CADENCE_OPTIONS}
              onChange={(v) => setValue('recurrence_cadence', v)}
            />
          </section>
        </div>

        {saveError && <p className="new-job-error" role="alert" aria-live="assertive">{saveError}</p>}

      <div className="package-form-actions new-job-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setExpenseSheetOpen(true)}
        >
          <Plus size={14} aria-hidden="true" />
          Expenses
        </button>
        <div className="page-form-save">
          <SheetSubmitButton
            label={saving ? 'Saving…' : 'Save job'}
            ready={isValid}
            disabled={saving}
            onClick={() => void handleSave()}
          />
        </div>
      </div>

      {expenseSheetOpen && (
        <JobExpensesSheet
          value={expenses}
          travelRatePerMile={travelRatePerMile}
          onSave={setExpenses}
          onClose={() => setExpenseSheetOpen(false)}
        />
      )}

      {suppliesSheetOpen && (
        <JobSuppliesConfirmSheet
          supplies={catalogSupplies}
          pkg={selectedPackage ?? undefined}
          initialUsed={pendingSupplies ?? undefined}
          onConfirm={(used) => {
            setSuppliesSheetOpen(false)
            void performSave(getValues(), used)
          }}
          onClose={() => setSuppliesSheetOpen(false)}
        />
      )}
    </div>
  )
}
