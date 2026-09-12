'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { CaretDown } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import {
  FloatingAffixField,
  FloatingField,
  FormProgressBar,
  PillGroup,
  SheetFooter,
} from '@/components/forms'
import { costPerUnitFromPurchase } from '@/lib/supplies-logic'
import { isSupplyPurchase } from '@/lib/supply-purchase-logic'
import {
  createSupplyPurchase,
  deleteSupplyPurchase,
  getSupplies,
  updateSupplyPurchase,
} from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import { computeFormProgress } from '@/lib/form-progress'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { supplyPurchaseSchema, type SupplyPurchaseFormValues } from '@/lib/validation'
import { useRinseForm } from '@/hooks/useRinseForm'
import { useActionToast } from '@/providers/ActionToastProvider'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { useConfirm } from '@/providers/ConfirmProvider'
import type { BusinessExpense, Supply, SupplyKind, SupplyPurchaseInput } from '@/lib/types'

const CHEMICAL_UNITS = ['oz', 'gal', 'ml', 'L'] as const
const CONSUMABLE_UNITS = ['each', 'box', 'pack'] as const
const NEW_SUPPLY = '__new__'

const KIND_PILLS: { value: SupplyKind; label: string }[] = [
  { value: 'chemical', label: 'Chemical' },
  { value: 'consumable', label: 'Consumable' },
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface SupplyPickerProps {
  catalog: Supply[]
  supplyKey: string
  onSelect: (key: string) => void
}

function SupplyPicker({ catalog, supplyKey, onSelect }: SupplyPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedSearch(search)

  const selected = catalog.find((s) => s.id === supplyKey)
  const isNew = supplyKey === NEW_SUPPLY

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((s) => s.name.toLowerCase().includes(q))
  }, [catalog, debouncedSearch])

  const displayLabel = isNew
    ? '+ Add new supply'
    : selected
      ? `${selected.name} (${selected.quantity_on_hand} ${selected.unit})`
      : 'Select…'

  const pick = (key: string) => {
    onSelect(key)
    setSearch('')
    setOpen(false)
  }

  if (supplyKey && !open) {
    return (
      <div className="inv-supply-picker">
        <button type="button" className="inv-supply-picker-trigger" onClick={() => setOpen(true)}>
          <span>{displayLabel}</span>
          <CaretDown size={14} className="inv-supply-picker-caret" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div className="inv-supply-picker">
      <input
        className="inv-supply-picker-search"
        placeholder="Search supplies…"
        value={search}
        autoFocus={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setSearch(e.target.value)}
      />
      {open ? (
        <div className="inv-supply-picker-dropdown">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`inv-supply-picker-option${supplyKey === s.id ? ' inv-supply-picker-option--active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s.id)}
            >
              <span className="inv-supply-picker-option-name">{s.name}</span>
              <span className="inv-supply-picker-option-meta">
                {s.quantity_on_hand} {s.unit} on hand
              </span>
            </button>
          ))}
          {filtered.length === 0 && search.trim() !== '' ? (
            <div className="inv-supply-picker-empty">No supplies match</div>
          ) : null}
          <button
            type="button"
            className="inv-supply-picker-option inv-supply-picker-option--new"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(NEW_SUPPLY)}
          >
            <span className="inv-supply-picker-option-name">+ Add new supply</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

interface SupplyPurchaseSheetProps {
  expense?: BusinessExpense | null
  onClose: () => void
  onSaved?: () => void
}

export default function SupplyPurchaseSheet({ expense, onClose, onSaved }: SupplyPurchaseSheetProps) {
  const isEdit = Boolean(expense)
  const formRef = useRef<HTMLDivElement>(null)
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [name, setName] = useState('')
  const [kind, setKind] = useState<SupplyKind>('chemical')
  const [unit, setUnit] = useState('oz')
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
  } = useRinseForm<SupplyPurchaseFormValues>({
    schema: supplyPurchaseSchema,
    defaultValues: {
      supply_id: '',
      date: todayIso(),
      quantity: 0,
      total_cost: 0,
      vendor: '',
      notes: '',
    },
  })

  const supplyKey = watch('supply_id')
  const date = watch('date')
  const quantity = watch('quantity')
  const totalCost = watch('total_cost')
  const vendor = watch('vendor')
  const notes = watch('notes')

  const isNewSupply = supplyKey === NEW_SUPPLY
  const unitOptions = kind === 'consumable' ? CONSUMABLE_UNITS : CHEMICAL_UNITS
  const unitPills = unitOptions.map((u) => ({ value: u, label: u }))

  const progress = computeFormProgress(
    [date, name, quantity > 0 ? String(quantity) : '', totalCost > 0 ? String(totalCost) : '', vendor ?? '', notes ?? ''],
    1,
    supplyKey ? 1 : 0,
  )

  useEffect(() => {
    getSupplies().then((list) => {
      setCatalog(list.filter((s) => s.kind === 'chemical' || s.kind === 'consumable'))
    })
  }, [])

  useEffect(() => {
    if (!expense) {
      reset({
        supply_id: '',
        date: todayIso(),
        quantity: 0,
        total_cost: 0,
        vendor: '',
        notes: '',
      })
      setName('')
      setKind('chemical')
      setUnit('oz')
      return
    }
    reset({
      supply_id: expense.supply_id ?? '',
      date: expense.date,
      quantity: expense.quantity ?? 0,
      total_cost: expense.amount,
      vendor: expense.vendor ?? '',
      notes: expense.notes ?? '',
    })
    setName(expense.name)
    const linked = catalog.find((s) => s.id === expense.supply_id)
    if (linked) {
      setKind(linked.kind ?? 'chemical')
      setUnit(linked.unit)
    }
  }, [expense, catalog, reset])

  useEffect(() => {
    if (isNewSupply || !supplyKey) return
    const selected = catalog.find((s) => s.id === supplyKey)
    if (selected) {
      setName(selected.name)
      setKind(selected.kind ?? 'chemical')
      setUnit(selected.unit)
    }
  }, [supplyKey, catalog, isNewSupply])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [date, name, quantity, totalCost, vendor, notes, unit, expense])

  const costPreview = useMemo(() => {
    if (!quantity || !totalCost) return 0
    return costPerUnitFromPurchase(quantity, totalCost)
  }, [quantity, totalCost])

  const buildInput = (values: SupplyPurchaseFormValues): SupplyPurchaseInput | null => {
    const trimmed = name.trim()
    if (!trimmed) return null

    if (isEdit && expense?.supply_id) {
      return {
        date: values.date,
        name: trimmed,
        amount: values.total_cost,
        quantity: values.quantity,
        vendor: values.vendor,
        notes: values.notes,
      }
    }

    if (isNewSupply) {
      return {
        date: values.date,
        name: trimmed,
        amount: values.total_cost,
        quantity: values.quantity,
        vendor: values.vendor,
        notes: values.notes,
        new_supply: {
          name: trimmed,
          unit: unit.trim() || 'oz',
          quantity_on_hand: values.quantity,
          kind,
          supplier: values.vendor,
          notes: values.notes,
        },
      }
    }

    if (!values.supply_id) return null
    return {
      date: values.date,
      name: trimmed,
      amount: values.total_cost,
      quantity: values.quantity,
      vendor: values.vendor,
      notes: values.notes,
      supply_id: values.supply_id,
    }
  }

  const handleSave = submitWithToast(async (values) => {
    const input = buildInput(values)
    if (!input) {
      setSubmitError('Fill in supply, quantity, and total cost.')
      return
    }
    setSaving(true)
    setSubmitError('')
    try {
      if (isEdit && expense) {
        await updateSupplyPurchase(expense.id, input)
      } else {
        await createSupplyPurchase(input)
      }
      setSaved(true)
      onSaved?.()
      setTimeout(onClose, 1500)
    } catch (err) {
      if (handleWriteError(err)) return
      setSubmitError(err instanceof Error ? err.message : 'Could not save purchase.')
    } finally {
      setSaving(false)
    }
  }, 'Fill in supply, quantity, and total cost.')

  const handleDelete = async () => {
    if (!expense) return
    const ok = await confirm({
      title: 'Delete purchase?',
      message: 'Delete this supply purchase? Inventory will be adjusted.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
    })
    if (!ok) return
    setSaving(true)
    setSubmitError('')
    try {
      await deleteSupplyPurchase(expense.id)
      onSaved?.()
      onClose()
    } catch (err) {
      if (handleWriteError(err)) return
      setSubmitError(err instanceof Error ? err.message : 'Could not delete purchase.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = Boolean(name.trim() && quantity > 0 && totalCost > 0)

  return (
    <BottomSheet
      variant="light"
      title={isEdit ? 'Edit supply purchase' : 'Buy supplies'}
      subtitle="Expense hits P&L this month and stock is added to inventory"
      ariaLabel="Buy supplies"
      onClose={onClose}
      footer={
        <SheetFooter
          saveLabel={isEdit ? 'Save changes' : 'Log purchase'}
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
      {!isEdit ? <FormProgressBar progress={progress} /> : null}

      <div ref={formRef} className="premium-sheet__form">
        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <FloatingField
              id="purchase-date"
              label="Date"
              filled={Boolean(field.value)}
              error={fieldState.error?.message}
            >
              <input
                id="purchase-date"
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

        {!isEdit ? (
          <div className="form-pill-block">
            <p className="form-pill-block__label">Supply</p>
            <SupplyPicker
              catalog={catalog}
              supplyKey={supplyKey}
              onSelect={(key) => setValue('supply_id', key)}
            />
          </div>
        ) : null}

        {(isNewSupply || isEdit) ? (
          <FloatingField id="purchase-name" label="Name" filled={name.trim().length > 0}>
            <input
              id="purchase-name"
              className={`f-input${name.trim() ? ' hv' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
              disabled={isEdit && expense ? isSupplyPurchase(expense) : false}
            />
          </FloatingField>
        ) : null}

        {isNewSupply && !isEdit ? (
          <>
            <PillGroup
              label="Kind"
              options={KIND_PILLS}
              value={kind}
              onChange={(k) => {
                setKind(k)
                setUnit(k === 'consumable' ? 'each' : 'oz')
              }}
            />
            <PillGroup label="Unit" options={unitPills} value={unit} onChange={setUnit} />
          </>
        ) : null}

        <div className="f-form-divider" />

        <div className="premium-sheet__grid2">
          <Controller
            control={control}
            name="quantity"
            render={({ field, fieldState }) => (
              <FloatingField
                id="purchase-qty"
                label="Quantity bought"
                filled={field.value > 0}
                error={fieldState.error?.message}
              >
                <input
                  id="purchase-qty"
                  type="number"
                  inputMode="decimal"
                  className={`f-input${field.value > 0 ? ' hv' : ''}`}
                  value={field.value > 0 ? field.value : ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  placeholder=" "
                  aria-invalid={fieldState.error ? true : undefined}
                />
              </FloatingField>
            )}
          />

          <div>
            <Controller
              control={control}
              name="total_cost"
              render={({ field, fieldState }) => (
                <FloatingAffixField
                  id="purchase-cost"
                  label="Total cost"
                  currency
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            {costPreview > 0 ? (
              <p className="inv-computed-cost">
                Cost: {fmtDetailed(costPreview)}/{unit || 'unit'}
              </p>
            ) : null}
          </div>
        </div>

        <div className="f-form-divider" />

        <Controller
          control={control}
          name="vendor"
          render={({ field, fieldState }) => (
            <FloatingField
              id="purchase-vendor"
              label="Vendor"
              filled={(field.value ?? '').trim().length > 0}
              error={fieldState.error?.message}
              optional
            >
              <input
                id="purchase-vendor"
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
              id="purchase-notes"
              label="Notes"
              filled={(field.value ?? '').trim().length > 0}
              error={fieldState.error?.message}
              optional
              textarea
            >
              <textarea
                id="purchase-notes"
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

        {submitError ? (
          <p className="form-field-hint form-field-hint--error" role="alert" aria-live="assertive">
            {submitError}
          </p>
        ) : null}
      </div>
    </BottomSheet>
  )
}
