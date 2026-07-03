'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import QuickAddJob from '@/components/QuickAddJob'
import { ScreenLoading } from '@/components/ui'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { createJob, getClient, getClientsWithStats, getPackages } from '@/lib/api'
import { DEFAULT_RETURN_DAYS } from '@/lib/package-cadence'
import type { ClientWithStats, Package } from '@/lib/types'

export default function NewJobPage() {
  const isLoggedIn = useRequireSignIn()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')
  const packageId = searchParams.get('packageId')
  const prefillDate = searchParams.get('date')

  const [packages, setPackages] = useState<Package[]>([])
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [initialClient, setInitialClient] = useState<ClientWithStats | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([getPackages(), getClientsWithStats(), clientId ? getClient(clientId) : Promise.resolve(null)]).then(
      ([pkgs, allClients, prefilled]) => {
        setPackages(pkgs)
        setClients(allClients)
        if (prefilled) {
          const withStats = allClients.find((c) => c.id === prefilled.id)
          setInitialClient(
            withStats ?? {
              ...prefilled,
              totalRevenue: 0,
              jobCount: 0,
              lastJobDate: null,
              firstJobDate: null,
              lastServiceName: null,
              expectedReturnDays: DEFAULT_RETURN_DAYS,
            }
          )
        }
        setReady(true)
      }
    )
  }, [clientId])

  if (!isLoggedIn || !ready) {
    return <ScreenLoading />
  }

  return (
    <QuickAddJob
      packages={packages}
      clients={clients}
      initialClient={initialClient}
      initialPackageId={packageId ?? undefined}
      initialDate={prefillDate ?? undefined}
      onSave={async (data) => {
        const job = await createJob(data)
        return { id: job.id }
      }}
    />
  )
}
