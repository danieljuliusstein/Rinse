'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import VehicleForm from '@/components/crm/VehicleForm'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import { getVehicle } from '@/lib/api'
import type { Vehicle } from '@/lib/types'

export default function EditVehiclePage() {
  const params = useParams()
  const clientId = params.id as string
  const vehicleId = params.vehicleId as string
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)

  useEffect(() => {
    getVehicle(vehicleId).then(setVehicle)
  }, [vehicleId])

  if (vehicle === undefined) {
    return <ScreenLoading variant="detail" />
  }

  if (!vehicle) {
    return <ScreenMessage>Vehicle not found</ScreenMessage>
  }

  return <VehicleForm clientId={clientId} vehicle={vehicle} />
}
