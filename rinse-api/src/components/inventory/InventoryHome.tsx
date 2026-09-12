'use client'

import {
  CaretRight,
  Flask,
  Package,
  Star,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { SupplyInventoryRow } from '@/components/inventory/InventoryRow'
import {
  SECTION_CONFIG,
  attentionSupplies,
  categoryMeta,
  sectionForSupply,
  type SectionKey,
} from '@/components/inventory/inventory-utils'
import { SectionGroup, InventoryHomeSkeleton } from '@/components/ui'
import type { HomeInventoryItem } from '@/lib/home-inventory'
import type { Equipment, Supply } from '@/lib/types'

const CATEGORY_ICONS: Record<SectionKey, PhosphorIcon> = {
  chemicals: Flask,
  equipment: Wrench,
  supplies: Package,
  wishlist: Star,
}

interface InventoryHomeProps {
  loading: boolean
  catalog: Supply[]
  equipment: Equipment[]
  wishlist: HomeInventoryItem[]
  totalItems: number
  lowCount: number
  onOpenCategory: (key: SectionKey) => void
  onOpenSupply: (supply: Supply, section: SectionKey) => void
}

export default function InventoryHome({
  loading,
  catalog,
  equipment,
  wishlist,
  totalItems,
  lowCount,
  onOpenCategory,
  onOpenSupply,
}: InventoryHomeProps) {
  const attention = attentionSupplies(catalog)

  if (loading) {
    return <InventoryHomeSkeleton />
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>
            {`${totalItems} item${totalItems === 1 ? '' : 's'}`}
            {lowCount > 0 ? ` · ${lowCount} low` : ''}
          </p>
        </div>
      </header>

      <section className="ui-section">
        <div className="ui-section__header">
          <h2 className="ui-section__title">Categories</h2>
        </div>
        <div className="category-grid">
          {SECTION_CONFIG.map((section) => {
            const Icon = CATEGORY_ICONS[section.key]
            const meta = categoryMeta(section.key, catalog, equipment, wishlist)
            const showLowBadge = section.key === 'supplies' && lowCount > 0

            return (
              <button
                key={section.key}
                type="button"
                className="category-grid__cell"
                onClick={() => onOpenCategory(section.key)}
              >
                <div className="category-grid__top">
                  <Icon className="category-grid__icon" size={20} weight="duotone" />
                  {showLowBadge ? (
                    <span className="category-grid__badge">{lowCount} low</span>
                  ) : (
                    <CaretRight className="category-grid__chevron" size={14} weight="bold" />
                  )}
                </div>
                <p className="category-grid__name">{section.title}</p>
                <p className={`category-grid__meta${meta.metaClass ? ` ${meta.metaClass}` : ''}`}>
                  {meta.subtitle}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {attention.length > 0 ? (
        <SectionGroup title="Needs attention" meta={String(attention.length)}>
          {attention.map((supply) => (
            <SupplyInventoryRow
              key={supply.id}
              supply={supply}
              onPress={() => onOpenSupply(supply, sectionForSupply(supply))}
            />
          ))}
        </SectionGroup>
      ) : null}
    </>
  )
}
