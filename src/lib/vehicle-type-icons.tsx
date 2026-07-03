'use client'

import {
  Boat,
  Bus,
  Car,
  DotsThree,
  Jeep,
  Truck,
  type Icon as PhosphorIcon,
  type IconProps,
} from '@phosphor-icons/react'
import type { VehicleType } from '@/lib/types'

export type VehicleTypeOption = {
  id: VehicleType
  label: string
  Icon: PhosphorIcon
}

export const VEHICLE_TYPE_OPTIONS: VehicleTypeOption[] = [
  { id: 'sedan', label: 'Sedan', Icon: Car },
  { id: 'suv', label: 'SUV', Icon: Jeep },
  { id: 'truck', label: 'Truck', Icon: Truck },
  { id: 'van', label: 'Van', Icon: Bus },
  { id: 'boat', label: 'Boat', Icon: Boat },
  { id: 'other', label: 'Other', Icon: DotsThree },
]

export function getVehicleTypeOption(type: VehicleType): VehicleTypeOption {
  return VEHICLE_TYPE_OPTIONS.find((option) => option.id === type) ?? VEHICLE_TYPE_OPTIONS[0]
}

type VehicleTypeIconProps = Omit<IconProps, 'ref'> & {
  type: VehicleType
}

export function VehicleTypeIcon({ type, size = 28, weight = 'duotone', ...props }: VehicleTypeIconProps) {
  const { Icon } = getVehicleTypeOption(type)
  return <Icon size={size} weight={weight} aria-hidden="true" {...props} />
}

type VehicleTypePickerProps = {
  value: VehicleType
  onChange: (type: VehicleType) => void
}

export function VehicleTypePicker({ value, onChange }: VehicleTypePickerProps) {
  return (
    <div className="job-form-vehicle-grid">
      {VEHICLE_TYPE_OPTIONS.map((option) => {
        const active = value === option.id
        const { Icon } = option
        return (
          <button
            key={option.id}
            type="button"
            className={`job-form-vehicle-btn${active ? ' job-form-vehicle-btn--on' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <Icon
              size={24}
              weight={active ? 'fill' : 'regular'}
              color={active ? '#071407' : 'var(--text-muted)'}
              aria-hidden="true"
            />
            <span className="job-form-vehicle-btn__label">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
