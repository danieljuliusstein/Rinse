'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { ArrowSquareOut } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import AcquisitionToggle, { type AcquisitionMode } from '@/components/inventory/AcquisitionToggle'
import EquipmentStatusToggle from '@/components/inventory/EquipmentStatusToggle'
import InventoryIconPicker from '@/components/inventory/InventoryIconPicker'
import {
  FloatingAffixField,
  FloatingField,
  FormProgressBar,
  SheetFooter,
} from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { fmtDetailed } from '@/lib/calculations'
import { computeFormProgress } from '@/lib/form-progress'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { equipmentFormSchema, type EquipmentFormValues } from '@/lib/validation'
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
  const [iconKey, setIconKey] = useState<string | undefined>(undefined)
  const [acquisition, setAcquisition] = useState<AcquisitionMode>('already_owned')
  const [saving, setSaving] = useState(false)

  const { control, watch, reset, submitWithToast, setValue } = useRinseForm<EquipmentFormValues>({
    schema: equipmentFormSchema,
    defaultValues: {
      name: '',
      purchase_price: 0,
      purchase_date: new Date().toISOString().slice(0, 10),
      supplier: '',
      notes: '',
      status: 'active',
    },
  })

  const name = watch('name')
  const purchasePrice = watch('purchase_price')
  const purchaseDate = watch('purchase_date')
  const supplier = watch('supplier')
  const notes = watch('notes')
  const status = watch('status')

  const progress = computeFormProgress([name, purchasePrice > 0 ? String(purchasePrice) : '', purchaseDate ?? '', supplier ?? '', notes ?? ''], 1, 1)

  useEffect(() => {
    if (mode === 'add') {
      reset({
        name: '',
        purchase_price: 0,
        purchase_date: new Date().toISOString().slice(0, 10),
        supplier: '',
        notes: '',
        status: 'active',
      })
      setIconKey(undefined)
      setAcquisition('already_owned')
      return
    }
    if (!item) return
    reset({
      name: item.name,
      purchase_price: item.purchase_price ?? 0,
      purchase_date: item.purchase_date ?? new Date().toISOString().slice(0, 10),
      supplier: item.supplier ?? '',
      notes: item.notes ?? '',
      status: item.status ?? 'active',
    })
    setIconKey(item.icon_key || undefined)
  }, [item, mode, reset])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [name, purchasePrice, purchaseDate, supplier, notes, item, mode])

  const handleSave = submitWithToast(async (values) => {
    setSaving(true)
    try {
      const includeExpense = mode === 'add' && acquisition === 'bought_new'
      const payload: EquipmentInput = {
        name: values.name,
        purchase_price: values.purchase_price || undefined,
        purchase_date: values.purchase_date || undefined,
        supplier: values.supplier?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        status: values.status,
        icon_key: iconKey ?? '',
      }
      if (mode === 'add') {
        const options: EquipmentAddOptions = includeExpense
          ? { logExpense: true, purchaseDate: values.purchase_date || undefined }
          : { logExpense: false }
        await onSaveAdd(payload, options)
      } else if (item) {
        await onSaveEdit(item.id, payload)
      }
      await onAfterSave?.()
      onClose()
    } finally {
      setSaving(false)
    }
  })

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
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <FloatingField
              id="equipment-name"
              label="Name"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="equipment-name"
                className={`f-input${field.value.trim() ? ' hv' : ''}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
              />
            </FloatingField>
          )}
        />

        <InventoryIconPicker variant="equipment" value={iconKey} onChange={setIconKey} />

        {mode === 'add' ? <AcquisitionToggle value={acquisition} onChange={setAcquisition} /> : null}

        <div className="premium-sheet__grid2">
          <Controller
            control={control}
            name="purchase_price"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="equipment-price"
                label="Purchase price"
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
            name="purchase_date"
            render={({ field, fieldState }) => (
              <FloatingField
                id="equipment-date"
                label="Purchase date"
                filled={Boolean(field.value)}
                optional
                error={fieldState.error?.message}
              >
                <input
                  id="equipment-date"
                  type="date"
                  className={`f-input${field.value ? ' hv' : ''}`}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder=" "
                />
              </FloatingField>
            )}
          />
        </div>

        <Controller
          control={control}
          name="supplier"
          render={({ field, fieldState }) => (
            <FloatingField
              id="equipment-supplier"
              label="Supplier"
              filled={(field.value ?? '').trim().length > 0}
              optional
              error={fieldState.error?.message}
            >
              <input
                id="equipment-supplier"
                className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
              />
            </FloatingField>
          )}
        />

        <div className="f-form-divider" />

        <EquipmentStatusToggle value={status} onChange={(next: EquipmentStatus) => setValue('status', next)} />

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <FloatingField
              id="equipment-notes"
              label="Notes"
              filled={(field.value ?? '').trim().length > 0}
              optional
              textarea
              error={fieldState.error?.message}
            >
              <textarea
                id="equipment-notes"
                className={`f-textarea${(field.value ?? '').trim() ? ' hv' : ''}`}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                rows={3}
              />
            </FloatingField>
          )}
        />
      </div>
    </BottomSheet>
  )
}
