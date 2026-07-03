'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Warning } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import AcquisitionToggle, { type AcquisitionMode } from '@/components/inventory/AcquisitionToggle'
import InventoryImagePicker from '@/components/inventory/InventoryImagePicker'
import {
  FloatingAffixField,
  FloatingField,
  FormProgressBar,
  PillGroup,
  SheetFooter,
} from '@/components/forms'
import { clearSupplyPhoto, uploadSupplyPhoto } from '@/lib/api'
import { costPerUnitFromPurchase } from '@/lib/supplies-logic'
import { fmtDetailed } from '@/lib/calculations'
import { computeFormProgress } from '@/lib/form-progress'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import type { Supply, SupplyAddOptions, SupplyInput, SupplyKind } from '@/lib/types'

export type SupplySheetMode = 'add' | 'edit' | 'restock'

const CHEMICAL_UNITS = ['oz', 'gal', 'ml', 'L'] as const
const CONSUMABLE_UNITS = ['each', 'box', 'pack'] as const

interface SupplyEditSheetProps {
  supply: Supply | null
  kind: SupplyKind
  mode: SupplySheetMode
  onSaveAdd: (input: SupplyInput, options?: SupplyAddOptions) => Promise<Supply>
  onSaveEdit: (id: string, input: Partial<SupplyInput>) => Promise<void>
  onRestock: (id: string, quantity: number, totalCost: number) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onClose: () => void
  onAfterSave?: () => Promise<void>
  onModeChange?: (mode: SupplySheetMode) => void
}

function unitOptions(kind: SupplyKind): readonly string[] {
  return kind === 'consumable' ? CONSUMABLE_UNITS : CHEMICAL_UNITS
}

