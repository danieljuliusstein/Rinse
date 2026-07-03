'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import JobEdit from '@/components/JobEdit'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import { getJob, getPackages, getSupplies, updateJob } from '@/lib/api'
import type { JobWithRelations, Package, Supply } from '@/lib/types'

export default function JobEditPage() {
  const params = useParams()
  const id = params.id as string
  const [job, setJob] = useState<JobWithRelations | null | undefined>(undefined)
  const [packages, setPackages] = useState<Package[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])

  useEffect(() => {
    Promise.all([getJob(id), getPackages(), getSupplies()]).then(([j, pkgs, sups]) => {
      setJob(j)
      setPackages(pkgs)
      setSupplies(sups)
    })
  }, [id])

  if (job === undefined || packages.length === 0) {
    return <ScreenLoading />
  }

  if (!job) {
    return <ScreenMessage>Job not found</ScreenMessage>
  }

  return (
    <JobEdit
      job={job}
      packages={packages}
      supplies={supplies}
      onSave={async (data) => { await updateJob(id, data) }}
    />
  )
}
