'use client'

import { useEffect, useState } from 'react'
import JobsList from '@/components/JobsList'
import { ScreenLoading } from '@/components/ui'
import { getJobs } from '@/lib/api'
import type { JobWithRelations } from '@/lib/types'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithRelations[] | null>(null)

  useEffect(() => {
    getJobs().then(setJobs)
  }, [])

  if (!jobs) {
    return <ScreenLoading body />
  }

  return <JobsList jobs={jobs} />
}
