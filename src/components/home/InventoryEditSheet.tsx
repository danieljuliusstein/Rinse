'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import BottomSheet from '@/components/BottomSheet'
import { FloatingAffixField, FloatingField, PillGroup, SheetFooter } from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import {
  categoryLabel,
  formatUpdatedDate,
  type HomeInventoryItem,
  type InventoryCategory,
  type InventoryStatus,
} from '@/lib/home-inventory'
import { inventoryEditFormSchema, type InventoryEditFormValues } from '@/lib/validation'

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
  const [status, setStatus] = useState<InventoryStatus>('ok')

  const hasStatus = category === 'chemicals' || category === 'supplies'
  const isWishlist = category === 'wishlist'

  const { control, watch, reset, submitWithToast } = useRinseForm<InventoryEditFormValues>({
    schema: inventoryEditFormSchema,
    defaultValues: {
      name: '',
      price_estimate: 0,
      notes: '',
    },
  })

  const name = watch('name')
  const priceEstimate = watch('price_estimate')
  const notes = watch('notes')

  useEffect(() => {
    if (!item && !isNew) return
    reset({
      name: item?.name ?? '',
      price_estimate: item?.priceEstimate ?? 0,
      notes: item?.notes ?? '',
    })
    setStatus(item?.status ?? 'ok')
  }, [item, isNew, reset])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [name, notes, priceEstimate, item, isNew])

  if (!item && !isNew) return null

  const handleSave = submitWithToast((values) => {
    onSave({
      name: values.name,
      status: hasStatus ? status : undefined,
      notes: values.notes ?? '',
      priceEstimate: isWishlist ? values.price_estimate ?? 0 : undefined,
    })
  })

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
          onSave={() => void handleSave()}
          onCancel={onClose}
          onDelete={!isNew ? onDelete : undefined}
        />
      }
    >
      <div ref={formRef} className="premium-sheet__form">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <FloatingField
              id="inv-edit-name"
              label="Name"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="inv-edit-name"
                className={`f-input${field.value.trim() ? ' hv' : ''}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                autoFocus
              />
            </FloatingField>
          )}
        />

        {hasStatus ? (
          <PillGroup label="Status" options={STATUS_PILLS} value={status} onChange={setStatus} />
        ) : null}

        {isWishlist ? (
          <Controller
            control={control}
            name="price_estimate"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="inv-edit-price"
                label="Price"
                currency
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <FloatingField
              id="inv-edit-notes"
              label="Notes"
              filled={(field.value ?? '').trim().length > 0}
              optional
              textarea
              error={fieldState.error?.message}
            >
              <textarea
                id="inv-edit-notes"
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
