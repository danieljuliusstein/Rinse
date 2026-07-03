'use client'

import { useRouter } from 'next/navigation'
import { PencilSimple } from '@phosphor-icons/react'
import { VehicleTypeIcon } from '@/lib/vehicle-type-icons'
import BackButton from '@/components/BackButton'
import DamageSection from '@/components/crm/damage/DamageSection'
import { ListRow, SectionGroup } from '@/components/ui'
import { pendingDamagePhotoKey, vehicleDisplayName } from '@/lib/damage-docs'
import { normalizeVehicleColorHex, vehicleIconColorOnPaint } from '@/lib/vehicle-color'
import type { CSSProperties } from 'react'
import type { DamageRecord, Vehicle } from '@/lib/types'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function capitalizeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

interface VehicleProfileProps {
  clientId: string
  vehicle: Vehicle
  damages: DamageRecord[]
  sheetOpen: boolean
  onOpenSheet: () => void
  onCloseSheet: () => void
}

export default function VehicleProfile({
  clientId,
  vehicle,
  damages,
  sheetOpen,
  onOpenSheet,
  onCloseSheet,
}: VehicleProfileProps) {
  const router = useRouter()
  const title = vehicleDisplayName(vehicle)
  const paintHex = normalizeVehicleColorHex(vehicle.color_hex)
  const paintStyle = paintHex
    ? ({ '--vehicle-paint': paintHex } as CSSProperties)
    : undefined

  const handlePhotoSelected = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file)
    sessionStorage.setItem(pendingDamagePhotoKey(vehicle.id), dataUrl)
    onCloseSheet()
    router.push(`/clients/${clientId}/vehicles/${vehicle.id}/damage/new`)
  }

  const colorTrailing =
    paintHex || vehicle.color ? (
      <span className="vehicle-color-value">
        {paintHex ? (
          <span
            className="color-swatch"
            style={{ '--swatch-fill': paintHex } as CSSProperties}
            aria-hidden="true"
          />
        ) : null}
        {vehicle.color || '—'}
      </span>
    ) : (
      '—'
    )

  return (
    <div className="screen page-content body">
      <header className="page-header page-header--compact crm-page-header">
        <BackButton onClick={() => router.push(`/clients/${clientId}`)} />
        <div className="page-header__title-block">
          <div>
            <h1>{title}</h1>
            {vehicle.plate ? <p>{vehicle.plate}</p> : null}
          </div>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Edit vehicle"
          onClick={() => router.push(`/clients/${clientId}/vehicles/${vehicle.id}/edit`)}
        >
          <PencilSimple size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <div className="vehicle-hero job-form-section">
        <div
          className={`vehicle-hero__icon-wrap${paintHex ? ' vehicle-hero__icon-wrap--paint' : ''}`}
          style={paintStyle}
        >
          <VehicleTypeIcon
            type={vehicle.type}
            size={28}
            weight="duotone"
            color={vehicleIconColorOnPaint(vehicle.color_hex)}
          />
        </div>
      </div>

      <SectionGroup title="Vehicle details">
        <ListRow title="Plate" trailing={vehicle.plate || '—'} />
        <ListRow title="Type" trailing={capitalizeType(vehicle.type)} />
        <ListRow title="Color" trailing={colorTrailing} />
        <ListRow title="VIN" trailing={vehicle.vin || '—'} />
      </SectionGroup>

      <DamageSection
        damages={damages}
        sheetOpen={sheetOpen}
        onOpenSheet={onOpenSheet}
        onCloseSheet={onCloseSheet}
        onPhotoSelected={handlePhotoSelected}
        onOpenDamage={(damageId) =>
          router.push(`/clients/${clientId}/vehicles/${vehicle.id}/damage/${damageId}`)
        }
      />
    </div>
  )
}
