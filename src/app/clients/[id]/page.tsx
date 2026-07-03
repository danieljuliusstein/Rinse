'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ClientDetail from '@/components/ClientDetail'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import { getClient, getClientJobs, getQuotes, getVehiclesForClient } from '@/lib/api'
import type { Client, JobWithRelations, QuoteWithRelations, Vehicle } from '@/lib/types'

export default function ClientDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [client, setClient] = useState<Client | null | undefined>(undefined)
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])

  useEffect(() => {
    Promise.all([getClient(id), getClientJobs(id), getVehiclesForClient(id), getQuotes()]).then(
      ([c, j, v, allQuotes]) => {
        setClient(c)
        setJobs(j)
        setVehicles(v)
        setQuotes(allQuotes.filter((q) => q.client_id === id))
      }
    )
  }, [id])

  if (client === undefined) {
    return <ScreenLoading />
  }

  if (!client) {
    return <ScreenMessage>Client not found</ScreenMessage>
  }

  const totalRevenue = jobs.reduce((s, j) => s + j.revenue + j.tip, 0)

  return <ClientDetail client={client} jobs={jobs} vehicles={vehicles} quotes={quotes} totalRevenue={totalRevenue} />
}
