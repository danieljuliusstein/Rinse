'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ClientForm from '@/components/ClientForm'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import { getClient } from '@/lib/api'
import type { Client } from '@/lib/types'

export default function EditClientPage() {
  const params = useParams()
  const id = params.id as string
  const [client, setClient] = useState<Client | null | undefined>(undefined)

  useEffect(() => {
    getClient(id).then(setClient)
  }, [id])

  if (client === undefined) {
    return <ScreenLoading variant="detail" />
  }

  if (!client) {
    return <ScreenMessage>Client not found</ScreenMessage>
  }

  return <ClientForm client={client} />
}
