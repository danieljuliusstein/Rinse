'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getJobs, getLeads } from '@/lib/api'
import { computeMilestoneState } from '@/lib/milestones/compute'
import type { MilestoneState } from '@/lib/milestones/types'
import { hasUnviewedMilestones, markMilestonesViewed } from '@/lib/milestones/viewed'
import type { JobWithRelations, LeadWithRelations } from '@/lib/types'

interface UseMilestonesOptions {
  jobs?: JobWithRelations[]
  leads?: LeadWithRelations[]
  /** Skip fetching when caller provides all data */
  skipFetch?: boolean
}

export function useMilestones(options: UseMilestonesOptions = {}) {
  const [jobs, setJobs] = useState<JobWithRelations[]>(options.jobs ?? [])
  const [leads, setLeads] = useState<LeadWithRelations[]>(options.leads ?? [])
  const [loading, setLoading] = useState(!options.skipFetch && options.jobs == null)
  const [viewedTick, setViewedTick] = useState(0)

  useEffect(() => {
    if (options.jobs != null) setJobs(options.jobs)
  }, [options.jobs])

  useEffect(() => {
    if (options.leads != null) setLeads(options.leads)
  }, [options.leads])

  useEffect(() => {
    if (options.skipFetch || options.jobs != null) {
      setLoading(false)
      return
    }

    let cancelled = false
    Promise.all([getJobs(), getLeads()])
      .then(([jobList, leadList]) => {
        if (cancelled) return
        setJobs(jobList)
        setLeads(leadList)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [options.jobs, options.leads, options.skipFetch])

  const state: MilestoneState = useMemo(
    () => computeMilestoneState(jobs, leads),
    [jobs, leads]
  )

  const hasUnviewed = useMemo(() => {
    void viewedTick
    return hasUnviewedMilestones(state.milestones)
  }, [state.milestones, viewedTick])

  const markViewed = useCallback(() => {
    markMilestonesViewed()
    setViewedTick((n) => n + 1)
  }, [])

  return {
    ...state,
    loading,
    hasUnviewed,
    markViewed,
  }
}
