import { useMemo } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import type { Equipment, Supply } from '@rinse/core'
import { CategoryGrid } from '@/src/components/inventory/CategoryGrid'
import {
  EquipmentInventoryRow,
  SupplyInventoryRow,
} from '@/src/components/inventory/InventoryRows'
import { AppText, SectionGroup } from '@/src/components/ui'
import { useTabDockPadding } from '@/src/hooks/useTabDockPadding'
import type { HomeInventoryItem } from '@/src/lib/home-inventory'
import {
  SECTION_CONFIG,
  attentionSupplies,
  categoryMeta,
  sectionForSupply,
  type SectionKey,
} from '@/src/lib/inventory-utils'
import { colors, spacing } from '@/src/theme/colors'

interface InventoryHomeViewProps {
  catalog: Supply[]
  equipment: Equipment[]
  wishlist: HomeInventoryItem[]
  totalItems: number
  lowCount: number
  onOpenCategory: (key: SectionKey) => void
  onOpenSupply: (supply: Supply, section: SectionKey) => void
  refreshing?: boolean
  onRefresh?: () => void
}

export function InventoryHomeView({
  catalog,
  equipment,
  wishlist,
  totalItems,
  lowCount,
  onOpenCategory,
  onOpenSupply,
  refreshing = false,
  onRefresh,
}: InventoryHomeViewProps) {
  const dockPadding = useTabDockPadding()
  const attention = useMemo(() => attentionSupplies(catalog), [catalog])

  const metaByKey = useMemo(() => {
    const map = {} as Record<SectionKey, ReturnType<typeof categoryMeta>>
    for (const section of SECTION_CONFIG) {
      map[section.key] = categoryMeta(section.key, catalog, equipment, wishlist)
    }
    return map
  }, [catalog, equipment, wishlist])

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} /> : undefined
      }
    >
      <SectionGroup title="Categories" grouped={false}>
        <CategoryGrid metaByKey={metaByKey} lowCount={lowCount} onOpenCategory={onOpenCategory} />
      </SectionGroup>

      {attention.length > 0 ? (
        <SectionGroup title="Needs attention" meta={String(attention.length)}>
          {attention.map((supply, index) => (
            <SupplyInventoryRow
              key={supply.id}
              supply={supply}
              onPress={() => onOpenSupply(supply, sectionForSupply(supply))}
            />
          ))}
        </SectionGroup>
      ) : null}

      {totalItems === 0 ? (
        <View style={styles.hint}>
          <AppText variant="caption" style={styles.hintText}>
            Add chemicals, equipment, supplies, or wish list items to start tracking inventory.
          </AppText>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
  },
  hint: {
    paddingHorizontal: spacing.xs,
  },
  hintText: {
    color: '#6b7280',
  },
})
