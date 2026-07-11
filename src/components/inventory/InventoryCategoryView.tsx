import { useEffect, useMemo, useState } from 'react'
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import type { Equipment, Supply } from '@rinse/core'
import {
  EquipmentInventoryRow,
  SupplyInventoryRow,
  WishlistInventoryRow,
} from '@/src/components/inventory/InventoryRows'
import {
  AppText,
  EmptyState,
  PillGroup,
  PrimaryButton,
  SearchField,
  SectionGroup,
} from '@/src/components/ui'
import type { HomeInventoryItem } from '@/src/lib/home-inventory'
import {
  SECTION_CONFIG,
  SUPPLY_FILTER_CHIPS,
  filterBySearch,
  filterSuppliesByKind,
  filterSuppliesList,
  groupSupplies,
  type SectionKey,
  type SupplyFilterChip,
} from '@/src/lib/inventory-utils'
import { colors, spacing } from '@/src/theme/colors'
import { useTabDockPadding } from '@/src/hooks/useTabDockPadding'

interface InventoryCategoryViewProps {
  sectionKey: SectionKey
  catalog: Supply[]
  equipment: Equipment[]
  wishlist: HomeInventoryItem[]
  onOpenSupply: (supply: Supply) => void
  onOpenEquipment: (item: Equipment) => void
  onOpenWishlist: (item: HomeInventoryItem) => void
  onDeleteSupply: (id: string, name: string) => void
  onDeleteEquipment: (id: string, name: string) => void
  onDeleteWishlist: (id: string, name: string) => void
  onAdd: () => void
  refreshing?: boolean
  onRefresh?: () => void
}

export function InventoryCategoryView({
  sectionKey,
  catalog,
  equipment,
  wishlist,
  onOpenSupply,
  onOpenEquipment,
  onOpenWishlist,
  onDeleteSupply,
  onDeleteEquipment,
  onDeleteWishlist,
  onAdd,
  refreshing = false,
  onRefresh,
}: InventoryCategoryViewProps) {
  const dockPadding = useTabDockPadding()
  const section = SECTION_CONFIG.find((entry) => entry.key === sectionKey)!
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<SupplyFilterChip>('all')

  useEffect(() => {
    setChip('all')
    setQuery('')
  }, [sectionKey])

  const supplyItems = useMemo(() => {
    if (!section.supplyKind) return []
    const base = filterSuppliesByKind(catalog, section.supplyKind)
    return filterSuppliesList(base, query, chip)
  }, [catalog, section.supplyKind, query, chip])

  const equipmentItems = useMemo(() => filterBySearch(equipment, query), [equipment, query])
  const wishlistItems = useMemo(() => filterBySearch(wishlist, query), [wishlist, query])
  const { attention, stocked } = useMemo(() => groupSupplies(supplyItems), [supplyItems])

  const showSupplyFilters = Boolean(section.supplyKind)
  const hasActiveFilters = query.trim() !== '' || chip !== 'all'
  const listIsEmpty =
    !section.isWishlist &&
    ((section.supplyKind && supplyItems.length === 0) || (section.isEquipment && equipmentItems.length === 0))
  const wishlistFilteredEmpty = section.isWishlist && wishlistItems.length === 0 && query.trim() !== ''
  const wishlistTrueEmpty = section.isWishlist && wishlist.length === 0 && !query.trim()
  const showAddDock =
    (section.supplyKind && !listIsEmpty) ||
    (section.isEquipment && !listIsEmpty) ||
    (section.isWishlist && !wishlistTrueEmpty && !wishlistFilteredEmpty)

  const confirmDelete = (title: string, message: string, onConfirm: () => void) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ])
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: showAddDock ? spacing.md : dockPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} /> : undefined
        }
      >
        <SearchField
          placeholder={`Search ${section.title.toLowerCase()}…`}
          value={query}
          onChangeText={setQuery}
        />

        {showSupplyFilters ? (
          <PillGroup
            inline
            options={SUPPLY_FILTER_CHIPS}
            value={chip}
            onChange={setChip}
          />
        ) : null}

        {listIsEmpty ? (
          <EmptyState
            title={hasActiveFilters ? 'No matches' : `No ${section.title.toLowerCase()} yet`}
            description={
              hasActiveFilters
                ? 'No items match your search or filters.'
                : `Add your first ${section.addLabel.toLowerCase()} to start tracking.`
            }
            actionLabel={hasActiveFilters ? undefined : `Add ${section.addLabel}`}
            onAction={hasActiveFilters ? undefined : onAdd}
          />
        ) : null}

        {wishlistTrueEmpty ? (
          <EmptyState
            title="Wish list is empty"
            description="Track products you want to buy for your setup."
            actionLabel={`Add ${section.addLabel}`}
            onAction={onAdd}
          />
        ) : null}

        {wishlistFilteredEmpty ? (
          <EmptyState title="No matches" description="No wish list items match your search." />
        ) : null}

        {section.isWishlist && !wishlistTrueEmpty && !wishlistFilteredEmpty ? (
          <SectionGroup title={section.title} meta={String(wishlistItems.length)}>
            {wishlistItems.map((item, index) => (
              <WishlistInventoryRow
                key={item.id}
                item={item}
                onPress={() => onOpenWishlist(item)}
                onLongPress={() =>
                  confirmDelete('Remove item?', `Remove "${item.name}" from your wish list?`, () =>
                    onDeleteWishlist(item.id, item.name),
                  )
                }
              />
            ))}
          </SectionGroup>
        ) : null}

        {section.isEquipment && !listIsEmpty ? (
          <SectionGroup title={section.title} meta={String(equipmentItems.length)}>
            {equipmentItems.map((item) => (
              <EquipmentInventoryRow
                key={item.id}
                item={item}
                onPress={() => onOpenEquipment(item)}
                onLongPress={() =>
                  confirmDelete('Delete equipment?', `Delete "${item.name}" from equipment?`, () =>
                    onDeleteEquipment(item.id, item.name),
                  )
                }
              />
            ))}
          </SectionGroup>
        ) : null}

        {section.supplyKind && !listIsEmpty && attention.length > 0 ? (
          <SectionGroup title="Needs attention" meta={String(attention.length)}>
            {attention.map((item) => (
              <SupplyInventoryRow
                key={item.id}
                supply={item}
                onPress={() => onOpenSupply(item)}
                onLongPress={() =>
                  confirmDelete('Delete supply?', `Delete "${item.name}" from inventory?`, () =>
                    onDeleteSupply(item.id, item.name),
                  )
                }
              />
            ))}
          </SectionGroup>
        ) : null}

        {section.supplyKind && !listIsEmpty && stocked.length > 0 ? (
          <SectionGroup title="Stocked" meta={String(stocked.length)}>
            {stocked.map((item) => (
              <SupplyInventoryRow
                key={item.id}
                supply={item}
                onPress={() => onOpenSupply(item)}
                onLongPress={() =>
                  confirmDelete('Delete supply?', `Delete "${item.name}" from inventory?`, () =>
                    onDeleteSupply(item.id, item.name),
                  )
                }
              />
            ))}
          </SectionGroup>
        ) : null}
      </ScrollView>

      {showAddDock ? (
        <View style={[styles.dock, { paddingBottom: dockPadding }]}>
          <PrimaryButton label={`Add ${section.addLabel}`} onPress={onAdd} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  scroll: {
    gap: spacing.sm,
  },
  dock: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgBase,
  },
})
