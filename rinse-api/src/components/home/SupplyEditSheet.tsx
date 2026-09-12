'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { Warning } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import AcquisitionToggle, { type AcquisitionMode } from '@/components/inventory/AcquisitionToggle'
import InventoryIconPicker from '@/components/inventory/InventoryIconPicker'
import {
  FloatingAffixField,
  FloatingField,
  FormProgressBar,
  PillGroup,
  SheetFooter,
} from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { costPerUnitFromPurchase } from '@/lib/supplies-logic'
import { fmtDetailed } from '@/lib/calculations'
import { computeFormProgress } from '@/lib/form-progress'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { supplyFormSchema, type SupplyFormValues } from '@/lib/validation'
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

function defaultValuesForMode(
  mode: SupplySheetMode,
  supply: Supply | null,
  kind: SupplyKind,
): SupplyFormValues {
  const defaultUnit = kind === 'consumable' ? 'each' : 'oz'
  if (mode === 'add') {
    return {
      mode: 'add',
      name: '',
      qty: 0,
      total_cost: 0,
      cost_per_unit_manual: 0,
      reorder_threshold: undefined,
      supplier: '',
      notes: '',
    }
  }
  if (mode === 'restock') {
    return {
      mode: 'restock',
      restock_qty: 0,
      restock_cost: 0,
    }
  }
  return {
    mode: 'edit',
    name: supply?.name ?? '',
    quantity_on_hand: supply?.quantity_on_hand ?? 0,
    reorder_threshold: supply?.reorder_threshold,
    supplier: supply?.supplier ?? '',
    notes: supply?.notes ?? '',
  }
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
  const defaultUnit = kind === 'consumable' ? 'each' : 'oz'
  const [unit, setUnit] = useState(defaultUnit)
  const [iconKey, setIconKey] = useState<string | undefined>(undefined)
  const [acquisition, setAcquisition] = useState<AcquisitionMode>('bought_new')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  const { control, watch, reset, submitWithToast } = useRinseForm<SupplyFormValues>({
    schema: supplyFormSchema,
    defaultValues: defaultValuesForMode(mode, supply, kind),
  })

  const formMode = watch('mode')
  const name = formMode === 'restock' ? '' : watch('name')
  const qty = formMode === 'add' ? watch('qty') : 0
  const totalCost = formMode === 'add' ? watch('total_cost') : 0
  const costPerUnitManual = formMode === 'add' ? watch('cost_per_unit_manual') : 0
  const onHand = formMode === 'edit' ? watch('quantity_on_hand') : 0
  const reorderAt = formMode !== 'restock' ? watch('reorder_threshold') : undefined
  const supplier = formMode !== 'restock' ? watch('supplier') : ''
  const notes = formMode !== 'restock' ? watch('notes') : ''
  const restockQty = formMode === 'restock' ? watch('restock_qty') : 0
  const restockCost = formMode === 'restock' ? watch('restock_cost') : 0

  const activeUnit = unit.trim() || defaultUnit
  const baseUnits = unitOptions(kind)
  const units =
    supply && !baseUnits.includes(supply.unit as (typeof baseUnits)[number])
      ? [...baseUnits, supply.unit]
      : baseUnits

  useEffect(() => {
    reset(defaultValuesForMode(mode, supply, kind))
    if (mode === 'add') {
      setUnit(defaultUnit)
      setIconKey(undefined)
      setAcquisition('bought_new')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      return
    }
    if (!supply) return
    const opts = unitOptions(kind)
    setUnit(opts.includes(supply.unit as (typeof opts)[number]) ? supply.unit : defaultUnit)
    setIconKey(supply.icon_key || undefined)
  }, [supply, mode, kind, defaultUnit, reset])

  const progress = computeFormProgress(
    [
      name,
      formMode === 'edit' ? String(onHand) : '',
      formMode === 'add' ? String(qty) : '',
      formMode === 'add' ? String(totalCost) : '',
      reorderAt != null ? String(reorderAt) : '',
      supplier ?? '',
      notes ?? '',
      formMode === 'restock' ? String(restockQty) : '',
      formMode === 'restock' ? String(restockCost) : '',
    ],
    1,
    1,
  )

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
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
    formMode,
  ])

  const computedCostPerUnit = useMemo(() => {
    if (mode !== 'add' || acquisition !== 'bought_new' || !qty || !totalCost) return 0
    return costPerUnitFromPurchase(qty, totalCost)
  }, [mode, qty, totalCost, acquisition])

  const restockCostPerUnit = useMemo(() => {
    if (mode !== 'restock' || !restockQty || !restockCost) return 0
    return costPerUnitFromPurchase(restockQty, restockCost)
  }, [mode, restockQty, restockCost])

  const title =
    mode === 'add'
      ? `Add ${kind === 'chemical' ? 'chemical' : 'supply'}`
      : mode === 'restock'
        ? `Restock ${supply?.name ?? ''}`
        : supply?.name ?? 'Edit item'

  const handleSave = submitWithToast(async (values) => {
    setSaving(true)
    try {
      if (values.mode === 'add') {
        const input: SupplyInput = {
          name: values.name,
          unit: activeUnit,
          quantity_on_hand: values.qty,
          reorder_threshold: values.reorder_threshold,
          cost_per_unit:
            acquisition === 'bought_new'
              ? computedCostPerUnit || undefined
              : values.cost_per_unit_manual || undefined,
          supplier: values.supplier?.trim() || undefined,
          kind,
          notes: values.notes?.trim() || undefined,
          icon_key: iconKey,
        }
        const includeExpense = acquisition === 'bought_new'
        const options: SupplyAddOptions = includeExpense
          ? {
              logExpense: true,
              totalPaid: values.total_cost || undefined,
              purchaseDate,
            }
          : { logExpense: false }
        await onSaveAdd(input, options)
      } else if (values.mode === 'edit' && supply) {
        await onSaveEdit(supply.id, {
          name: values.name,
          unit: activeUnit,
          quantity_on_hand: values.quantity_on_hand,
          reorder_threshold: values.reorder_threshold,
          supplier: values.supplier?.trim() || undefined,
          notes: values.notes?.trim() || undefined,
          icon_key: iconKey ?? '',
        })
      } else if (values.mode === 'restock' && supply) {
        await onRestock(supply.id, values.restock_qty, values.restock_cost > 0 ? values.restock_cost : 0)
      }
      await onAfterSave?.()
      onClose()
    } finally {
      setSaving(false)
    }
  })

  const subtitle =
    mode === 'add'
      ? 'How you measure it, how much you have, and when to reorder'
      : mode === 'edit'
        ? 'Update stock counts and alert levels — use Restock after a purchase'
        : 'Log a purchase to add stock and update cost per unit'

  const ready =
    mode === 'add'
      ? name.trim().length > 0 && qty > 0
      : mode === 'restock'
        ? restockQty > 0
        : name.trim().length > 0

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
          ready={ready}
          saving={saving}
          layout="split"
          onSave={() => void handleSave()}
          onCancel={onClose}
          onDelete={mode === 'edit' && supply && onDelete ? () => void onDelete(supply.id) : undefined}
        />
      }
    >
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
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <FloatingField
                    id="supply-name"
                    label="Name"
                    filled={field.value.trim().length > 0}
                    error={fieldState.error?.message}
                  >
                    <input
                      id="supply-name"
                      className={`f-input${field.value.trim() ? ' hv' : ''}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                    />
                  </FloatingField>
                )}
              />

              <InventoryIconPicker variant="supply" value={iconKey} onChange={setIconKey} />

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
            <Controller
              control={control}
              name="quantity_on_hand"
              render={({ field, fieldState }) => (
                <FloatingField
                  id="supply-on-hand"
                  label={`Quantity on hand (${activeUnit})`}
                  filled={field.value > 0 || field.value === 0}
                  error={fieldState.error?.message}
                >
                  <input
                    id="supply-on-hand"
                    className={`f-input${String(field.value).trim() ? ' hv' : ''}`}
                    type="number"
                    min={0}
                    step={activeUnit === 'each' ? 1 : 0.5}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    placeholder=" "
                  />
                </FloatingField>
              )}
            />
          </div>
        )}

        {mode === 'add' && (
          <>
            <div className="f-form-divider" />
            <div className="premium-sheet__form">
              <AcquisitionToggle value={acquisition} onChange={setAcquisition} />

              <Controller
                control={control}
                name="qty"
                render={({ field, fieldState }) => (
                  <FloatingField
                    id="supply-qty"
                    label={`Starting amount (${activeUnit})`}
                    filled={field.value > 0}
                    error={fieldState.error?.message}
                  >
                    <input
                      id="supply-qty"
                      className={`f-input${field.value > 0 ? ' hv' : ''}`}
                      type="number"
                      min={0}
                      step={activeUnit === 'each' ? 1 : 0.5}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      onBlur={field.onBlur}
                      placeholder=" "
                    />
                  </FloatingField>
                )}
              />

              {acquisition === 'bought_new' ? (
                <>
                  <Controller
                    control={control}
                    name="total_cost"
                    render={({ field, fieldState }) => (
                      <FloatingAffixField
                        id="supply-paid"
                        label="Amount paid"
                        currency
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                      />
                    )}
                  />

                  <div className="premium-sheet__grid2">
                    <Controller
                      control={control}
                      name="supplier"
                      render={({ field, fieldState }) => (
                        <FloatingField
                          id="supply-vendor"
                          label="Vendor"
                          filled={(field.value ?? '').trim().length > 0}
                          optional
                          error={fieldState.error?.message}
                        >
                          <input
                            id="supply-vendor"
                            className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder=" "
                          />
                        </FloatingField>
                      )}
                    />
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
                  <Controller
                    control={control}
                    name="cost_per_unit_manual"
                    render={({ field, fieldState }) => (
                      <FloatingAffixField
                        id="supply-cpu"
                        label={`Cost per ${activeUnit}`}
                        currency
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <p className="form-field-hint">For job costing only — not logged as expense</p>

                  <Controller
                    control={control}
                    name="supplier"
                    render={({ field, fieldState }) => (
                      <FloatingField
                        id="supply-supplier-no-exp"
                        label="Supplier"
                        filled={(field.value ?? '').trim().length > 0}
                        optional
                        error={fieldState.error?.message}
                      >
                        <input
                          id="supply-supplier-no-exp"
                          className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                        />
                      </FloatingField>
                    )}
                  />
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

            <Controller
              control={control}
              name="restock_qty"
              render={({ field, fieldState }) => (
                <FloatingField
                  id="restock-qty"
                  label={`Add to stock (${supply.unit})`}
                  filled={field.value > 0}
                  error={fieldState.error?.message}
                >
                  <input
                    id="restock-qty"
                    className={`f-input${field.value > 0 ? ' hv' : ''}`}
                    type="number"
                    min={0}
                    step={supply.unit === 'each' ? 1 : 0.5}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    placeholder=" "
                  />
                </FloatingField>
              )}
            />

            <Controller
              control={control}
              name="restock_cost"
              render={({ field, fieldState }) => (
                <FloatingAffixField
                  id="restock-paid"
                  label="Total paid"
                  currency
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
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
              <Controller
                control={control}
                name="reorder_threshold"
                render={({ field, fieldState }) => (
                  <FloatingField
                    id="supply-reorder"
                    label={`Low stock alert (${activeUnit})`}
                    filled={field.value != null && field.value > 0}
                    error={fieldState.error?.message}
                  >
                    <input
                      id="supply-reorder"
                      className={`f-input${field.value != null && field.value > 0 ? ' hv' : ''}`}
                      type="number"
                      min={0}
                      step={activeUnit === 'each' ? 1 : 0.5}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value
                        field.onChange(raw === '' ? undefined : Number(raw))
                      }}
                      onBlur={field.onBlur}
                      placeholder=" "
                    />
                  </FloatingField>
                )}
              />
              <p className="form-field-hint">
                <Warning size={10} weight="fill" aria-hidden /> Shows LOW when on hand drops below this amount
              </p>

              {mode === 'edit' ? (
                <Controller
                  control={control}
                  name="supplier"
                  render={({ field, fieldState }) => (
                    <FloatingField
                      id="supply-supplier-edit"
                      label="Supplier"
                      filled={(field.value ?? '').trim().length > 0}
                      optional
                      error={fieldState.error?.message}
                    >
                      <input
                        id="supply-supplier-edit"
                        className={`f-input${(field.value ?? '').trim() ? ' hv' : ''}`}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder=" "
                      />
                    </FloatingField>
                  )}
                />
              ) : null}

              <Controller
                control={control}
                name="notes"
                render={({ field, fieldState }) => (
                  <FloatingField
                    id="supply-notes"
                    label="Notes"
                    filled={(field.value ?? '').trim().length > 0}
                    optional
                    textarea
                    error={fieldState.error?.message}
                  >
                    <textarea
                      id="supply-notes"
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
          </>
        )}
    </BottomSheet>
  )
}