export default function SupplyEditSheet({
  supply,
  kind,
  mode,
  onSaveAdd,
  onSaveEdit,
  onRestock,
  onDelete,
  onClose,
  onAfterSave,
  onModeChange,
}: SupplyEditSheetProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const unitRef = useRef<HTMLSelectElement>(null)
  const defaultUnit = kind === 'consumable' ? 'each' : 'oz'
  const [name, setName] = useState('')
  const [unit, setUnit] = useState(defaultUnit)
  const [onHand, setOnHand] = useState('')
  const [qty, setQty] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [reorderAt, setReorderAt] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [clearPhoto, setClearPhoto] = useState(false)
  const [acquisition, setAcquisition] = useState<AcquisitionMode>('bought_new')
  const [costPerUnitManual, setCostPerUnitManual] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [restockQty, setRestockQty] = useState('')
  const [restockCost, setRestockCost] = useState('')
  const [saving, setSaving] = useState(false)

  const activeUnit = unit.trim() || defaultUnit
  const baseUnits = unitOptions(kind)
  const units =
    supply && !baseUnits.includes(supply.unit as (typeof baseUnits)[number])
      ? [...baseUnits, supply.unit]
      : baseUnits

  useEffect(() => {
    if (mode === 'add') {
      setName('')
      setUnit(defaultUnit)
      setOnHand('')
      setQty('')
      setTotalCost('')
      setReorderAt('')
      setSupplier('')
      setNotes('')
      setPhotoFile(null)
      setClearPhoto(false)
      setAcquisition('bought_new')
      setCostPerUnitManual('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      return
    }
    if (!supply) return
    const opts = unitOptions(kind)
    setName(supply.name)
    setUnit(opts.includes(supply.unit as (typeof opts)[number]) ? supply.unit : defaultUnit)
    setOnHand(String(supply.quantity_on_hand))
    setReorderAt(supply.reorder_threshold != null ? String(supply.reorder_threshold) : '')
    setSupplier(supply.supplier ?? '')
    setNotes(supply.notes ?? '')
    setPhotoFile(null)
    setClearPhoto(false)
    setRestockQty('')
    setRestockCost('')
  }, [supply, mode, kind, defaultUnit])

  const progress = computeFormProgress(
    [name, onHand, qty, totalCost, reorderAt, supplier, notes, restockQty, restockCost],
    1,
    1,
  )

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(unitRef.current)
  }, [
    name,
    unit,
    onHand,
    qty,
    totalCost,
    reorderAt,
    supplier,
    notes,
    restockQty,
    restockCost,
    costPerUnitManual,
    purchaseDate,
    supply,
    mode,
  ])

  const computedCostPerUnit = useMemo(() => {
    const q = Number(qty)
    const c = Number(totalCost)
    if (mode !== 'add' || acquisition !== 'bought_new' || !q || !c) return 0
    return costPerUnitFromPurchase(q, c)
  }, [mode, qty, totalCost, acquisition])

  const restockCostPerUnit = useMemo(() => {
    const q = Number(restockQty)
    const c = Number(restockCost)
    if (mode !== 'restock' || !q || !c) return 0
    return costPerUnitFromPurchase(q, c)
  }, [mode, restockQty, restockCost])

  const title =
    mode === 'add'
      ? `Add ${kind === 'chemical' ? 'chemical' : 'supply'}`
      : mode === 'restock'
        ? `Restock ${supply?.name ?? ''}`
        : supply?.name ?? 'Edit item'

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file)
    if (file) setClearPhoto(false)
  }

  const persistPhoto = async (id: string) => {
    if (clearPhoto) await clearSupplyPhoto(id)
    else if (photoFile) await uploadSupplyPhoto(id, photoFile)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (mode === 'add') {
        const trimmed = name.trim()
        const quantity = Number(qty)
        if (!trimmed || !quantity) return
        const input: SupplyInput = {
          name: trimmed,
          unit: activeUnit,
          quantity_on_hand: quantity,
          reorder_threshold: Number(reorderAt) || undefined,
          cost_per_unit:
            acquisition === 'bought_new'
              ? computedCostPerUnit || undefined
              : Number(costPerUnitManual) || undefined,
          supplier: supplier.trim() || undefined,
          kind,
          notes: notes.trim() || undefined,
        }
        const includeExpense = acquisition === 'bought_new'
        const options: SupplyAddOptions = includeExpense
          ? {
              logExpense: true,
              totalPaid: Number(totalCost) || undefined,
              purchaseDate,
            }
          : { logExpense: false }
        const created = await onSaveAdd(input, options)
        await persistPhoto(created.id)
      } else if (mode === 'edit' && supply) {
        const quantity = Number(onHand)
        if (!Number.isFinite(quantity) || quantity < 0) return
        await onSaveEdit(supply.id, {
          name: name.trim(),
          unit: activeUnit,
          quantity_on_hand: quantity,
          reorder_threshold: Number(reorderAt) || undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
        })
        await persistPhoto(supply.id)
      } else if (mode === 'restock' && supply) {
        const quantity = Number(restockQty)
        const cost = Number(restockCost)
        if (!quantity || quantity <= 0) return
        await onRestock(supply.id, quantity, cost > 0 ? cost : 0)
      }
      await onAfterSave?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const subtitle =
    mode === 'add'
      ? 'How you measure it, how much you have, and when to reorder'
      : mode === 'edit'
        ? 'Update stock counts and alert levels — use Restock after a purchase'
        : 'Log a purchase to add stock and update cost per unit'

  return (
    <BottomSheet
      variant="light"
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <SheetFooter
          saveLabel={
            mode === 'add' ? 'Add to catalog' : mode === 'restock' ? 'Restock' : 'Save changes'
          }
          ready={
            mode === 'add'
              ? name.trim().length > 0 && Number(qty) > 0
              : mode === 'restock'
                ? Number(restockQty) > 0
                : name.trim().length > 0
          }
          saving={saving}
          layout="split"
          onSave={() => void handleSave()}
          onCancel={onClose}
          onDelete={mode === 'edit' && supply && onDelete ? () => void onDelete(supply.id) : undefined}
        />
      }
    >
        {mode !== 'restock' && (
          <div className="inv-sheet-section">
            <InventoryImagePicker
              previewUrl={clearPhoto ? null : (supply?.image_url ?? null)}
              onChange={handlePhotoChange}
              onClearExisting={() => setClearPhoto(true)}
            />
          </div>
        )}

        {supply && mode !== 'add' && onModeChange && (
          <div className="inv-sheet-section">
            <PillGroup
              label="Supply sheet"
              options={[
                { value: 'edit', label: 'Details' },
                { value: 'restock', label: 'Restock' },
              ]}
              value={mode === 'restock' ? 'restock' : 'edit'}
              onChange={(value) => onModeChange(value === 'restock' ? 'restock' : 'edit')}
            />
          </div>
        )}

        {mode === 'edit' && supply && (
          <>
            <div className="inv-sheet-divider" />
            <div className="inv-sheet-section">
              <div className="item-detail-panel">
                <p className="item-detail-panel__title">Current stock</p>
                <div className="item-detail-row">
                  <span className="item-detail-row__label">On hand</span>
                  <span>{supply.quantity_on_hand} {supply.unit}</span>
                </div>
                {supply.cost_per_unit != null && supply.cost_per_unit > 0 && (
                  <div className="item-detail-row">
                    <span className="item-detail-row__label">Cost / {supply.unit}</span>
                    <span>{fmtDetailed(supply.cost_per_unit)}</span>
                  </div>
                )}
                {supply.reorder_threshold != null && (
                  <div className="item-detail-row">
                    <span className="item-detail-row__label">Reorder at</span>
                    <span>{supply.reorder_threshold} {supply.unit}</span>
                  </div>
                )}
                {supply.supplier && (
                  <div className="item-detail-row">
                    <span className="item-detail-row__label">Supplier</span>
                    <span>{supply.supplier}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {mode !== 'restock' && (
          <>
            <div className="f-form-divider" />
            {mode === 'add' ? <FormProgressBar progress={progress} /> : null}
            <div ref={formRef} className="premium-sheet__form">
              <FloatingField id="supply-name" label="Name" filled={name.trim().length > 0}>
                <input
                  id="supply-name"
                  className={`f-input${name.trim() ? ' hv' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=" "
                />
              </FloatingField>

              <PillGroup
                label={`Measure in (${activeUnit})`}
                options={units.map((u) => ({ value: u, label: u }))}
                value={activeUnit}
                onChange={setUnit}
              />
              <p className="form-field-hint">All amounts below use this unit ({activeUnit})</p>
            </div>
          </>
        )}

        {mode === 'edit' && (
          <div className="premium-sheet__form">
            <FloatingField id="supply-on-hand" label={`Quantity on hand (${activeUnit})`} filled={onHand.trim().length > 0}>
              <input
                id="supply-on-hand"
                className={`f-input${onHand.trim() ? ' hv' : ''}`}
                type="number"
                min={0}
                step={activeUnit === 'each' ? 1 : 0.5}
                value={onHand}
                onChange={(e) => setOnHand(e.target.value)}
                placeholder=" "
              />
            </FloatingField>
          </div>
        )}

        {mode === 'add' && (
          <>
            <div className="f-form-divider" />
            <div className="premium-sheet__form">
              <AcquisitionToggle value={acquisition} onChange={setAcquisition} />

              <FloatingField id="supply-qty" label={`Starting amount (${activeUnit})`} filled={qty.trim().length > 0}>
                <input
                  id="supply-qty"
                  className={`f-input${qty.trim() ? ' hv' : ''}`}
                  type="number"
                  min={0}
                  step={activeUnit === 'each' ? 1 : 0.5}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder=" "
                />
              </FloatingField>

              {acquisition === 'bought_new' ? (
                <>
                  <FloatingAffixField
                    id="supply-paid"
                    label="Amount paid"
                    type="number"
                    min={0}
                    step="0.01"
                    value={totalCost}
                    filled={totalCost.trim().length > 0}
                    onChange={(e) => setTotalCost(e.target.value)}
                  />

                  <div className="premium-sheet__grid2">
                    <FloatingField id="supply-vendor" label="Vendor" filled={supplier.trim().length > 0} optional>
                      <input
                        id="supply-vendor"
                        className={`f-input${supplier.trim() ? ' hv' : ''}`}
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        placeholder=" "
                      />
                    </FloatingField>
                    <FloatingField id="supply-date" label="Purchase date" filled={Boolean(purchaseDate)}>
                      <input
                        id="supply-date"
                        type="date"
                        className={`f-input${purchaseDate ? ' hv' : ''}`}
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        placeholder=" "
                      />
                    </FloatingField>
                  </div>

                  {computedCostPerUnit > 0 ? (
                    <p className="inv-computed-cost">
                      Cost per {activeUnit}: {fmtDetailed(computedCostPerUnit)}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <FloatingAffixField
                    id="supply-cpu"
                    label={`Cost per ${activeUnit}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={costPerUnitManual}
                    filled={costPerUnitManual.trim().length > 0}
                    onChange={(e) => setCostPerUnitManual(e.target.value)}
                  />
                  <p className="form-field-hint">For job costing only — not logged as expense</p>

                  <FloatingField id="supply-supplier-no-exp" label="Supplier" filled={supplier.trim().length > 0} optional>
                    <input
                      id="supply-supplier-no-exp"
                      className={`f-input${supplier.trim() ? ' hv' : ''}`}
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder=" "
                    />
                  </FloatingField>
                </>
              )}
            </div>
          </>
        )}

        {mode === 'restock' && supply && (
          <div className="premium-sheet__form">
            <p className="form-field-hint form-field-hint-block" style={{ marginTop: 0 }}>
              Currently on hand: {supply.quantity_on_hand} {supply.unit}
              {supply.cost_per_unit ? ` · ${fmtDetailed(supply.cost_per_unit)}/${supply.unit}` : ''}
            </p>

            <FloatingField id="restock-qty" label={`Add to stock (${supply.unit})`} filled={restockQty.trim().length > 0}>
              <input
                id="restock-qty"
                className={`f-input${restockQty.trim() ? ' hv' : ''}`}
                type="number"
                min={0}
                step={supply.unit === 'each' ? 1 : 0.5}
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder=" "
              />
            </FloatingField>

            <FloatingAffixField
              id="restock-paid"
              label="Total paid"
              type="number"
              min={0}
              step="0.01"
              value={restockCost}
              filled={restockCost.trim().length > 0}
              onChange={(e) => setRestockCost(e.target.value)}
            />
            {restockCostPerUnit > 0 ? (
              <p className="inv-computed-cost">
                This purchase: {fmtDetailed(restockCostPerUnit)}/{supply.unit} (blended into stock)
              </p>
            ) : null}
          </div>
        )}

        {mode !== 'restock' && (
          <>
            <div className="f-form-divider" />
            <div className="premium-sheet__form">
              <FloatingField id="supply-reorder" label={`Low stock alert (${activeUnit})`} filled={reorderAt.trim().length > 0}>
                <input
                  id="supply-reorder"
                  className={`f-input${reorderAt.trim() ? ' hv' : ''}`}
                  type="number"
                  min={0}
                  step={activeUnit === 'each' ? 1 : 0.5}
                  value={reorderAt}
                  onChange={(e) => setReorderAt(e.target.value)}
                  placeholder=" "
                />
              </FloatingField>
              <p className="form-field-hint">
                <Warning size={10} weight="fill" aria-hidden /> Shows LOW when on hand drops below this amount
              </p>

              {mode === 'edit' ? (
                <FloatingField id="supply-supplier-edit" label="Supplier" filled={supplier.trim().length > 0} optional>
                  <input
                    id="supply-supplier-edit"
                    className={`f-input${supplier.trim() ? ' hv' : ''}`}
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder=" "
                  />
                </FloatingField>
              ) : null}

              <FloatingField id="supply-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
                <textarea
                  id="supply-notes"
                  className={`f-textarea${notes.trim() ? ' hv' : ''}`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder=" "
                  rows={3}
                />
              </FloatingField>
            </div>
          </>
        )}
    </BottomSheet>
  )
}
