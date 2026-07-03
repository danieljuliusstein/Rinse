'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import VehicleProfile from '@/components/crm/VehicleProfile'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import { getDamageDocsForVehicle, getVehicle } from '@/lib/api'
import type { DamageRecord, Vehicle } from '@/lib/types'

export default function VehicleProfilePage() {
  const params = useParams()
  const clientId = params.id as string
  const vehicleId = params.vehicleId as string

  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)
  const [damages, setDamages] = useState<DamageRecord[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)

  const reload = useCallback(async () => {
    const [v, d] = await Promise.all([getVehicle(vehicleId), getDamageDocsForVehicle(vehicleId)])
    setVehicle(v)
    setDamages(d)
  }, [vehicleId])

  useEffect(() => {
    void reload()
  }, [reload])

  if (vehicle === undefined) {
    return <ScreenLoading />
  }

  if (!vehicle) {
    return <ScreenMessage>Vehicle not found</ScreenMessage>
  }

  return (
    <VehicleProfile
      clientId={clientId}
      vehicle={vehicle}
      damages={damages}
      sheetOpen={sheetOpen}
      onOpenSheet={() => setSheetOpen(true)}
      onCloseSheet={() => setSheetOpen(false)}
    />
  )
}
