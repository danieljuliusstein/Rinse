'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, PillGroup, SheetSubmitButton } from '@/components/forms'
import { createQuote } from '@/lib/api'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { useActionToast } from '@/providers/ActionToastProvider'
import { usePremiumGate } from '@/hooks/usePremiumGate'
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
  const [clientId, setClientId] = useState(
    initialClientId && clients.some((c) => c.id === initialClientId)
      ? initialClientId
      : clients[0]?.id ?? ''
  )
  const [packageId, setPackageId] = useState(defaultPackageId)
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialVehicleType ?? 'sedan')
  const [locationType, setLocationType] = useState<'mobile' | 'fixed'>(initialLocationType ?? 'mobile')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [subtotal, setSubtotal] = useState(packages.find((p) => p.id === packageId)?.base_price ?? 0)
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  })
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(clientRef.current)
    syncSelectFloatingLabel(packageRef.current)
  }, [clientId, packageId, date, validUntil, subtotal, notes])

  const onPackageChange = (id: string) => {
    setPackageId(id)
    const pkg = packages.find((p) => p.id === id)
    if (pkg) setSubtotal(pkg.base_price)
  }

  const handleSave = async () => {
    if (!clientId || !packageId) return
    runCreateQuoteGated(() => {
      void (async () => {
        setBusy(true)
        setError('')
        try {
          const quote = await createQuote({
            client_id: clientId,
            package_id: packageId,
            vehicle_type: vehicleType,
            location_type: locationType,
            date,
            subtotal,
            notes: notes || undefined,
            valid_until: validUntil,
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
  }

  return (
    <div className="screen page-content">
      <header className="job-form-header">
        <BackButton onClick={() => router.back()} />
        <div className="job-form-header__title">New quote</div>
      </header>

      <div ref={formRef} className="page-form-card page-form">
        <FloatingField id="quote-client" label="Client" filled={Boolean(clientId)}>
          <select
            ref={clientRef}
            id="quote-client"
            className={`f-select${clientId ? ' hv' : ''}`}
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value)
              syncSelectFloatingLabel(clientRef.current)
            }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FloatingField>

        <FloatingField id="quote-package" label="Package" filled={Boolean(packageId)}>
          <select
            ref={packageRef}
            id="quote-package"
            className={`f-select${packageId ? ' hv' : ''}`}
            value={packageId}
            onChange={(e) => {
              onPackageChange(e.target.value)
              syncSelectFloatingLabel(packageRef.current)
            }}
          >
            {packages.filter((p) => p.active).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — ${p.base_price}</option>
            ))}
          </select>
        </FloatingField>

        <FloatingField id="quote-date" label="Proposed date" filled={date.trim().length > 0}>
          <input
            id="quote-date"
            className={`f-input${date.trim() ? ' hv' : ''}`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="quote-valid-until" label="Valid until" filled={validUntil.trim().length > 0}>
          <input
            id="quote-valid-until"
            className={`f-input${validUntil.trim() ? ' hv' : ''}`}
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <PillGroup label="Vehicle" options={VEHICLE_PILLS} value={vehicleType} onChange={setVehicleType} />

        <PillGroup label="Location" options={LOCATION_PILLS} value={locationType} onChange={setLocationType} />

        <FloatingAffixField
          id="quote-amount"
          label="Amount"
          filled={subtotal > 0}
          type="number"
          min={0}
          step={1}
          value={subtotal || ''}
          onChange={(e) => setSubtotal(Number(e.target.value))}
        />

        <FloatingField id="quote-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
          <textarea
            id="quote-notes"
            className={`f-textarea${notes.trim() ? ' hv' : ''}`}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder=" "
          />
        </FloatingField>
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
