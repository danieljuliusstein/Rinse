'use client'

import { useEffect, useState } from 'react'
import InvoicesNewPicker from '@/components/InvoicesNewPicker'
import { ScreenLoading } from '@/components/ui'
import { getJobs } from '@/lib/api'
import type { JobWithRelations } from '@/lib/types'

export default function InvoicesNewPage() {
  const [jobs, setJobs] = useState<JobWithRelations[] | null>(null)

  useEffect(() => {
    getJobs().then(setJobs)
  }, [])

  if (!jobs) {
    return <ScreenLoading />
  }

  return <InvoicesNewPicker jobs={jobs} />
}
