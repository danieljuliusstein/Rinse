'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CameraPlus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingField, PillGroup, SheetSubmitButton } from '@/components/forms'
import {
  createDamageDoc,
  dataUrlToFile,
  getClientJobs,
  getVehicle,
} from '@/lib/api'
import { DAMAGE_AREA_OPTIONS, pendingDamagePhotoKey } from '@/lib/damage-docs'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'

const AREA_PILLS = DAMAGE_AREA_OPTIONS.map((opt) => ({ value: opt, label: opt }))

interface AddDamageFormProps {
  clientId: string
  vehicleId: string
}

export default function AddDamageForm({ clientId, vehicleId }: AddDamageFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const linkedJobRef = useRef<HTMLSelectElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [area, setArea] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [linkedJobId, setLinkedJobId] = useState('')
  const [jobOptions, setJobOptions] = useState<{ id: string; label: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [vehicleLabel, setVehicleLabel] = useState('')

  const pillArea = useMemo(
    () => (DAMAGE_AREA_OPTIONS.includes(area as (typeof DAMAGE_AREA_OPTIONS)[number]) ? area : ''),
    [area]
  )

  useEffect(() => {
    const key = pendingDamagePhotoKey(vehicleId)
    const stored = sessionStorage.getItem(key)
    if (stored) {
      setPhotoPreview(stored)
      sessionStorage.removeItem(key)
      void dataUrlToFile(stored).then(setPhotoFile).catch(() => {})
    }

    getVehicle(vehicleId).then((v) => {
      if (v) setVehicleLabel(`${v.year ?? ''} ${v.make} ${v.model}`.trim())
    })
    getClientJobs(clientId).then((jobs) => {
      setJobOptions(
        jobs.map((j) => ({
          id: j.id,
          label: `${j.date} · ${j.package?.name ?? 'Job'}`,
        }))
      )
    })
  }, [clientId, vehicleId])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(linkedJobRef.current)
  }, [area, note, date, linkedJobId])

  const handleSave = async () => {
    if (!area.trim()) return
    setSaving(true)
    try {
      const capturedAt = new Date().toISOString()
      await createDamageDoc(
        {
          vehicle_id: vehicleId,
          area: area.trim(),
          note: note.trim(),
          date,
          captured_at: capturedAt,
          photo_url: photoPreview,
          linked_job_id: linkedJobId || undefined,
        },
        photoFile
      )
      router.replace(`/clients/${clientId}/vehicles/${vehicleId}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen page-content body damage-screen">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>Add damage</h1>
        </div>
      </header>

      <div className={`crm-photo-preview job-form-section${photoPreview ? ' crm-photo-preview--loaded' : ''}`}>
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="" className="crm-photo-preview__img" />
        ) : (
          <CameraPlus size={32} weight="duotone" className="crm-photo-preview__placeholder" aria-hidden="true" />
        )}
        <span className="crm-photo-preview__label">{area || 'Select an area below'}</span>
      </div>

      <div className="job-form-section">
        <PillGroup
          label="Area"
          options={AREA_PILLS}
          value={pillArea}
          onChange={setArea}
        />
      </div>

      <div ref={formRef} className="page-form-card page-form">
        <FloatingField id="damage-area" label="Custom area" filled={area.trim().length > 0}>
          <input
            id="damage-area"
            className={`f-input${area.trim() ? ' hv' : ''}`}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="damage-note" label="Note" filled={note.trim().length > 0} optional textarea>
          <textarea
            id="damage-note"
            className={`f-textarea${note.trim() ? ' hv' : ''}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder=" "
            rows={3}
          />
        </FloatingField>

        <FloatingField id="damage-date" label="Date" filled={date.trim().length > 0}>
          <input
            id="damage-date"
            type="date"
            className={`f-input${date.trim() ? ' hv' : ''}`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="damage-linked-job" label="Link to job" filled={Boolean(linkedJobId)} optional>
          <select
            ref={linkedJobRef}
            id="damage-linked-job"
            className={`f-select${linkedJobId ? ' hv' : ''}`}
            value={linkedJobId}
            onChange={(e) => {
              setLinkedJobId(e.target.value)
              syncSelectFloatingLabel(linkedJobRef.current)
            }}
          >
            <option value=""> </option>
            {jobOptions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </FloatingField>
      </div>

      {vehicleLabel ? <p className="damage-form-vehicle-hint">Vehicle: {vehicleLabel}</p> : null}

      <div className="page-form-save">
        <SheetSubmitButton
          label={saving ? 'Saving…' : 'Save documentation'}
          ready={area.trim().length > 0}
          disabled={saving}
          onClick={() => void handleSave()}
        />
      </div>
    </div>
  )
}
