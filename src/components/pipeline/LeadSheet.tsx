'use client'

import { useEffect, useRef, useState } from 'react'
import BottomSheet from '@/components/BottomSheet'
import {
  FloatingField,
  FormProgressBar,
  PillGroup,
  SheetSubmitButton,
} from '@/components/forms'
import { createLead, updateLead } from '@/lib/api'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { computeLeadFormProgress, isLeadFormSubmittable } from '@/lib/lead-form-progress'
import { LEAD_SOURCES } from '@/lib/lead-sources'
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

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState<LeadSource>('other')
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan')
  const [packageId, setPackageId] = useState('')
  const [serviceInterest, setServiceInterest] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = computeLeadFormProgress({
    name,
    phone,
    email,
    quoteAmount,
    serviceInterest,
    notes,
    hasVehicle: true,
    hasSource: true,
  })

  const canSubmit = isLeadFormSubmittable(progress, name, isEdit) && !saving && !saved

  useEffect(() => {
    if (!lead) {
      setName('')
      setPhone('')
      setEmail('')
      setSource('other')
      setVehicleType('sedan')
      setPackageId('')
      setServiceInterest('')
      setQuoteAmount('')
      setNotes('')
      setSaved(false)
      return
    }
    setName(lead.name)
    setPhone(lead.phone ?? '')
    setEmail(lead.email ?? '')
    setSource(lead.source)
    setVehicleType(lead.vehicle_type)
    setPackageId(lead.package_id ?? '')
    setServiceInterest(lead.service_interest ?? '')
    setQuoteAmount(lead.quote_amount ? String(lead.quote_amount) : '')
    setNotes(lead.notes ?? '')
    setSaved(false)
  }, [lead])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(packageRef.current)
  }, [name, phone, email, source, vehicleType, packageId, serviceInterest, quoteAmount, notes, lead])

  const buildInput = (): LeadInput | null => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const parsedAmount = quoteAmount.trim() ? Number(quoteAmount) : undefined
    return {
      name: trimmed,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      source,
      vehicle_type: vehicleType,
      package_id: packageId || undefined,
      service_interest: serviceInterest.trim() || undefined,
      quote_amount: parsedAmount && parsedAmount > 0 ? parsedAmount : undefined,
      notes: notes.trim() || undefined,
      stage: lead?.stage ?? 'inquiry',
      client_id: lead?.client_id,
      quote_id: lead?.quote_id,
      job_id: lead?.job_id,
    }
  }

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!canSubmit && !isEdit) return
    const input = buildInput()
    if (!input) {
      setError('Name is required')
      return
    }
    if (isEdit && lead) {
      setSaving(true)
      setError(null)
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
        setError(err instanceof Error ? err.message : 'Could not save lead')
        setSaving(false)
        setSaved(false)
      }
      return
    }

    runNewLeadGated(() => {
      void (async () => {
        setSaving(true)
        setError(null)
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
          setError(err instanceof Error ? err.message : 'Could not save lead')
          setSaving(false)
          setSaved(false)
        }
      })()
    })
  }

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
          onClick={(e) => void handleSave(e)}
        />
      }
    >
      {error ? <div className="error-banner premium-sheet__section">{error}</div> : null}

      {!isEdit ? <FormProgressBar progress={progress} /> : null}

      <div ref={formRef} className="premium-sheet__form">
        <div className="premium-sheet__grid2">
          <FloatingField id="lead-name" label="Name" filled={name.trim().length > 0}>
            <input
              id="lead-name"
              className={`f-input${name.trim() ? ' hv' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
              autoFocus
            />
          </FloatingField>

          <FloatingField id="lead-phone" label="Phone" filled={phone.trim().length > 0}>
            <input
              id="lead-phone"
              className={`f-input${phone.trim() ? ' hv' : ''}`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=" "
            />
          </FloatingField>
        </div>

        <div className="premium-sheet__grid2">
          <FloatingField id="lead-email" label="Email" filled={email.trim().length > 0}>
            <input
              id="lead-email"
              className={`f-input${email.trim() ? ' hv' : ''}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingField id="lead-quote-amount" label="Quote ($)" filled={quoteAmount.trim().length > 0}>
            <input
              id="lead-quote-amount"
              className={`f-input${quoteAmount.trim() ? ' hv' : ''}`}
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder=" "
              inputMode="decimal"
            />
          </FloatingField>
        </div>

        <div className="f-form-divider" />

        <PillGroup label="Vehicle type" options={VEHICLE_PILLS} value={vehicleType} onChange={setVehicleType} />

        <PillGroup
          label="Source"
          options={isEdit ? LEAD_SOURCES : SOURCE_PILLS}
          value={source}
          onChange={setSource}
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

        <FloatingField id="lead-service" label="Service interest" filled={serviceInterest.trim().length > 0}>
          <input
            id="lead-service"
            className={`f-input${serviceInterest.trim() ? ' hv' : ''}`}
            value={serviceInterest}
            onChange={(e) => setServiceInterest(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="lead-notes" label="Notes" filled={notes.trim().length > 0} textarea>
          <textarea
            id="lead-notes"
            className={`f-textarea${notes.trim() ? ' hv' : ''}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder=" "
            rows={3}
          />
        </FloatingField>
      </div>
    </BottomSheet>
  )
}
