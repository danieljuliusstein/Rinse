'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import InvoicePreview from '@/components/InvoicePreview'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import { getJob } from '@/lib/api'
import type { JobWithRelations } from '@/lib/types'

export default function InvoicePage() {
  const params = useParams()
  const id = params.id as string
  const [job, setJob] = useState<JobWithRelations | null | undefined>(undefined)

  useEffect(() => {
    getJob(id).then(setJob)
  }, [id])

  if (job === undefined) {
    return <ScreenLoading />
  }

  if (!job) {
    return <ScreenMessage>Job not found</ScreenMessage>
  }

  return <InvoicePreview job={job} />
}
