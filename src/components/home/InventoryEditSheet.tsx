'use client'

import { useEffect, useRef, useState } from 'react'
import BottomSheet from '@/components/BottomSheet'
import { FloatingAffixField, FloatingField, PillGroup, SheetFooter } from '@/components/forms'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import {
  categoryLabel,
  formatUpdatedDate,
  type HomeInventoryItem,
  type InventoryCategory,
  type InventoryStatus,
} from '@/lib/home-inventory'

const STATUS_PILLS: { value: InventoryStatus; label: string }[] = [
  { value: 'ok', label: 'OK' },
  { value: 'low', label: 'Low' },
]

interface InventoryEditSheetProps {
  item: HomeInventoryItem | null
  category: InventoryCategory
  isNew: boolean
  onSave: (data: {
    name: string
    status?: InventoryStatus
    notes: string
    priceEstimate?: number
  }) => void
  onDelete: () => void
  onClose: () => void
}

export default function InventoryEditSheet({
  item,
  category,
  isNew,
  onSave,
  onDelete,
  onClose,
}: InventoryEditSheetProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<InventoryStatus>('ok')
  const [notes, setNotes] = useState('')
  const [priceEstimate, setPriceEstimate] = useState('')

  const hasStatus = category === 'chemicals' || category === 'supplies'
  const isWishlist = category === 'wishlist'

  useEffect(() => {
    if (!item && !isNew) return
    setName(item?.name ?? '')
    setStatus(item?.status ?? 'ok')
    setNotes(item?.notes ?? '')
    setPriceEstimate(item?.priceEstimate != null ? String(item.priceEstimate) : '')
  }, [item, isNew])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [name, notes, priceEstimate, item, isNew])

  if (!item && !isNew) return null

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({
      name: trimmed,
      status: hasStatus ? status : undefined,
      notes: notes.trim(),
      priceEstimate: isWishlist ? Number(priceEstimate) || 0 : undefined,
    })
  }

  const subtitle = isNew
    ? `New ${categoryLabel(category).toLowerCase()} item`
    : `${categoryLabel(category)} · last updated ${item ? formatUpdatedDate(item.updatedAt) : '—'}`

  return (
    <BottomSheet
      variant="light"
      title={isNew ? `Add ${categoryLabel(category).toLowerCase()}` : name || 'Edit item'}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <SheetFooter
          saveLabel={isNew ? 'Add item' : 'Save changes'}
          ready={name.trim().length > 0}
          layout="split"
          onSave={handleSave}
          onCancel={onClose}
          onDelete={!isNew ? onDelete : undefined}
        />
      }
    >
      <div ref={formRef} className="premium-sheet__form">
        <FloatingField id="inv-edit-name" label="Name" filled={name.trim().length > 0}>
          <input
            id="inv-edit-name"
            className={`f-input${name.trim() ? ' hv' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=" "
            autoFocus
          />
        </FloatingField>

        {hasStatus ? (
          <PillGroup label="Status" options={STATUS_PILLS} value={status} onChange={setStatus} />
        ) : null}

        {isWishlist ? (
          <FloatingAffixField
            id="inv-edit-price"
            label="Price"
            type="number"
            min={0}
            value={priceEstimate}
            filled={priceEstimate.trim().length > 0}
            onChange={(e) => setPriceEstimate(e.target.value)}
          />
        ) : null}

        <FloatingField id="inv-edit-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
          <textarea
            id="inv-edit-notes"
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
