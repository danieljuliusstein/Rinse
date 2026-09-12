'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { ArrowSquareOut } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import {
  FloatingAffixField,
  FloatingField,
  FormProgressBar,
  PillGroup,
  SheetFooter,
} from '@/components/forms'
import ReceiptLineItemsEditor from '@/components/business/ReceiptLineItemsEditor'
import {
  createBusinessExpense,
  deleteBusinessExpense,
  updateBusinessExpense,
} from '@/lib/api'
import { computeFormProgress } from '@/lib/form-progress'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { businessExpenseSchema, type BusinessExpenseFormValues } from '@/lib/validation'
import { useRinseForm } from '@/hooks/useRinseForm'
import { useActionToast } from '@/providers/ActionToastProvider'
import { useConfirm } from '@/providers/ConfirmProvider'
import type { BusinessExpense, BusinessExpenseCategory, BusinessExpenseInput, ExpenseLine } from '@/lib/types'

const CATEGORY_PILLS: { value: BusinessExpenseCategory; label: string }[] = [
  { value: 'legal', label: 'Legal' },
  { value: 'licensing', label: 'Licensing' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'software', label: 'Software' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface BusinessExpenseSheetProps {
  expense?: BusinessExpense | null
  linkedEquipmentName?: string
  onViewEquipment?: () => void
  onClose: () => void
  onSaved?: () => void
}

export default function BusinessExpenseSheet({
  expense,
  linkedEquipmentName,
  onViewEquipment,
  onClose,
  onSaved,
}: BusinessExpenseSheetProps) {
  const isEdit = Boolean(expense)
  const formRef = useRef<HTMLDivElement>(null)
  const [receiptMode, setReceiptMode] = useState(false)
  const [receiptLines, setReceiptLines] = useState<ExpenseLine[]>([
    { category: 'supplies', description: '', amount: 0 },
  ])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { handleWriteError } = useActionToast()
  const confirm = useConfirm()

  const {
    control,
    watch,
    setValue,
    reset,
    submitWithToast,
  } = useRinseForm<BusinessExpenseFormValues>({
    schema: businessExpenseSchema,
    defaultValues: {
      date: todayIso(),
      name: '',
      amount: 0,
      category: 'legal',
      vendor: '',
      notes: '',
    },
  })

  const date = watch('date')
  const name = watch('name')
  const amount = watch('amount')
  const category = watch('category')
  const vendor = watch('vendor')
  const notes = watch('notes')

  const progress = computeFormProgress(
    [date, name, amount > 0 ? String(amount) : '', vendor ?? '', notes ?? ''],
    1,
    1,
  )

  useEffect(() => {
    if (!expense) {
      reset({
        date: todayIso(),
        name: '',
        amount: 0,
        category: 'legal',
        vendor: '',
        notes: '',
      })
      return
    }
    reset({
      date: expense.date,
      name: expense.name,
      amount: expense.amount,
      category: expense.category ?? 'other',
      vendor: expense.vendor ?? '',
      notes: expense.notes ?? '',
    })
  }, [expense, reset])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [date, name, amount, vendor, notes, expense])

  const handleSave = submitWithToast(async (values) => {
    const input: BusinessExpenseInput = {
      date: values.date,
      name: values.name,
      amount: values.amount,
      category: values.category as BusinessExpenseCategory,
      vendor: values.vendor,
      notes: values.notes,
    }
    setSaving(true)
    setSubmitError('')
    try {
      if (isEdit && expense) {
        await updateBusinessExpense(expense.id, input)
      } else {
        await createBusinessExpense(input)
      }
      setSaved(true)
      onSaved?.()
      setTimeout(onClose, 1500)
    } catch (err) {
      if (handleWriteError(err)) return
      setSubmitError(err instanceof Error ? err.message : 'Could not save expense.')
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!expense) return
    const ok = await confirm({
      title: 'Delete expense?',
      message: 'Delete this business expense?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
    })
    if (!ok) return
    setSaving(true)
    setSubmitError('')
    try {
      await deleteBusinessExpense(expense.id)
      onSaved?.()
      onClose()
    } catch (err) {
      if (handleWriteError(err)) return
      setSubmitError(err instanceof Error ? err.message : 'Could not delete expense.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = Boolean(name.trim() && amount > 0)

  return (
    <BottomSheet
      variant="light"
      title={isEdit ? 'Edit expense' : 'Log business expense'}
      subtitle="Dated one-time payment — shows in P&L for that month only"
      ariaLabel="Business expense"
      onClose={onClose}
      footer={
        <SheetFooter
          saveLabel={isEdit ? 'Save changes' : 'Log expense'}
          ready={canSave}
          done={saved}
          saving={saving}
          layout="split"
          onSave={() => void handleSave()}
          onCancel={onClose}
          onDelete={isEdit ? () => void handleDelete() : undefined}
        />
      }
    >
      {submitError ? (
        <div className="error-banner" role="alert" aria-live="assertive" style={{ marginBottom: 12 }}>
          {submitError}
        </div>
      ) : null}

      {isEdit && expense?.equipment_id && linkedEquipmentName && onViewEquipment ? (
        <div className="premium-sheet__section">
          <div className="inv-expense-link-panel">
            <p className="inv-expense-link-panel__title">Linked inventory item</p>
            <p className="inv-expense-link-panel__meta">{linkedEquipmentName}</p>
            <button type="button" className="inv-expense-link-panel__btn" onClick={onViewEquipment}>
              <ArrowSquareOut size={14} weight="bold" aria-hidden />
              View in inventory
            </button>
          </div>
        </div>
      ) : null}

      {!isEdit ? <FormProgressBar progress={progress} /> : null}

      {!isEdit ? (
        <button
          type="button"
          className={`chip${receiptMode ? ' active' : ''}`}
          onClick={() => setReceiptMode((v) => !v)}
        >
          {receiptMode ? 'Receipt scan on' : 'Scan receipt (line items)'}
        </button>
      ) : null}

      {!isEdit && receiptMode ? (
        <ReceiptLineItemsEditor
          lines={receiptLines}
          onChange={setReceiptLines}
          onTotalChange={(total) => setValue('amount', total > 0 ? total : 0)}
        />
      ) : null}

      <div ref={formRef} className="premium-sheet__form">
        <div className="premium-sheet__grid2">
          <Controller
            control={control}
            name="date"
            render={({ field, fieldState }) => (
              <FloatingField
                id="expense-date"
                label="Date"
                filled={Boolean(field.value)}
                error={fieldState.error?.message}
              >
                <input
                  id="expense-date"
                  type="date"
                  className={`f-input${field.value ? ' hv' : ''}`}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder=" "
                  aria-invalid={fieldState.error ? true : undefined}
                />
              </FloatingField>
            )}
          />

          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <FloatingAffixField
                id="expense-amount"
                label="Amount"
                currency
                value={field.value}
                onValueChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <FloatingField
              id="expense-name"
              label="Name"
              filled={field.value.trim().length > 0}
              error={fieldState.error?.message}
            >
              <input
                id="expense-name"
                className={`f-input${field.value.trim() ? ' hv' : ''}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                aria-invalid={fieldState.error ? true : undefined}
              />
            </FloatingField>
          )}
        />

        <PillGroup
          label="Category"
          options={CATEGORY_PILLS}
          value={category as BusinessExpenseCategory}
          onChange={(v) => setValue('category', v)}
        />

        <div className="f-form-divider" />

        <Controller
          control={control}
          name="vendor"
          render={({ field, fieldState }) => (
            <FloatingField
              id="expense-vendor"
              label="Vendor"
              filled={(field.value ?? '').trim().length > 0}
              error={fieldState.error?.message}
              optional
            >
              <input
                id="expense-vendor"
                className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
              />
            </FloatingField>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <FloatingField
              id="expense-notes"
              label="Notes"
              filled={(field.value ?? '').trim().length > 0}
              error={fieldState.error?.message}
              optional
              textarea
            >
              <textarea
                id="expense-notes"
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
