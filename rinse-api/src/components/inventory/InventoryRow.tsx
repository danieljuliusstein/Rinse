'use client'

import { Flask, Package, Star, Wrench } from '@phosphor-icons/react'
import { Badge, ListRow } from '@/components/ui'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  inventoryRowVariant,
  supplyMetaLabel,
  supplyQuantityLabel,
} from '@/components/inventory/inventory-utils'
import { resolveInventoryIcon } from '@/lib/inventory-icons'
import type { HomeInventoryItem } from '@/lib/home-inventory'
import type { Equipment, Supply } from '@/lib/types'

interface RowBaseProps {
  onPress: () => void
}

export function SupplyInventoryRow({
  supply,
  onPress,
  inExpenses = false,
}: RowBaseProps & { supply: Supply; inExpenses?: boolean }) {
  const variant = inventoryRowVariant(supply)
  const FallbackIcon = supply.kind === 'chemical' ? Flask : Package
  const Icon = resolveInventoryIcon(supply.icon_key, 'supply', FallbackIcon)

  return (
    <ListRow
      className={variant ? `inventory-list-row inventory-list-row--${variant}` : 'inventory-list-row'}
      icon={<Icon key={supply.icon_key ?? 'auto'} size={18} weight="duotone" />}
      iconTone={variant === 'danger' ? 'amber' : supply.kind === 'chemical' ? 'blue' : 'green'}
      title={supply.name}
      subtitle={supplyMetaLabel(supply)}
      trailing={supplyQuantityLabel(supply)}
      badge={inExpenses ? <Badge tone="gray">In expenses</Badge> : undefined}
      onClick={onPress}
    />
  )
}

export function EquipmentInventoryRow({
  item,
  onPress,
  inExpenses = false,
}: RowBaseProps & { item: Equipment; inExpenses?: boolean }) {
  const Icon = resolveInventoryIcon(item.icon_key, 'equipment', Wrench)

  return (
    <ListRow
      className="inventory-list-row"
      icon={<Icon key={item.icon_key ?? 'auto'} size={18} weight="duotone" />}
      iconTone="purple"
      title={item.name}
      subtitle={item.purchase_date ? `Purchased ${item.purchase_date}` : undefined}
      trailing={
        item.purchase_price != null && item.purchase_price > 0 ? (
          <CurrencyAmount value={item.purchase_price} precision="detailed" className="ui-list-row__amount" />
        ) : undefined
      }
      badge={inExpenses ? <Badge tone="gray">In expenses</Badge> : undefined}
      onClick={onPress}
    />
  )
}

export function WishlistInventoryRow({ item, onPress }: RowBaseProps & { item: HomeInventoryItem }) {
  return (
    <ListRow
      className="inventory-list-row"
      icon={<Star size={18} weight="duotone" />}
      iconTone="amber"
      title={item.name}
      subtitle={item.notes || undefined}
      trailing={
        item.priceEstimate != null && item.priceEstimate > 0 ? (
          <CurrencyAmount value={item.priceEstimate} className="ui-list-row__amount" />
        ) : (
          '$0'
        )
      }
      onClick={onPress}
    />
  )
}
