'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { useActionToast } from '@/providers/ActionToastProvider'
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

  const selected = catalog.find((s) => s.id === supplyKey)
  const isNew = supplyKey === NEW_SUPPLY

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((s) => s.name.toLowerCase().includes(q))
  }, [catalog, search])

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
          <CaretDown size={14} color="#8e8e93" />
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
            <div style={{ padding: '12px 14px', fontSize: 13, color: '#8e8e93' }}>No supplies match</div>
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
  const unitRef = useRef<HTMLSelectElement>(null)
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [date, setDate] = useState(todayIso())
  const [supplyKey, setSupplyKey] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<SupplyKind>('chemical')
  const [unit, setUnit] = useState('oz')
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const { handleWriteError } = useActionToast()
  const confirm = useConfirm()

  const isNewSupply = supplyKey === NEW_SUPPLY
  const unitOptions = kind === 'consumable' ? CONSUMABLE_UNITS : CHEMICAL_UNITS
  const unitPills = unitOptions.map((u) => ({ value: u, label: u }))

  const progress = computeFormProgress(
    [date, name, quantity, amount, vendor, notes],
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
      setDate(todayIso())
      setSupplyKey('')
      setName('')
      setKind('chemical')
      setUnit('oz')
      setQuantity('')
      setAmount('')
      setVendor('')
      setNotes('')
      return
    }
    setDate(expense.date)
    setSupplyKey(expense.supply_id ?? '')
    setName(expense.name)
    setQuantity(expense.quantity != null ? String(expense.quantity) : '')
    setAmount(String(expense.amount))
    setVendor(expense.vendor ?? '')
    setNotes(expense.notes ?? '')
    const linked = catalog.find((s) => s.id === expense.supply_id)
    if (linked) {
      setKind(linked.kind ?? 'chemical')
      setUnit(linked.unit)
    }
  }, [expense, catalog])

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
    syncSelectFloatingLabel(unitRef.current)
  }, [date, name, quantity, amount, vendor, notes, unit, expense])

  const costPreview = useMemo(() => {
    const q = Number(quantity)
    const a = Number(amount)
    if (!q || !a) return 0
    return costPerUnitFromPurchase(q, a)
  }, [quantity, amount])

  const buildInput = (): SupplyPurchaseInput | null => {
    const trimmed = name.trim()
    const qty = Number(quantity)
    const total = Number(amount)
    if (!trimmed || !qty || qty <= 0 || !total || total <= 0) return null

    if (isEdit && expense?.supply_id) {
      return {
        date,
        name: trimmed,
        amount: total,
        quantity: qty,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
      }
    }

    if (isNewSupply) {
      return {
        date,
        name: trimmed,
        amount: total,
        quantity: qty,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
        new_supply: {
          name: trimmed,
          unit: unit.trim() || 'oz',
          quantity_on_hand: qty,
          kind,
          supplier: vendor.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      }
    }

    if (!supplyKey) return null
    return {
      date,
      name: trimmed,
      amount: total,
      quantity: qty,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
      supply_id: supplyKey,
    }
  }

  const handleSave = async () => {
    const input = buildInput()
    if (!input) {
      setError('Fill in supply, quantity, and total cost.')
      return
    }
    setSaving(true)
    setError('')
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
      setError(err instanceof Error ? err.message : 'Could not save purchase.')
    } finally {
      setSaving(false)
    }
  }

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
    setError('')
    try {
      await deleteSupplyPurchase(expense.id)
      onSaved?.()
      onClose()
    } catch (err) {
      if (handleWriteError(err)) return
      setError(err instanceof Error ? err.message : 'Could not delete purchase.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = Boolean(name.trim() && Number(quantity) > 0 && Number(amount) > 0)

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
        <FloatingField id="purchase-date" label="Date" filled={Boolean(date)}>
          <input
            id="purchase-date"
            type="date"
            className={`f-input${date ? ' hv' : ''}`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        {!isEdit ? (
          <div className="form-pill-block">
            <p className="form-pill-block__label">Supply</p>
            <SupplyPicker catalog={catalog} supplyKey={supplyKey} onSelect={setSupplyKey} />
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
          <FloatingField id="purchase-qty" label="Quantity bought" filled={quantity.trim().length > 0}>
            <input
              id="purchase-qty"
              type="number"
              inputMode="decimal"
              className={`f-input${quantity.trim() ? ' hv' : ''}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <div>
            <FloatingAffixField
              id="purchase-cost"
              label="Total cost"
              type="number"
              inputMode="decimal"
              value={amount}
              filled={amount.trim().length > 0}
              onChange={(e) => setAmount(e.target.value)}
            />
            {costPreview > 0 ? (
              <p className="inv-computed-cost">
                Cost: {fmtDetailed(costPreview)}/{unit || 'unit'}
              </p>
            ) : null}
          </div>
        </div>

        <div className="f-form-divider" />

        <FloatingField id="purchase-vendor" label="Vendor" filled={vendor.trim().length > 0} optional>
          <input
            id="purchase-vendor"
            className={`f-input${vendor.trim() ? ' hv' : ''}`}
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="purchase-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
          <textarea
            id="purchase-notes"
            className={`f-textarea${notes.trim() ? ' hv' : ''}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder=" "
            rows={3}
          />
        </FloatingField>

        {error ? <p className="form-field-hint form-field-hint--error">{error}</p> : null}
      </div>
    </BottomSheet>
  )
}
