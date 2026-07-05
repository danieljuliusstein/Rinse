'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CaretDown, ListBullets, MagnifyingGlass, Plus, SquaresFour } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import {
  EquipmentInventoryRow,
  SupplyInventoryRow,
  WishlistInventoryRow,
} from '@/components/inventory/InventoryRow'
import { EquipmentProductGrid, SupplyProductGrid } from '@/components/inventory/ProductGrid'
import {
  SECTION_CONFIG,
  defaultViewMode,
  filterBySearch,
  filterSuppliesList,
  groupSupplies,
  visibleItems,
  SUPPLY_FILTER_CHIPS,
  EQUIPMENT_FILTER_CHIPS,
  type CategoryViewMode,
  type SectionKey,
  type SupplyFilterChip,
} from '@/components/inventory/inventory-utils'
import { filterInventoryByExpenseTracking } from '@/lib/inventory-expense-logic'
import SwipeableRow from '@/components/SwipeableRow'
import { ActionDock, Button, EmptyState, SectionGroup } from '@/components/ui'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { filterSuppliesByKind } from '@/lib/supplies-logic'
import type { HomeInventoryItem } from '@/lib/home-inventory'
import type { BusinessExpense, Equipment, Supply } from '@/lib/types'

interface InventoryCategoryViewProps {
  sectionKey: SectionKey
  catalog: Supply[]
  equipment: Equipment[]
  equipmentExpenseMap: Map<string, BusinessExpense>
  supplyExpenseIds: Set<string>
  wishlist: HomeInventoryItem[]
  swipedRowId: string | null
  onSwipedRowChange: (id: string | null) => void
  onBack: () => void
  onAdd: () => void
  onOpenSupply: (supply: Supply) => void
  onOpenEquipment: (item: Equipment) => void
  onOpenWishlist: (item: HomeInventoryItem) => void
  onDeleteSupply: (id: string) => void
  onDeleteEquipment: (id: string) => void
  onDeleteWishlist: (id: string) => void
  onAddDockChange?: (visible: boolean) => void
}

function GroupBlock<T>({
  label,
  items,
  renderRow,
  defaultOpen = true,
}: {
  label: string
  items: T[]
  renderRow: (item: T) => ReactNode
  defaultOpen?: boolean
}) {
  const [collapsed, setCollapsed] = useState(!defaultOpen)
  const [expanded, setExpanded] = useState(false)
  const { visible, hiddenCount } = visibleItems(items, expanded)

  if (items.length === 0) return null

  return (
    <SectionGroup
      title={label}
      meta={String(items.length)}
      action={
        <button
          type="button"
          className={`inventory-group-toggle${collapsed ? ' inventory-group-toggle--collapsed' : ''}`}
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}
        >
          <CaretDown size={14} weight="bold" aria-hidden="true" />
        </button>
      }
    >
      {collapsed ? null : (
        <>
          {visible.map((item) => renderRow(item))}
          {hiddenCount > 0 ? (
            <button
              type="button"
              className={`more-pill${expanded ? ' more-pill--expanded' : ''}`}
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? 'Show less' : `Show ${hiddenCount} more`}
              <CaretDown size={14} weight="bold" aria-hidden="true" />
            </button>
          ) : null}
        </>
      )}
    </SectionGroup>
  )
}

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: CategoryViewMode
  onChange: (mode: CategoryViewMode) => void
}) {
  return (
    <div className="inv-view-toggle">
      <button
        type="button"
        className={`inv-view-toggle__btn${mode === 'grid' ? ' inv-view-toggle__btn--active' : ''}`}
        onClick={() => onChange('grid')}
        aria-label="Grid view"
      >
        <SquaresFour size={16} weight="bold" />
      </button>
      <button
        type="button"
        className={`inv-view-toggle__btn${mode === 'list' ? ' inv-view-toggle__btn--active' : ''}`}
        onClick={() => onChange('list')}
        aria-label="List view"
      >
        <ListBullets size={16} weight="bold" />
      </button>
    </div>
  )
}

