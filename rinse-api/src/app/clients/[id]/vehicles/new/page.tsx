'use client'

import { useParams } from 'next/navigation'
import VehicleForm from '@/components/crm/VehicleForm'

export default function NewVehiclePage() {
  const params = useParams()
  const clientId = params.id as string

  return <VehicleForm clientId={clientId} />
}
