'use client'

import type { InventoryIconVariant } from '@/lib/inventory-icons'
import {
  INVENTORY_ICON_AUTO,
  inventoryIconOptions,
} from '@/lib/inventory-icons'

type Props = {
  variant: InventoryIconVariant
  value: string | undefined
  onChange: (iconKey: string | undefined) => void
}

export default function InventoryIconPicker({ variant, value, onChange }: Props) {
  const options = inventoryIconOptions(variant)
  const activeKey = value ?? ''

  return (
    <div className="inv-icon-picker">
      <p className="inv-icon-picker__label">Icon</p>
      <div className="inv-icon-picker__grid" role="group" aria-label="Item icon">
        {[INVENTORY_ICON_AUTO, ...options].map((option) => {
          const active = activeKey === option.id
          const { Icon } = option
          return (
            <button
              key={option.id || 'auto'}
              type="button"
              className={`inv-icon-picker__btn${active ? ' inv-icon-picker__btn--on' : ''}`}
              aria-pressed={active}
              aria-label={option.label}
              title={option.label}
              onClick={() => onChange(option.id || undefined)}
            >
              <Icon
                size={22}
                weight={active ? 'fill' : 'duotone'}
                color={active ? 'var(--cta-ink)' : 'var(--text-muted)'}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
      <p className="form-field-hint">Auto picks an icon from the item type</p>
    </div>
  )
}