export default function InventoryCategoryView({
  sectionKey,
  catalog,
  equipment,
  equipmentExpenseMap,
  supplyExpenseIds,
  wishlist,
  swipedRowId,
  onSwipedRowChange,
  onBack,
  onAdd,
  onOpenSupply,
  onOpenEquipment,
  onOpenWishlist,
  onDeleteSupply,
  onDeleteEquipment,
  onDeleteWishlist,
  onAddDockChange,
}: InventoryCategoryViewProps) {
  const section = SECTION_CONFIG.find((s) => s.key === sectionKey)!
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedSearch(query)
  const [chip, setChip] = useState<SupplyFilterChip>('all')
  const [viewMode, setViewMode] = useState<CategoryViewMode>(() => defaultViewMode(sectionKey))

  useEffect(() => {
    setChip('all')
    setQuery('')
    setViewMode(defaultViewMode(sectionKey))
  }, [sectionKey])

  const supplyItems = useMemo(() => {
    if (!section.supplyKind) return []
    const base = filterSuppliesByKind(catalog, section.supplyKind)
    const filtered = filterSuppliesList(base, debouncedQuery, chip)
    return filterInventoryByExpenseTracking(
      filtered,
      supplyExpenseIds,
      chip === 'not_in_expenses'
    )
  }, [catalog, section.supplyKind, debouncedQuery, chip, supplyExpenseIds])

  const equipmentItems = useMemo(() => {
    const searched = filterBySearch(equipment, debouncedQuery)
    return filterInventoryByExpenseTracking(
      searched,
      new Set(equipmentExpenseMap.keys()),
      chip === 'not_in_expenses'
    )
  }, [equipment, debouncedQuery, chip, equipmentExpenseMap])

  const wishlistItems = useMemo(
    () => filterBySearch(wishlist, debouncedQuery),
    [wishlist, debouncedQuery]
  )

  const { attention, stocked } = useMemo(() => groupSupplies(supplyItems), [supplyItems])

  const showSupplyFilters = Boolean(section.supplyKind)
  const showEquipmentFilters = Boolean(section.isEquipment)
  const showViewToggle = !section.isWishlist
  const isGrid = viewMode === 'grid'
  const filterChips = section.isEquipment ? EQUIPMENT_FILTER_CHIPS : SUPPLY_FILTER_CHIPS
  const showExpenseFilters = showSupplyFilters || showEquipmentFilters
  const hasActiveFilters = debouncedQuery.trim() !== '' || chip !== 'all'
  const listIsEmpty =
    !section.isWishlist &&
    ((section.supplyKind && supplyItems.length === 0) ||
      (section.isEquipment && equipmentItems.length === 0))
  const wishlistFilteredEmpty = section.isWishlist && wishlistItems.length === 0 && debouncedQuery.trim() !== ''
  const wishlistTrueEmpty = section.isWishlist && wishlist.length === 0 && !debouncedQuery.trim()
  const showAddDock = Boolean(
    (section.supplyKind && !listIsEmpty) ||
      (section.isEquipment && !listIsEmpty) ||
      (section.isWishlist && !wishlistTrueEmpty && !wishlistFilteredEmpty)
  )

  useEffect(() => {
    onAddDockChange?.(showAddDock)
    return () => onAddDockChange?.(false)
  }, [showAddDock, onAddDockChange])

  const supplyGrid = (
    <SupplyProductGrid
      supplies={supplyItems}
      onOpen={onOpenSupply}
      kind={section.supplyKind}
      expenseIds={supplyExpenseIds}
    />
  )

  const renderSupplyRow = (item: Supply) => (
    <div key={item.id} className="inventory-swipe-item">
      <SwipeableRow
        rowId={`supply-${item.id}`}
        openRowId={swipedRowId}
        onOpenChange={onSwipedRowChange}
        onEdit={() => onOpenSupply(item)}
        onDelete={() => onDeleteSupply(item.id)}
        deleteConfirmMessage={`Delete "${item.name}" from inventory?`}
      >
        <SupplyInventoryRow
          supply={item}
          onPress={() => onOpenSupply(item)}
          inExpenses={supplyExpenseIds.has(item.id)}
        />
      </SwipeableRow>
    </div>
  )

  return (
    <>
      <header className="page-header page-header--compact inventory-category-header">
        <BackButton onClick={onBack} label="Back to inventory" />
        <div className="page-header__title-block">
          <h1>{section.title}</h1>
        </div>
        {showViewToggle ? <ViewModeToggle mode={viewMode} onChange={setViewMode} /> : null}
      </header>

      <div className="premium-search inventory-search">
        <MagnifyingGlass className="premium-search__icon" size={16} weight="bold" aria-hidden="true" />
        <input
          type="search"
          className="premium-search__input"
          placeholder={`Search ${section.title.toLowerCase()}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Search ${section.title}`}
        />
      </div>

      {showExpenseFilters ? (
        <div className="chips" role="tablist" aria-label={`${section.title} filters`}>
          {filterChips.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={chip === id}
              className={`chip${chip === id ? ' active' : ''}`}
              onClick={() => setChip(id)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {listIsEmpty ? (
        <EmptyState
          illustration="inventory"
          title={
            hasActiveFilters
              ? chip === 'not_in_expenses'
                ? 'All items linked'
                : 'No matches'
              : `No ${section.title.toLowerCase()} yet`
          }
          description={
            hasActiveFilters
              ? chip === 'not_in_expenses'
                ? 'Everything in this category is linked to expenses.'
                : 'No items match your search or filters.'
              : `Add your first ${section.addLabel.toLowerCase()} to start tracking.`
          }
          actionLabel={hasActiveFilters ? undefined : `Add ${section.addLabel}`}
          onAction={hasActiveFilters ? undefined : onAdd}
        />
      ) : null}

      {wishlistTrueEmpty ? (
        <EmptyState
          illustration="inventory"
          title="Wish list is empty"
          description="Track products you want to buy for your setup."
          actionLabel={`Add ${section.addLabel}`}
          onAction={onAdd}
        />
      ) : null}

      {wishlistFilteredEmpty ? (
        <EmptyState
          illustration="inventory"
          title="No matches"
          description="No wish list items match your search."
        />
      ) : null}

      {section.isWishlist && !wishlistTrueEmpty && !wishlistFilteredEmpty ? (
        <SectionGroup title={section.title} meta={String(wishlistItems.length)}>
          {wishlistItems.map((item) => (
            <div key={item.id} className="inventory-swipe-item">
              <SwipeableRow
                rowId={`wishlist-${item.id}`}
                openRowId={swipedRowId}
                onOpenChange={onSwipedRowChange}
                onEdit={() => onOpenWishlist(item)}
                onDelete={() => onDeleteWishlist(item.id)}
                deleteConfirmMessage={`Remove "${item.name}" from your wish list?`}
              >
                <WishlistInventoryRow item={item} onPress={() => onOpenWishlist(item)} />
              </SwipeableRow>
            </div>
          ))}
        </SectionGroup>
      ) : null}

      {section.isEquipment && isGrid && !listIsEmpty ? (
        <EquipmentProductGrid
          items={equipmentItems}
          onOpen={onOpenEquipment}
          expenseMap={equipmentExpenseMap}
        />
      ) : null}

      {section.isEquipment && !isGrid && !listIsEmpty ? (
        <SectionGroup title={section.title} meta={String(equipmentItems.length)}>
          {equipmentItems.map((item) => (
            <div key={item.id} className="inventory-swipe-item">
              <SwipeableRow
                rowId={`equipment-${item.id}`}
                openRowId={swipedRowId}
                onOpenChange={onSwipedRowChange}
                onEdit={() => onOpenEquipment(item)}
                onDelete={() => onDeleteEquipment(item.id)}
                deleteConfirmMessage={`Delete "${item.name}" from equipment?`}
              >
                <EquipmentInventoryRow
                  item={item}
                  onPress={() => onOpenEquipment(item)}
                  inExpenses={equipmentExpenseMap.has(item.id)}
                />
              </SwipeableRow>
            </div>
          ))}
        </SectionGroup>
      ) : null}

      {section.supplyKind && isGrid && !listIsEmpty ? supplyGrid : null}

      {section.supplyKind && !isGrid && !listIsEmpty ? (
        <>
          <GroupBlock label="Needs attention" items={attention} renderRow={renderSupplyRow} />
          <GroupBlock label="Stocked" items={stocked} renderRow={renderSupplyRow} defaultOpen />
        </>
      ) : null}

      {showAddDock ? (
        <ActionDock aboveNav>
          <Button
            variant="primary"
            className="ui-action-dock__btn ui-action-dock__btn--primary"
            onClick={onAdd}
          >
            <Plus size={18} weight="bold" aria-hidden="true" /> Add {section.addLabel}
          </Button>
        </ActionDock>
      ) : null}
    </>
  )
}
