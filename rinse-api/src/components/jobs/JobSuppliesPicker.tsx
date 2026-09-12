'use client'

import { useMemo, useState } from 'react'
import { Minus, Plus } from '@phosphor-icons/react'
import { fmtDetailed } from '@/lib/calculations'
import type { Supply, SupplyUsage } from '@/lib/types'

interface JobSuppliesPickerProps {
  supplies: Supply[]
  value: SupplyUsage[]
  onChange: (next: SupplyUsage[]) => void
}

export default function JobSuppliesPicker({ supplies, value, onChange }: JobSuppliesPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')

  const usedIds = useMemo(() => new Set(value.map((u) => u.supply_id)), [value])
  const available = supplies.filter((s) => !usedIds.has(s.id))

  const step = (supply: Supply) => (supply.unit === 'each' ? 1 : 0.5)

  const updateQty = (supplyId: string, qty: number) => {
    if (qty <= 0) {
      onChange(value.filter((u) => u.supply_id !== supplyId))
      return
    }
    const existing = value.find((u) => u.supply_id === supplyId)
    if (existing) {
      onChange(value.map((u) => (u.supply_id === supplyId ? { ...u, quantity_used: qty } : u)))
    } else {
      onChange([...value, { supply_id: supplyId, quantity_used: qty }])
    }
  }

  const addSupply = () => {
    if (!selectedId) return
    onChange([...value, { supply_id: selectedId, quantity_used: 1 }])
    setSelectedId('')
    setPickerOpen(false)
  }

  return (
    <div>
      {value.length === 0 && (
        <p className="usage-empty-hint">
          No supplies logged — add existing items from your catalog.
        </p>
      )}

      {value.map((usage) => {
        const supply = supplies.find((s) => s.id === usage.supply_id)
        if (!supply) return null
        const increment = step(supply)
        const lineCost =
          supply.cost_per_unit != null
            ? fmtDetailed(supply.cost_per_unit * usage.quantity_used)
            : null

        return (
          <div key={usage.supply_id} className="usage-item-row">
            <div className="usage-item-row__main">
              <p className="usage-item-row__name">{supply.name}</p>
              <p className="usage-item-row__stock">
                {supply.quantity_on_hand} {supply.unit} on hand
                {lineCost ? ` · est. ${lineCost}` : ''}
              </p>
            </div>
            <div className="usage-stepper">
              <button
                type="button"
                className="usage-stepper__btn"
                aria-label={`Decrease ${supply.name}`}
                onClick={() => updateQty(usage.supply_id, usage.quantity_used - increment)}
              >
                <Minus size={14} weight="bold" />
              </button>
              <span className="usage-stepper__value">{usage.quantity_used}</span>
              <button
                type="button"
                className="usage-stepper__btn"
                aria-label={`Increase ${supply.name}`}
                onClick={() => updateQty(usage.supply_id, usage.quantity_used + increment)}
              >
                <Plus size={14} weight="bold" />
              </button>
            </div>
          </div>
        )
      })}

      {pickerOpen ? (
        <div className="usage-picker-inline">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label="Select supply"
          >
            <option value="">Select supply…</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.quantity_on_hand} {s.unit})
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary" onClick={addSupply} disabled={!selectedId}>
            Add
          </button>
          <button type="button" className="btn-ghost" onClick={() => setPickerOpen(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="usage-add-row"
          onClick={() => setPickerOpen(true)}
          disabled={available.length === 0}
        >
          <Plus size={16} weight="bold" />
          Add existing supply
        </button>
      )}
    </div>
  )
}

export function totalSupplyUsageCost(supplies: Supply[], value: SupplyUsage[]): number {
  let total = 0
  for (const usage of value) {
    const supply = supplies.find((s) => s.id === usage.supply_id)
    if (supply?.cost_per_unit != null) {
      total += supply.cost_per_unit * usage.quantity_used
    }
  }
  return total
}
