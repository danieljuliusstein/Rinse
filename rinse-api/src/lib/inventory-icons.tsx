'use client'

import {
  Drop,
  Fan,
  Flask,
  Gear,
  HairDryer,
  Hammer,
  HandSoap,
  Lightning,
  Package,
  PaintBrush,
  PaintBucket,
  Plug,
  Scissors,
  Sparkle,
  SprayBottle,
  StarFour,
  Toolbox,
  Towel,
  TShirt,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'

export type SupplyIconKey =
  | 'flask'
  | 'drop'
  | 'spray-bottle'
  | 'paint-brush'
  | 'hand-soap'
  | 'paint-bucket'
  | 'package'
  | 'towel'
  | 't-shirt'
  | 'sparkle'
  | 'scissors'

export type EquipmentIconKey =
  | 'wrench'
  | 'lightning'
  | 'fan'
  | 'hair-dryer'
  | 'gear'
  | 'hammer'
  | 'plug'
  | 'toolbox'

export type InventoryIconVariant = 'supply' | 'equipment'

export type InventoryIconOption = {
  id: string
  label: string
  Icon: PhosphorIcon
}

const SUPPLY_ICON_OPTIONS: InventoryIconOption[] = [
  { id: 'flask', label: 'Chemical', Icon: Flask },
  { id: 'drop', label: 'Liquid', Icon: Drop },
  { id: 'spray-bottle', label: 'Spray', Icon: SprayBottle },
  { id: 'paint-brush', label: 'Applicator', Icon: PaintBrush },
  { id: 'hand-soap', label: 'Soap', Icon: HandSoap },
  { id: 'paint-bucket', label: 'Bucket', Icon: PaintBucket },
  { id: 'package', label: 'Supply', Icon: Package },
  { id: 'towel', label: 'Towel', Icon: Towel },
  { id: 't-shirt', label: 'Microfiber', Icon: TShirt },
  { id: 'sparkle', label: 'Polish', Icon: Sparkle },
  { id: 'scissors', label: 'Trim', Icon: Scissors },
]

const EQUIPMENT_ICON_OPTIONS: InventoryIconOption[] = [
  { id: 'wrench', label: 'Tool', Icon: Wrench },
  { id: 'lightning', label: 'Polisher', Icon: Lightning },
  { id: 'fan', label: 'Fan', Icon: Fan },
  { id: 'hair-dryer', label: 'Dryer', Icon: HairDryer },
  { id: 'gear', label: 'Machine', Icon: Gear },
  { id: 'hammer', label: 'Hammer', Icon: Hammer },
  { id: 'plug', label: 'Power', Icon: Plug },
  { id: 'toolbox', label: 'Kit', Icon: Toolbox },
]

export function inventoryIconOptions(variant: InventoryIconVariant): InventoryIconOption[] {
  return variant === 'supply' ? SUPPLY_ICON_OPTIONS : EQUIPMENT_ICON_OPTIONS
}

export function getInventoryIconOption(
  iconKey: string | undefined,
  variant: InventoryIconVariant,
): InventoryIconOption | null {
  if (!iconKey) return null
  return inventoryIconOptions(variant).find((option) => option.id === iconKey) ?? null
}

export function resolveInventoryIcon(
  iconKey: string | undefined,
  variant: InventoryIconVariant,
  FallbackIcon: PhosphorIcon,
): PhosphorIcon {
  return getInventoryIconOption(iconKey, variant)?.Icon ?? FallbackIcon
}

/** Auto option uses category default icon in tiles; picker shows a sparkle star. */
export const INVENTORY_ICON_AUTO: InventoryIconOption = {
  id: '',
  label: 'Auto',
  Icon: StarFour,
}
