'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import JobDetail from '@/components/JobDetail'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import { getJob } from '@/lib/api'
import type { JobWithRelations } from '@/lib/types'

export default function JobDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [job, setJob] = useState<JobWithRelations | null | undefined>(undefined)

  useEffect(() => {
    getJob(id).then(setJob)
  }, [id])

  if (job === undefined) {
    return <ScreenLoading variant="detail" />
  }

  if (!job) {
    return <ScreenMessage>Job not found</ScreenMessage>
  }

  return <JobDetail job={job} />
}
