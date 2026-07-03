'use client'

import type { CSSProperties } from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Package } from '@phosphor-icons/react'
import { Badge } from '@/components/ui'
import {
  monogramColor,
  monogramForName,
  stockBarLevel,
  stockBarPercent,
  supplyQuantityLabel,
} from '@/components/inventory/inventory-utils'
import type { Supply } from '@/lib/types'

interface Props {
  supply: Supply
  onPress: () => void
  FallbackIcon?: PhosphorIcon
  inExpenses?: boolean
}

export default function ProductTile({ supply, onPress, FallbackIcon = Package, inExpenses = false }: Props) {
  const level = stockBarLevel(supply)
  const pct = stockBarPercent(supply)
  const monogramStyle = { '--monogram-bg': monogramColor(supply.name) } as CSSProperties
  const barStyle = { '--bar-fill-pct': `${pct}%` } as CSSProperties

  return (
    <button type="button" className="product-tile" onClick={onPress}>
      <div className="product-tile__media">
        {supply.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={supply.image_url} alt="" className="product-tile__img" loading="lazy" />
        ) : (
          <div className="product-tile__monogram" style={monogramStyle}>
            <FallbackIcon size={24} weight="duotone" color="rgba(255,255,255,0.85)" aria-hidden />
            <span className="product-tile__mono-text">{monogramForName(supply.name)}</span>
          </div>
        )}
        {inExpenses ? (
          <Badge tone="gray" className="product-tile__expense-badge">
            In expenses
          </Badge>
        ) : null}
      </div>
      <div className="product-tile__body">
        <p className="product-tile__name">{supply.name}</p>
        <p className="product-tile__qty">{supplyQuantityLabel(supply)}</p>
        <div className="product-tile__bar-track" aria-hidden>
          <div
            className={`product-tile__bar-fill product-tile__bar-fill--${level}`}
            style={barStyle}
          />
        </div>
      </div>
    </button>
  )
}
