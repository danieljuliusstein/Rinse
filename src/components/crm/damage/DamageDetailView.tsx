'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingField, SheetSubmitButton } from '@/components/forms'
import { Badge, Button, Card, ListRow, SectionGroup } from '@/components/ui'
import { deleteDamageDoc, updateDamageDocNote } from '@/lib/api'
import { useConfirm } from '@/providers/ConfirmProvider'
import { formatCapturedAt, formatDamageDate } from '@/lib/damage-docs'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import type { DamageRecord } from '@/lib/types'

interface DamageDetailViewProps {
  clientId: string
  vehicleId: string
  damage: DamageRecord
  photoIndex?: number
  photoTotal?: number
}

export default function DamageDetailView({
  clientId,
  vehicleId,
  damage,
  photoIndex = 1,
  photoTotal = 1,
}: DamageDetailViewProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const formRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(damage.note)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!editing) return
    syncPrefilledFloatingLabels(formRef.current)
  }, [editing, note])

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete damage record?',
      message: 'Delete this damage record? This cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    void deleteDamageDoc(damage.id).then((ok) => {
      if (ok) router.replace(`/clients/${clientId}/vehicles/${vehicleId}`)
      else setBusy(false)
    })
  }

  const handleSaveNote = async () => {
    setBusy(true)
    try {
      await updateDamageDocNote(damage.id, note.trim())
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen page-content body damage-screen">
      <header className="page-header page-header--compact crm-page-header">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>Damage detail</h1>
        </div>
        {!editing ? (
          <button type="button" className="ui-section__action" onClick={() => setEditing(true)}>
            Edit note
          </button>
        ) : null}
      </header>

      <Card className="crm-detail-photo job-form-section">
        {damage.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={damage.photo_url} alt="" className="crm-detail-photo__img" />
        ) : (
          <div className="crm-detail-photo__empty">
            <ImageIcon size={40} weight="duotone" aria-hidden="true" />
            <span>No photo</span>
          </div>
        )}
        <Badge tone="amber" className="crm-detail-photo__badge">
          Pre-existing damage
        </Badge>
        {damage.photo_url ? (
          <span className="crm-detail-photo__count">
            {photoIndex} of {photoTotal} photo
          </span>
        ) : null}
      </Card>

      {editing ? (
        <div ref={formRef} className="page-form-card page-form job-form-section">
          <FloatingField id="damage-edit-note" label="Note" filled={note.trim().length > 0} optional textarea>
            <textarea
              id="damage-edit-note"
              className={`f-textarea${note.trim() ? ' hv' : ''}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder=" "
              rows={4}
            />
          </FloatingField>
          <div className="package-form-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <div className="page-form-save">
              <SheetSubmitButton
                label={busy ? 'Saving…' : 'Save note'}
                ready
                disabled={busy}
                onClick={() => void handleSaveNote()}
              />
            </div>
          </div>
        </div>
      ) : (
        <SectionGroup title="Details">
          <ListRow title="Area" trailing={damage.area} />
          <ListRow title="Note" trailing={damage.note || '—'} />
          <ListRow title="Date" trailing={formatDamageDate(damage.date)} />
          <ListRow title="Captured" trailing={formatCapturedAt(damage.captured_at)} />
        </SectionGroup>
      )}

      {!editing ? (
        <div className="crm-detail-actions">
          <Button variant="danger" disabled={busy} onClick={() => void handleDelete()}>
            Delete record
          </Button>
        </div>
      ) : null}
    </div>
  )
}
