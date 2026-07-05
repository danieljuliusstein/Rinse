'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getDashboardData,
  getInvoices,
  getJobs,
  getJobsForDate,
  getLeads,
  getPackages,
  getSupplies,
} from '@/lib/api'
import Dashboard from '@/components/Dashboard'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import {
  buildComingUpJobs,
  buildInventoryAlert,
  buildTodayJobCard,
} from '@/lib/home-dashboard'
import { computeMilestoneState, hasUnviewedMilestones } from '@/lib/milestones'
import type { Invoice, JobWithRelations, LeadWithRelations, RecentJobRow, WeekDay } from '@/lib/types'

export default function HomePage() {
  const [ready, setReady] = useState(false)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [todayJobRows, setTodayJobRows] = useState<RecentJobRow[]>([])
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [leads, setLeads] = useState<LeadWithRelations[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [inventoryAlert, setInventoryAlert] = useState<ReturnType<typeof buildInventoryAlert>>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      getDashboardData(),
      getJobs(),
      getLeads(),
      getSupplies(),
      getPackages(),
      getInvoices(),
    ])
      .then(async ([data, allJobs, allLeads, supplyList, packageList, allInvoices]) => {
        if (cancelled) return
        setWeekDays(data.weekDays)
        setJobs(allJobs)
        setLeads(allLeads)
        setInvoices(allInvoices)

        const today = data.weekDays.find((d) => d.isToday)?.date ?? data.weekDays[0]?.date ?? ''
        if (today) {
          const rows = await getJobsForDate(today)
          if (!cancelled) {
            setTodayJobRows(rows)
            const todayJob = buildTodayJobCard(rows)
            setInventoryAlert(buildInventoryAlert(todayJob, supplyList, packageList))
          }
        }

        setReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load dashboard')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const upcomingJobs = useMemo(() => buildComingUpJobs(jobs, 3), [jobs])

  const hasUnviewedMilestone = useMemo(() => {
    const { milestones } = computeMilestoneState(jobs, leads)
    return hasUnviewedMilestones(milestones)
  }, [jobs, leads])

  if (loadError) {
    return (
      <ScreenMessage body role="alert" live="assertive">
        <div style={{ color: 'var(--red)', marginBottom: 12 }}>{loadError}</div>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </ScreenMessage>
    )
  }

  if (!ready) {
    return <ScreenLoading body variant="home" />
  }

  return (
    <Dashboard
      weekDays={weekDays}
      todayJobRows={todayJobRows}
      upcomingJobs={upcomingJobs}
      jobs={jobs}
      leads={leads}
      invoices={invoices}
      inventoryAlert={inventoryAlert}
      hasUnviewedMilestone={hasUnviewedMilestone}
    />
  )
}
