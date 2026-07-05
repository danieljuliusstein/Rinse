'use client'

import { useCallback, useEffect, useMemo, useOptimistic, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BusinessExpenseSheet from '@/components/business/BusinessExpenseSheet'
import EquipmentEditSheet, { type EquipmentSheetMode } from '@/components/home/EquipmentEditSheet'
import InventoryEditSheet from '@/components/home/InventoryEditSheet'
import SupplyEditSheet, { type SupplySheetMode } from '@/components/home/SupplyEditSheet'
import InventoryCategoryView from '@/components/inventory/InventoryCategoryView'
import InventoryHome from '@/components/inventory/InventoryHome'
import { SECTION_CONFIG, type SectionKey } from '@/components/inventory/inventory-utils'
import { expenseByEquipmentId } from '@/lib/equipment-expense-logic'
import { supplyIdsInExpenses } from '@/lib/inventory-expense-logic'
import {
  createBusinessExpense,
  createEquipment,
  createSupply,
  createSupplyPurchase,
  deleteEquipment,
  deleteSupply,
  getBusinessExpenses,
  getEquipment,
  getSupplies,
  restockSupply,
  updateEquipment,
  updateSupply,
} from '@/lib/api'
import {
  deleteHomeInventoryItem,
  getItemsByCategory,
  loadHomeInventory,
  saveHomeInventory,
  upsertHomeInventoryItem,
  type HomeInventoryItem,
} from '@/lib/home-inventory'
import { isLowStock } from '@/lib/supplies-logic'
import { optimisticSupplyReducer, type SupplyOptimisticAction } from '@/lib/optimistic-reducers'
import { useActionToast } from '@/providers/ActionToastProvider'
import type { BusinessExpense, Equipment, Supply, SupplyKind } from '@/lib/types'

type InventoryView = 'home' | SectionKey

function notifyLowStock(name: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(`You're running low on ${name} — time to restock`)
  } catch {
    // ignore
  }
}

