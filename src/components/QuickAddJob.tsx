'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
import { PillGroup } from '@/components/forms'
import { RECURRENCE_CADENCE_OPTIONS } from '@/lib/recurrence'
import type { ClientWithStats, Package, QuickJobData, RecurrenceCadence, Supply, SupplyUsage, VehicleType } from '@/lib/types'
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

  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const [showClientList, setShowClientList] = useState(false)
  const [jobDate, setJobDate] = useState(() => initialDate ?? new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(
    () => packages.find((p) => p.id === initialPackageId) ?? packages[0] ?? null
  )
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan')
  const [locationType, setLocationType] = useState<'mobile' | 'fixed'>('mobile')
  const initialPkg = packages.find((p) => p.id === initialPackageId) ?? packages[0]
  const [revenue, setRevenue] = useState(initialPkg?.base_price ?? 0)
  const [tip, setTip] = useState(0)
  const [notes, setNotes] = useState('')
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
  const [recurrenceCadence, setRecurrenceCadence] = useState<RecurrenceCadence | 'none'>('none')

  useEffect(() => {
    void loadSettingsAsync().then((s) => setTravelRatePerMile(s.travel_rate_per_mile))
  }, [])

  useEffect(() => {
    if (initialClient) {
      setSelectedClient(initialClient)
      setClientSearch('')
    }
  }, [initialClient])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [revenue, tip, notes])

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone?.includes(clientSearch) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const isValid =
    Boolean(selectedClient?.id) &&
    Boolean(selectedPackage?.id) &&
    Boolean(vehicleType) &&
    revenue > 0

  const handlePackageSelect = useCallback((pkg: Package) => {
    setSelectedPackage(pkg)
    setRevenue(pkg.base_price)
  }, [])

  const buildPayload = (supplies_used?: SupplyUsage[]): QuickJobData => ({
    clientId: selectedClient!.id,
    clientName: selectedClient!.name,
    packageId: selectedPackage!.id,
    vehicleType,
    locationType,
    revenue,
    tip,
    date: jobDate,
    start_time: startTime || undefined,
    notes: notes.trim() || undefined,
    travel_cost: expenses.travel_cost,
    marketing_cost: expenses.marketing_cost,
    equipment_depreciation: expenses.equipment_depreciation,
    supplies_used,
    recurrence_cadence: recurrenceCadence === 'none' ? undefined : recurrenceCadence,
    recurrence_anchor_date: recurrenceCadence === 'none' ? undefined : jobDate,
  })

  const performSave = async (supplies_used?: SupplyUsage[]) => {
    setSaving(true)
    try {
      const job = await onSave(buildPayload(supplies_used))
      router.push(`/jobs/${job.id}`)
    } catch (err) {
      if (handleWriteError(err)) return
      setSaveError(err instanceof Error ? err.message : 'Could not save job.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaveError(null)
    if (!selectedClient) {
      setSaveError('Select a client.')
      return
    }
    if (!selectedPackage) {
      setSaveError('Select a service package.')
      return
    }
    if (revenue <= 0) {
      setSaveError('Enter revenue greater than zero.')
      return
    }
    runCreateJobGated(() => {
      void (async () => {
        const appSettings = await loadSettingsAsync()
        if (!appSettings.track_job_supplies) {
          await performSave()
          return
        }
        const supplies = await getSupplies()
        setCatalogSupplies(supplies)
        setPendingSupplies(null)
        setSuppliesSheetOpen(true)
      })()
    })
  }

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
                onChange={(e) => setJobDate(e.target.value)}
              />
            </label>
            <label className="new-job-datetime-box" htmlFor="nj-time">
              <Clock size={16} color="var(--text-muted)" aria-hidden="true" />
              <input
                id="nj-time"
                type="time"
                className="new-job-datetime-native"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
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
                const selected = selectedPackage?.id === pkg.id
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
                  onClick={() => setVehicleType(v.id)}
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
              onClick={() => setLocationType('mobile')}
            >
              <MapPin size={15} aria-hidden="true" />
              Mobile
            </button>
            <button
              type="button"
              className={`new-job-location-opt${locationType === 'fixed' ? ' new-job-location-opt--selected' : ''}`}
              onClick={() => setLocationType('fixed')}
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
              <FloatingAffixField
                id="nj-revenue"
                label="Revenue"
                filled={revenue > 0}
                type="number"
                inputMode="decimal"
                value={revenue || ''}
                onChange={(e) => setRevenue(e.target.value === '' ? 0 : Number(e.target.value))}
              />
              <FloatingAffixField
                id="nj-tip"
                label="Tip"
                filled={tip > 0}
                type="number"
                inputMode="decimal"
                value={tip || ''}
                onChange={(e) => setTip(e.target.value === '' ? 0 : Number(e.target.value))}
              />
            </div>
          </section>

          {/* 5. Notes */}
          <section id="nj-notes" className="new-job-section">
            <FloatingField id="nj-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
              <textarea
                id="nj-notes"
                className={`f-textarea${notes.trim() ? ' hv' : ''}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder=" "
              />
            </FloatingField>
          </section>

          <section id="nj-recurrence" className="new-job-section">
            <PillGroup
              label="Repeat"
              value={recurrenceCadence}
              options={RECURRENCE_CADENCE_OPTIONS}
              onChange={setRecurrenceCadence}
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
            void performSave(used)
          }}
          onClose={() => setSuppliesSheetOpen(false)}
        />
      )}
    </div>
  )
}
