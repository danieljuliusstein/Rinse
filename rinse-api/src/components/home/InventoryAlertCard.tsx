'use client'

import { CaretRight, WarningCircle } from '@phosphor-icons/react'
import type { InventoryAlertData } from '@/lib/home-dashboard'

interface InventoryAlertCardProps {
  alert: InventoryAlertData
  onPress: () => void
}

export default function InventoryAlertCard({ alert, onPress }: InventoryAlertCardProps) {
  return (
    <button
      type="button"
      className={`inventory-alert-card${alert.variant === 'warning' ? ' inventory-alert-card--warning' : ''}`}
      onClick={onPress}
    >
      <WarningCircle className="inventory-alert-card__icon" size={16} weight="fill" />
      <div className="inventory-alert-card__body">
        <p className="inventory-alert-card__title">{alert.title}</p>
        <p className="inventory-alert-card__subtitle">{alert.subtitle}</p>
      </div>
      <CaretRight className="inventory-alert-card__chevron" size={16} weight="bold" />
    </button>
  )
}
