'use client'

import type { CSSProperties } from 'react'
import { Flask, Package, Wrench } from '@phosphor-icons/react'
import ProductTile from '@/components/inventory/ProductTile'
import { Badge } from '@/components/ui'
import { monogramColor, monogramForName } from '@/components/inventory/inventory-utils'
import type { BusinessExpense, Equipment, Supply, SupplyKind } from '@/lib/types'
import { fmtDetailed } from '@/lib/calculations'

interface EquipmentTileProps {
  item: Equipment
  onPress: () => void
  inExpenses?: boolean
}

export function EquipmentProductTile({ item, onPress, inExpenses = false }: EquipmentTileProps) {
  const monogramStyle = { '--monogram-bg': monogramColor(item.name) } as CSSProperties

  return (
    <button type="button" className="product-tile" onClick={onPress}>
      <div className="product-tile__media">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="product-tile__img" loading="lazy" />
        ) : (
          <div className="product-tile__monogram" style={monogramStyle}>
            <Wrench size={24} weight="duotone" color="rgba(255,255,255,0.85)" aria-hidden />
            <span className="product-tile__mono-text">{monogramForName(item.name)}</span>
          </div>
        )}
        {inExpenses ? (
          <Badge tone="gray" className="product-tile__expense-badge">
            In expenses
          </Badge>
        ) : null}
      </div>
      <div className="product-tile__body">
        <p className="product-tile__name">{item.name}</p>
        <p className="product-tile__qty">
          {item.purchase_price ? fmtDetailed(item.purchase_price) : 'Equipment'}
        </p>
        <div className="product-tile__bar-track" aria-hidden>
          <div className="product-tile__bar-fill product-tile__bar-fill--ok product-tile__bar-fill--full" />
        </div>
      </div>
    </button>
  )
}

interface SupplyGridProps {
  supplies: Supply[]
  onOpen: (supply: Supply) => void
  kind?: SupplyKind
  expenseIds?: Set<string>
}

export function SupplyProductGrid({ supplies, onOpen, kind, expenseIds }: SupplyGridProps) {
  const Icon = kind === 'chemical' ? Flask : Package
  return (
    <div className="product-grid">
      {supplies.map((supply) => (
        <ProductTile
          key={supply.id}
          supply={supply}
          onPress={() => onOpen(supply)}
          FallbackIcon={Icon}
          inExpenses={expenseIds ? expenseIds.has(supply.id) : false}
        />
      ))}
    </div>
  )
}

interface EquipmentGridProps {
  items: Equipment[]
  onOpen: (item: Equipment) => void
  expenseMap?: Map<string, BusinessExpense>
}

export function EquipmentProductGrid({ items, onOpen, expenseMap }: EquipmentGridProps) {
  return (
    <div className="product-grid">
      {items.map((item) => (
        <EquipmentProductTile
          key={item.id}
          item={item}
          onPress={() => onOpen(item)}
          inExpenses={expenseMap ? expenseMap.has(item.id) : false}
        />
      ))}
    </div>
  )
}
