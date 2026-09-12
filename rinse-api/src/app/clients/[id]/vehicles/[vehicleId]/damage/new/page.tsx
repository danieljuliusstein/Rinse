'use client'

import { useParams } from 'next/navigation'
import AddDamageForm from '@/components/crm/damage/AddDamageForm'

export default function AddDamagePage() {
  const params = useParams()
  const clientId = params.id as string
  const vehicleId = params.vehicleId as string

  return <AddDamageForm clientId={clientId} vehicleId={vehicleId} />
}