export default function InventoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showMessage } = useActionToast()
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [optimisticCatalog, addOptimisticCatalog] = useOptimistic(catalog, (state, action: SupplyOptimisticAction) =>
    optimisticSupplyReducer(state, action),
  )
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpense[]>([])
  const [wishlist, setWishlist] = useState<HomeInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<InventoryView>('home')
  const [swipedRowId, setSwipedRowId] = useState<string | null>(null)

  const [editingSupply, setEditingSupply] = useState<Supply | null>(null)
  const [supplyKind, setSupplyKind] = useState<SupplyKind>('chemical')
  const [supplyMode, setSupplyMode] = useState<SupplySheetMode>('add')
  const [addingSupplyKind, setAddingSupplyKind] = useState<SupplyKind | null>(null)

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [equipmentMode, setEquipmentMode] = useState<EquipmentSheetMode>('add')
  const [addingEquipment, setAddingEquipment] = useState(false)
  const [viewingExpense, setViewingExpense] = useState<BusinessExpense | null>(null)

  const [editingWishlist, setEditingWishlist] = useState<HomeInventoryItem | null>(null)
  const [addingWishlist, setAddingWishlist] = useState(false)
  const [categoryAddDock, setCategoryAddDock] = useState(false)

  const equipmentExpenseMap = useMemo(
    () => expenseByEquipmentId(businessExpenses),
    [businessExpenses]
  )

  const supplyExpenseIds = useMemo(
    () => supplyIdsInExpenses(businessExpenses),
    [businessExpenses]
  )

  const reload = useCallback(async () => {
    const [supplies, equip, expenses] = await Promise.all([
      getSupplies(),
      getEquipment(),
      getBusinessExpenses(),
    ])
    setCatalog(supplies)
    setAllEquipment(equip)
    setEquipment(equip.filter((e) => (e.status ?? 'active') !== 'retired'))
    setBusinessExpenses(expenses)
    setWishlist(getItemsByCategory(loadHomeInventory(), 'wishlist'))
    setLoading(false)
  }, [])

  useEffect(() => {
    setWishlist(getItemsByCategory(loadHomeInventory(), 'wishlist'))
    reload()
  }, [reload])

  useEffect(() => {
    const equipmentId = searchParams.get('equipment')
    if (!equipmentId || loading) return
    const item = allEquipment.find((e) => e.id === equipmentId)
    if (item) {
      setView('equipment')
      setAddingEquipment(false)
      setEditingEquipment(item)
      setEquipmentMode('edit')
    }
    router.replace('/inventory')
  }, [searchParams, loading, allEquipment, router])

  const lowCount = useMemo(() => optimisticCatalog.filter(isLowStock).length, [optimisticCatalog])
  const totalItems = optimisticCatalog.length + equipment.length + wishlist.length

  const openCategory = (key: SectionKey) => {
    setSwipedRowId(null)
    setView(key)
  }

  const openSupplyEdit = (supply: Supply, kind: SupplyKind) => {
    setSwipedRowId(null)
    setAddingSupplyKind(null)
    setEditingSupply(supply)
    setSupplyKind(kind)
    setSupplyMode('edit')
  }

  const openSupplyFromHome = (supply: Supply, section: SectionKey) => {
    const config = SECTION_CONFIG.find((s) => s.key === section)
    if (config?.supplyKind) {
      openSupplyEdit(supply, config.supplyKind)
    }
  }

  const openSupplyAdd = (kind: SupplyKind) => {
    setSwipedRowId(null)
    setEditingSupply(null)
    setAddingSupplyKind(kind)
    setSupplyKind(kind)
    setSupplyMode('add')
  }

  const handleSupplyDelete = async (id: string) => {
    await deleteSupply(id)
    await reload()
    setEditingSupply(null)
    setSwipedRowId(null)
  }

  const handleEquipmentDelete = async (id: string) => {
    await deleteEquipment(id)
    await reload()
    setEditingEquipment(null)
    setSwipedRowId(null)
  }

  const handleWishlistSave = (data: { name: string; notes: string; priceEstimate?: number }) => {
    const items = loadHomeInventory()
    const next = upsertHomeInventoryItem(items, {
      id: editingWishlist?.id,
      name: data.name,
      category: 'wishlist',
      notes: data.notes,
      priceEstimate: data.priceEstimate,
    })
    saveHomeInventory(next)
    setWishlist(getItemsByCategory(next, 'wishlist'))
    setEditingWishlist(null)
    setAddingWishlist(false)
  }

  const handleWishlistDelete = (id: string) => {
    const next = deleteHomeInventoryItem(loadHomeInventory(), id)
    saveHomeInventory(next)
    setWishlist(getItemsByCategory(next, 'wishlist'))
    setEditingWishlist(null)
    setSwipedRowId(null)
  }

  const handleCategoryAdd = () => {
    setSwipedRowId(null)
    const section = SECTION_CONFIG.find((s) => s.key === view)
    if (!section) return
    if (section.isWishlist) {
      setEditingWishlist(null)
      setAddingWishlist(true)
    } else if (section.isEquipment) {
      setEditingEquipment(null)
      setAddingEquipment(true)
      setEquipmentMode('add')
    } else if (section.supplyKind) {
      openSupplyAdd(section.supplyKind)
    }
  }

  const supplySheetOpen = Boolean(editingSupply || addingSupplyKind)
  const equipmentSheetOpen = Boolean(editingEquipment || addingEquipment)
  const wishlistSheetOpen = Boolean(editingWishlist || addingWishlist)

  const currentSection = view !== 'home' ? SECTION_CONFIG.find((s) => s.key === view) : null
  const linkedEquipmentExpense = editingEquipment
    ? equipmentExpenseMap.get(editingEquipment.id) ?? null
    : null

  return (
    <div
      className={`screen page-content body inventory-section${
        view !== 'home' && categoryAddDock ? ' screen--dock-nav' : ''
      }`}
    >
      {view === 'home' ? (
        <InventoryHome
          loading={loading}
          catalog={optimisticCatalog}
          equipment={equipment}
          wishlist={wishlist}
          totalItems={totalItems}
          lowCount={lowCount}
          onOpenCategory={openCategory}
          onOpenSupply={openSupplyFromHome}
        />
      ) : (
        <InventoryCategoryView
          sectionKey={view}
          catalog={optimisticCatalog}
          equipment={equipment}
          equipmentExpenseMap={equipmentExpenseMap}
          supplyExpenseIds={supplyExpenseIds}
          wishlist={wishlist}
          swipedRowId={swipedRowId}
          onSwipedRowChange={setSwipedRowId}
          onBack={() => {
            setSwipedRowId(null)
            setView('home')
          }}
          onAdd={handleCategoryAdd}
          onOpenSupply={(supply) => {
            if (currentSection?.supplyKind) openSupplyEdit(supply, currentSection.supplyKind)
          }}
          onOpenEquipment={(item) => {
            setAddingEquipment(false)
            setEditingEquipment(item)
            setEquipmentMode('edit')
          }}
          onOpenWishlist={(item) => {
            setAddingWishlist(false)
            setEditingWishlist(item)
          }}
          onDeleteSupply={handleSupplyDelete}
          onDeleteEquipment={handleEquipmentDelete}
          onDeleteWishlist={handleWishlistDelete}
          onAddDockChange={setCategoryAddDock}
        />
      )}

      {supplySheetOpen && (
        <SupplyEditSheet
          supply={editingSupply}
          kind={supplyKind}
          mode={supplyMode}
          onModeChange={setSupplyMode}
          onSaveAdd={async (input, options) => {
            const created = await createSupply(input)
            if (options?.logExpense && options.totalPaid && options.totalPaid > 0) {
              await createSupplyPurchase({
                date: options.purchaseDate ?? new Date().toISOString().slice(0, 10),
                name: input.name,
                amount: options.totalPaid,
                quantity: input.quantity_on_hand,
                supply_id: created.id,
                vendor: input.supplier,
              })
            }
            return created
          }}
          onSaveEdit={async (id, input) => {
            const prev = catalog.find((s) => s.id === id)
            const wasLow = prev ? isLowStock(prev) : false
            const updated = await updateSupply(id, input)
            if (updated) {
              setCatalog((items) => items.map((s) => (s.id === id ? updated : s)))
            }
            if (updated && isLowStock(updated) && !wasLow) notifyLowStock(updated.name)
          }}
          onRestock={async (id, quantity, totalCost) => {
            const supply = optimisticCatalog.find((s) => s.id === id)
            addOptimisticCatalog({ type: 'restock', id, quantity })
            try {
              if (totalCost > 0 && supply) {
                await createSupplyPurchase({
                  date: new Date().toISOString().slice(0, 10),
                  name: supply.name,
                  amount: totalCost,
                  quantity,
                  supply_id: id,
                  vendor: supply.supplier,
                })
              } else {
                await restockSupply(id, { quantity, total_cost: totalCost || undefined })
              }
              await reload()
            } catch (e) {
              showMessage(e instanceof Error ? e.message : 'Could not restock supply')
              await reload()
            }
          }}
          onAfterSave={reload}
          onDelete={handleSupplyDelete}
          onClose={() => {
            setEditingSupply(null)
            setAddingSupplyKind(null)
          }}
        />
      )}

      {equipmentSheetOpen && (
        <EquipmentEditSheet
          item={editingEquipment}
          mode={equipmentMode}
          linkedExpense={linkedEquipmentExpense}
          onViewExpense={
            linkedEquipmentExpense
              ? () => setViewingExpense(linkedEquipmentExpense)
              : undefined
          }
          onSaveAdd={async (input, options) => {
            const created = await createEquipment(input)
            if (options?.logExpense && input.purchase_price && input.purchase_price > 0) {
              await createBusinessExpense({
                date: options.purchaseDate ?? input.purchase_date ?? new Date().toISOString().slice(0, 10),
                name: input.name,
                amount: input.purchase_price,
                category: 'equipment',
                vendor: input.supplier,
                notes: input.notes,
                equipment_id: created.id,
              })
            }
            return created
          }}
          onSaveEdit={async (id, input) => {
            const updated = await updateEquipment(id, input)
            if (updated) {
              setAllEquipment((items) => items.map((e) => (e.id === id ? updated : e)))
              setEquipment((items) =>
                (updated.status ?? 'active') !== 'retired'
                  ? items.map((e) => (e.id === id ? updated : e))
                  : items.filter((e) => e.id !== id),
              )
            }
          }}
          onAfterSave={reload}
          onDelete={handleEquipmentDelete}
          onClose={() => {
            setEditingEquipment(null)
            setAddingEquipment(false)
          }}
        />
      )}

      {viewingExpense && (
        <BusinessExpenseSheet
          expense={viewingExpense}
          onClose={() => setViewingExpense(null)}
          onSaved={reload}
          onViewEquipment={
            viewingExpense.equipment_id
              ? () => {
                  const item = allEquipment.find((e) => e.id === viewingExpense.equipment_id)
                  if (item) {
                    setViewingExpense(null)
                    setView('equipment')
                    setAddingEquipment(false)
                    setEditingEquipment(item)
                    setEquipmentMode('edit')
                  }
                }
              : undefined
          }
          linkedEquipmentName={
            viewingExpense.equipment_id
              ? allEquipment.find((e) => e.id === viewingExpense.equipment_id)?.name
              : undefined
          }
        />
      )}

      {wishlistSheetOpen && (
        <InventoryEditSheet
          item={editingWishlist}
          category="wishlist"
          isNew={!editingWishlist}
          onSave={(data) =>
            handleWishlistSave({
              name: data.name,
              notes: data.notes,
              priceEstimate: data.priceEstimate,
            })
          }
          onDelete={() => editingWishlist && handleWishlistDelete(editingWishlist.id)}
          onClose={() => {
            setEditingWishlist(null)
            setAddingWishlist(false)
          }}
        />
      )}
    </div>
  )
}
