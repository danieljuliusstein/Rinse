'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [date, setDate] = useState(todayIso())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BusinessExpenseCategory>('legal')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptMode, setReceiptMode] = useState(false)
  const [receiptLines, setReceiptLines] = useState<ExpenseLine[]>([
    { category: 'supplies', description: '', amount: 0 },
  ])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const { handleWriteError } = useActionToast()
  const confirm = useConfirm()

  const progress = computeFormProgress([date, name, amount, vendor, notes], 1, 1)

  useEffect(() => {
    if (!expense) {
      setDate(todayIso())
      setName('')
      setAmount('')
      setCategory('legal')
      setVendor('')
      setNotes('')
      return
    }
    setDate(expense.date)
    setName(expense.name)
    setAmount(String(expense.amount))
    setCategory(expense.category ?? 'other')
    setVendor(expense.vendor ?? '')
    setNotes(expense.notes ?? '')
  }, [expense])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [date, name, amount, vendor, notes, expense])

  const buildInput = (): BusinessExpenseInput | null => {
    const trimmed = name.trim()
    const parsed = Number(amount)
    if (!trimmed || !parsed || parsed <= 0) return null
    return {
      date,
      name: trimmed,
      amount: parsed,
      category,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
    }
  }

  const handleSave = async () => {
    const input = buildInput()
    if (!input) return
    setSaving(true)
    setError('')
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
      setError(err instanceof Error ? err.message : 'Could not save expense.')
    } finally {
      setSaving(false)
    }
  }

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
    setError('')
    try {
      await deleteBusinessExpense(expense.id)
      onSaved?.()
      onClose()
    } catch (err) {
      if (handleWriteError(err)) return
      setError(err instanceof Error ? err.message : 'Could not delete expense.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = Boolean(name.trim() && Number(amount) > 0)

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
      {error ? <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div> : null}

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
          onTotalChange={(total) => setAmount(total > 0 ? String(total) : '')}
        />
      ) : null}

      <div ref={formRef} className="premium-sheet__form">
        <div className="premium-sheet__grid2">
          <FloatingField id="expense-date" label="Date" filled={Boolean(date)}>
            <input
              id="expense-date"
              type="date"
              className={`f-input${date ? ' hv' : ''}`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingAffixField
            id="expense-amount"
            label="Amount"
            type="number"
            inputMode="decimal"
            value={amount}
            filled={amount.trim().length > 0}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <FloatingField id="expense-name" label="Name" filled={name.trim().length > 0}>
          <input
            id="expense-name"
            className={`f-input${name.trim() ? ' hv' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <PillGroup label="Category" options={CATEGORY_PILLS} value={category} onChange={setCategory} />

        <div className="f-form-divider" />

        <FloatingField id="expense-vendor" label="Vendor" filled={vendor.trim().length > 0} optional>
          <input
            id="expense-vendor"
            className={`f-input${vendor.trim() ? ' hv' : ''}`}
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="expense-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
          <textarea
            id="expense-notes"
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
