import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import type { Equipment, Supply } from '@rinse/core'
import { InventoryCategoryView } from '@/src/components/inventory/InventoryCategoryView'
import { InventoryHomeView } from '@/src/components/inventory/InventoryHomeView'
import { OperatorScreen } from '@/src/components/OperatorScreen'
import { ScreenLoading } from '@/src/components/ui'
import { listEquipment, deleteEquipment } from '@/src/lib/equipment-api'
import {
  deleteHomeInventoryItem,
  getItemsByCategory,
  loadHomeInventory,
  saveHomeInventory,
  type HomeInventoryItem,
} from '@/src/lib/home-inventory'
import { isLowStock } from '@/src/lib/home-dashboard'
import { SECTION_CONFIG, type SectionKey } from '@/src/lib/inventory-utils'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { deleteSupply, listSupplies } from '@/src/lib/supplies-api'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors } from '@/src/theme/colors'

type InventoryView = 'home' | SectionKey

export default function InventoryScreen() {
  const router = useRouter()
  const goBack = useSafeBack()
  const { tick } = useDataRefresh()
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [wishlist, setWishlist] = useState<HomeInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [view, setView] = useState<InventoryView>('home')

  const reload = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [supplies, equip, homeItems] = await Promise.all([
        listSupplies(),
        listEquipment(),
        loadHomeInventory(),
      ])
      setCatalog(supplies)
      setEquipment(equip.filter((item) => (item.status ?? 'active') !== 'retired'))
      setWishlist(getItemsByCategory(homeItems, 'wishlist'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload, tick]),
  )

  const lowCount = useMemo(() => catalog.filter(isLowStock).length, [catalog])
  const totalItems = catalog.length + equipment.length + wishlist.length
  const subtitle =
    view === 'home'
      ? `${totalItems} item${totalItems === 1 ? '' : 's'}${lowCount > 0 ? ` · ${lowCount} low` : ''}`
      : undefined

  const openCategory = (key: SectionKey) => setView(key)

  const openSupply = (supply: Supply) => {
    router.push(`/inventory/supply/${supply.id}` as never)
  }

  const openSupplyFromHome = (supply: Supply) => {
    openSupply(supply)
  }

  const openEquipment = (item: Equipment) => {
    router.push(`/inventory/equipment/${item.id}` as never)
  }

  const openWishlist = (item: HomeInventoryItem) => {
    router.push(`/inventory/wishlist/${item.id}` as never)
  }

  const handleCategoryAdd = () => {
    const section = SECTION_CONFIG.find((entry) => entry.key === view)
    if (!section) return
    if (section.isWishlist) {
      router.push('/inventory/wishlist/new' as never)
      return
    }
    if (section.isEquipment) {
      router.push('/inventory/equipment/new' as never)
      return
    }
    if (section.supplyKind) {
      router.push(`/inventory/supply/new?kind=${section.supplyKind}` as never)
    }
  }

  const handleDeleteSupply = async (id: string) => {
    await deleteSupply(id)
    await reload(true)
  }

  const handleDeleteEquipment = async (id: string) => {
    await deleteEquipment(id)
    await reload(true)
  }

  const handleDeleteWishlist = async (id: string) => {
    const items = await loadHomeInventory()
    await saveHomeInventory(deleteHomeInventoryItem(items, id))
    await reload(true)
  }

  if (loading) {
    return (
      <OperatorScreen title="Inventory" onBack={goBack}>
        <ScreenLoading variant="list" />
      </OperatorScreen>
    )
  }

  return (
    <OperatorScreen
      title={view === 'home' ? 'Inventory' : SECTION_CONFIG.find((s) => s.key === view)?.title ?? 'Inventory'}
      subtitle={subtitle}
      onBack={view === 'home' ? goBack : () => setView('home')}
    >
      <View style={styles.body}>
        {view === 'home' ? (
          <InventoryHomeView
            catalog={catalog}
            equipment={equipment}
            wishlist={wishlist}
            totalItems={totalItems}
            lowCount={lowCount}
            onOpenCategory={openCategory}
            onOpenSupply={openSupplyFromHome}
            refreshing={refreshing}
            onRefresh={() => void reload(true)}
          />
        ) : (
          <InventoryCategoryView
            sectionKey={view}
            catalog={catalog}
            equipment={equipment}
            wishlist={wishlist}
            onOpenSupply={openSupply}
            onOpenEquipment={openEquipment}
            onOpenWishlist={openWishlist}
            onDeleteSupply={(id) => void handleDeleteSupply(id)}
            onDeleteEquipment={(id) => void handleDeleteEquipment(id)}
            onDeleteWishlist={(id) => void handleDeleteWishlist(id)}
            onAdd={handleCategoryAdd}
            refreshing={refreshing}
            onRefresh={() => void reload(true)}
          />
        )}
      </View>
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
})
