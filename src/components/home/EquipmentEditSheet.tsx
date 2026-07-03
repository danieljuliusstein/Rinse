'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowSquareOut } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import AcquisitionToggle, { type AcquisitionMode } from '@/components/inventory/AcquisitionToggle'
import EquipmentStatusToggle from '@/components/inventory/EquipmentStatusToggle'
import InventoryImagePicker from '@/components/inventory/InventoryImagePicker'
import {
  FloatingAffixField,
  FloatingField,
  FormProgressBar,
  SheetFooter,
} from '@/components/forms'
import { clearEquipmentPhoto, uploadEquipmentPhoto } from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import { computeFormProgress } from '@/lib/form-progress'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import type { BusinessExpense, Equipment, EquipmentAddOptions, EquipmentInput, EquipmentStatus } from '@/lib/types'

export type EquipmentSheetMode = 'add' | 'edit'

interface EquipmentEditSheetProps {
  item: Equipment | null
  mode: EquipmentSheetMode
  linkedExpense?: BusinessExpense | null
  onViewExpense?: () => void
  onSaveAdd: (input: EquipmentInput, options?: EquipmentAddOptions) => Promise<Equipment>
  onSaveEdit: (id: string, input: Partial<EquipmentInput>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onClose: () => void
  onAfterSave?: () => Promise<void>
}

export default function EquipmentEditSheet({
  item,
  mode,
  linkedExpense,
  onViewExpense,
  onSaveAdd,
  onSaveEdit,
  onDelete,
  onClose,
  onAfterSave,
}: EquipmentEditSheetProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('active')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [clearPhoto, setClearPhoto] = useState(false)
  const [acquisition, setAcquisition] = useState<AcquisitionMode>('already_owned')
  const [saving, setSaving] = useState(false)

  const progress = computeFormProgress([name, purchasePrice, purchaseDate, supplier, notes], 1, 1)

  useEffect(() => {
    if (mode === 'add') {
      setName('')
      setPurchasePrice('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      setSupplier('')
      setNotes('')
      setStatus('active')
      setPhotoFile(null)
      setClearPhoto(false)
      setAcquisition('already_owned')
      return
    }
    if (!item) return
    setName(item.name)
    setPurchasePrice(item.purchase_price != null ? String(item.purchase_price) : '')
    setPurchaseDate(item.purchase_date ?? new Date().toISOString().slice(0, 10))
    setSupplier(item.supplier ?? '')
    setNotes(item.notes ?? '')
    setStatus(item.status ?? 'active')
    setPhotoFile(null)
    setClearPhoto(false)
  }, [item, mode])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [name, purchasePrice, purchaseDate, supplier, notes, item, mode])

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file)
    if (file) setClearPhoto(false)
  }

  const persistPhoto = async (id: string) => {
    if (clearPhoto) await clearEquipmentPhoto(id)
    else if (photoFile) await uploadEquipmentPhoto(id, photoFile)
  }

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const includeExpense = mode === 'add' && acquisition === 'bought_new'
      const payload: EquipmentInput = {
        name: trimmed,
        purchase_price: Number(purchasePrice) || undefined,
        purchase_date: purchaseDate || undefined,
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      }
      if (mode === 'add') {
        const options: EquipmentAddOptions = includeExpense
          ? { logExpense: true, purchaseDate }
          : { logExpense: false }
        const created = await onSaveAdd(payload, options)
        await persistPhoto(created.id)
      } else if (item) {
        await onSaveEdit(item.id, payload)
        await persistPhoto(item.id)
      }
      await onAfterSave?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      variant="light"
      title={mode === 'add' ? 'Add equipment' : item?.name ?? 'Edit equipment'}
      subtitle={mode === 'add' ? 'New durable tool or machine' : 'Update equipment details'}
      onClose={onClose}
      footer={
        <SheetFooter
          saveLabel={mode === 'add' ? 'Add equipment' : 'Save changes'}
          ready={name.trim().length > 0}
          saving={saving}
          layout="split"
          onSave={() => void handleSave()}
          onCancel={onClose}
          onDelete={mode === 'edit' && item && onDelete ? () => void onDelete(item.id) : undefined}
        />
      }
    >
      <div className="premium-sheet__section">
        <InventoryImagePicker
          previewUrl={clearPhoto ? null : (item?.image_url ?? null)}
          onChange={handlePhotoChange}
          onClearExisting={() => setClearPhoto(true)}
        />
      </div>

      {mode === 'edit' && linkedExpense && onViewExpense ? (
        <>
          <div className="f-form-divider" />
          <div className="premium-sheet__section">
            <div className="inv-expense-link-panel">
              <p className="inv-expense-link-panel__title">Logged in business expenses</p>
              <p className="inv-expense-link-panel__meta">
                {fmtDetailed(linkedExpense.amount)} · {linkedExpense.date}
                {linkedExpense.vendor ? ` · ${linkedExpense.vendor}` : ''}
              </p>
              <button type="button" className="inv-expense-link-panel__btn" onClick={onViewExpense}>
                <ArrowSquareOut size={14} weight="bold" aria-hidden />
                View expense
              </button>
            </div>
          </div>
        </>
      ) : null}

      <div className="f-form-divider" />

      {mode === 'add' ? <FormProgressBar progress={progress} /> : null}

      <div ref={formRef} className="premium-sheet__form">
        <FloatingField id="equipment-name" label="Name" filled={name.trim().length > 0}>
          <input
            id="equipment-name"
            className={`f-input${name.trim() ? ' hv' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        {mode === 'add' ? <AcquisitionToggle value={acquisition} onChange={setAcquisition} /> : null}

        <div className="premium-sheet__grid2">
          <FloatingAffixField
            id="equipment-price"
            label="Purchase price"
            type="number"
            min={0}
            step="0.01"
            value={purchasePrice}
            filled={purchasePrice.trim().length > 0}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
          <FloatingField id="equipment-date" label="Purchase date" filled={Boolean(purchaseDate)} optional>
            <input
              id="equipment-date"
              type="date"
              className={`f-input${purchaseDate ? ' hv' : ''}`}
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              placeholder=" "
            />
          </FloatingField>
        </div>

        <FloatingField id="equipment-supplier" label="Supplier" filled={supplier.trim().length > 0} optional>
          <input
            id="equipment-supplier"
            className={`f-input${supplier.trim() ? ' hv' : ''}`}
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <div className="f-form-divider" />

        <EquipmentStatusToggle value={status} onChange={setStatus} />

        <FloatingField id="equipment-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
          <textarea
            id="equipment-notes"
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
