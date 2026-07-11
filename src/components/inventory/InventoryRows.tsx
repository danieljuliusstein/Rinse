import { Flask, Package, Star, Wrench } from 'phosphor-react-native'
import type { Equipment, Supply } from '@rinse/core'
import { AppText, ListRow } from '@/src/components/ui'
import type { HomeInventoryItem } from '@/src/lib/home-inventory'
import {
  formatMoney,
  inventoryRowVariant,
  supplyMetaLabel,
  supplyQuantityLabel,
} from '@/src/lib/inventory-utils'
import { colors } from '@/src/theme/colors'

export function SupplyInventoryRow({
  supply,
  onPress,
  onLongPress,
}: {
  supply: Supply
  onPress: () => void
  onLongPress?: () => void
}) {
  const variant = inventoryRowVariant(supply)
  const FallbackIcon = supply.kind === 'chemical' ? Flask : Package

  return (
    <ListRow
      icon={<FallbackIcon size={18} color={variant === 'danger' ? '#d97706' : supply.kind === 'chemical' ? '#2563eb' : '#16a34a'} weight="duotone" />}
      iconTone={variant === 'danger' ? 'amber' : supply.kind === 'chemical' ? 'blue' : 'green'}
      title={supply.name}
      subtitle={supplyMetaLabel(supply)}
      trailing={<ListRowAmount label={supplyQuantityLabel(supply)} variant={variant} />}
      showChevron
      grouped
      onPress={onPress}
      onLongPress={onLongPress}
    />
  )
}

export function EquipmentInventoryRow({
  item,
  onPress,
  onLongPress,
}: {
  item: Equipment
  onPress: () => void
  onLongPress?: () => void
}) {
  return (
    <ListRow
      icon={<Wrench size={18} color="#7c3aed" weight="duotone" />}
      iconTone="purple"
      title={item.name}
      subtitle={item.purchase_date ? `Purchased ${item.purchase_date}` : undefined}
      trailing={
        item.purchase_price != null && item.purchase_price > 0 ? (
          <ListRowAmount label={formatMoney(item.purchase_price)} />
        ) : undefined
      }
      showChevron
      grouped
      onPress={onPress}
      onLongPress={onLongPress}
    />
  )
}

export function WishlistInventoryRow({
  item,
  onPress,
  onLongPress,
}: {
  item: HomeInventoryItem
  onPress: () => void
  onLongPress?: () => void
}) {
  return (
    <ListRow
      icon={<Star size={18} color="#d97706" weight="duotone" />}
      iconTone="amber"
      title={item.name}
      subtitle={item.notes || undefined}
      trailing={<ListRowAmount label={formatMoney(item.priceEstimate ?? 0)} />}
      showChevron
      grouped
      onPress={onPress}
      onLongPress={onLongPress}
    />
  )
}

function ListRowAmount({
  label,
  variant = '',
}: {
  label: string
  variant?: '' | 'warning' | 'danger'
}) {
  return (
    <AppText
      variant="bodyMedium"
      style={{
        color: variant === 'danger' ? colors.danger : variant === 'warning' ? '#d97706' : colors.textPrimary,
      }}
    >
      {label}
    </AppText>
  )
}
