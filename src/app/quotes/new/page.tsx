'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import QuoteForm from '@/components/QuoteForm'
import { ScreenLoading } from '@/components/ui'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { getClients, getPackages } from '@/lib/api'
import type { Client, Package, VehicleType } from '@/lib/types'

export default function NewQuotePage() {
  const isLoggedIn = useRequireSignIn()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<Client[] | null>(null)
  const [packages, setPackages] = useState<Package[] | null>(null)

  const initialClientId = searchParams.get('clientId') ?? undefined
  const initialPackageId = searchParams.get('packageId') ?? undefined
  const initialVehicleType = useMemo(() => {
    const v = searchParams.get('vehicleType')
    return v ? (v as VehicleType) : undefined
  }, [searchParams])
  const initialLocationType = useMemo(() => {
    const v = searchParams.get('locationType')
    return v === 'mobile' || v === 'fixed' ? v : undefined
  }, [searchParams])

  useEffect(() => {
    Promise.all([getClients(), getPackages()]).then(([c, p]) => {
      setClients(c)
      setPackages(p)
    })
  }, [])

  if (!isLoggedIn || !clients || !packages) {
    return <ScreenLoading />
  }

  return (
    <QuoteForm
      clients={clients}
      packages={packages}
      initialClientId={initialClientId}
      initialPackageId={initialPackageId}
      initialVehicleType={initialVehicleType}
      initialLocationType={initialLocationType}
    />
  )
}
