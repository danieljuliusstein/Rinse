import { useLocalSearchParams } from 'expo-router'
import type { QuoteFormValues } from '@rinse/core'
import { QuoteCreateForm } from '@/src/components/forms/QuoteCreateForm'

const VEHICLE_TYPES = new Set(['sedan', 'suv', 'truck', 'van', 'boat', 'other'])

export default function QuotesNewScreen() {
  const params = useLocalSearchParams<{
    clientId?: string
    packageId?: string
    vehicleType?: string
    locationType?: string
  }>()

  const initialVehicleType = VEHICLE_TYPES.has(params.vehicleType ?? '')
    ? (params.vehicleType as QuoteFormValues['vehicle_type'])
    : undefined
  const initialLocationType =
    params.locationType === 'mobile' || params.locationType === 'fixed'
      ? params.locationType
      : undefined

  return (
    <QuoteCreateForm
      initialClientId={params.clientId}
      initialPackageId={params.packageId}
      initialVehicleType={initialVehicleType}
      initialLocationType={initialLocationType}
    />
  )
}
