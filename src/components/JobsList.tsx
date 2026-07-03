'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Car, ClipboardText, MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import AuthEmptyState from '@/components/AuthEmptyState'
import { EmptyState, ListRow, SectionGroup } from '@/components/ui'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  filterJobsList,
  formatJobsDayLabel,
  groupJobsByPeriod,
  groupJobsForDay,
  isValidJobDateParam,
  jobListIconTone,
  jobListRightTime,
  type JobsListFilter,
} from '@/lib/jobs-list-logic'
import type { JobWithRelations } from '@/lib/types'

const FILTER_CHIPS: { key: JobsListFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'recurring', label: 'Recurring' },
]

const VISIBLE_PER_SECTION = 4

const ICON_TONE: Record<string, 'blue' | 'green' | 'amber'> = {
  blue: 'blue',
  green: 'green',
  amber: 'amber',
  gray: 'blue',
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function JobsList({ jobs }: { jobs: JobWithRelations[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusDate = isValidJobDateParam(searchParams.get('date')) ? searchParams.get('date')! : null
  const { isLoggedOut } = useAuthEmptyState()
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState<JobsListFilter>('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => filterJobsList(jobs, search, chip), [jobs, search, chip])
  const sections = useMemo(() => {
    if (focusDate) return groupJobsForDay(filtered, focusDate)
    return groupJobsByPeriod(filtered)
  }, [filtered, focusDate])

  const periodLabel = focusDate
    ? formatJobsDayLabel(focusDate)
    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const handleAddJob = () => {
    if (isLoggedOut) router.push('/auth')
    else router.push(focusDate ? `/jobs/new?date=${focusDate}` : '/jobs/new')
  }

  const clearDayFilter = () => {
    router.push('/jobs')
  }

  return (
    <div className="screen page-content body jobs-screen">
      <header className="page-header">
        <div>
          <h1>{focusDate ? 'Jobs' : 'Jobs'}</h1>
          <p>
            {isLoggedOut
              ? 'Sign in to load jobs'
              : focusDate
                ? `${sections.reduce((n, s) => n + s.jobs.length, 0)} on ${periodLabel}`
                : `${jobs.length} total · ${periodLabel}`}
          </p>
        </div>
        {!isLoggedOut ? (
          <button
            type="button"
            className="icon-btn green"
            aria-label="Add job"
            data-coach="jobs-add"
            onClick={handleAddJob}
          >
            <Plus size={18} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </header>

      {focusDate && !isLoggedOut ? (
        <button type="button" className="chip chip--dismiss" onClick={clearDayFilter}>
          <X size={14} weight="bold" aria-hidden="true" />
          {new Date(`${focusDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          · Clear day filter
        </button>
      ) : null}

      <div className="search premium-search" data-coach="jobs-search">
        <MagnifyingGlass size={16} className="premium-search__icon" aria-hidden="true" />
        <input
          className="premium-search__input"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search jobs"
        />
      </div>

      <div className="chips" data-coach="jobs-filters">
        {FILTER_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`chip${chip === c.key ? ' active' : ''}`}
            onClick={() => setChip(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoggedOut ? (
        <AuthEmptyState
          icon={<ClipboardText size={26} weight="duotone" />}
          title="Sign in to see your jobs"
          subtitle="Your job history and schedule sync after you sign in."
        />
      ) : sections.length === 0 ? (
        <EmptyState
          illustration="jobs"
          title={focusDate ? 'No jobs this day' : 'No jobs found'}
          description={
            focusDate
              ? 'Nothing scheduled for this date. Add a job or pick another day on Home.'
              : 'Schedule your first detail or adjust your filters.'
          }
          actionLabel={focusDate ? 'Add job this day' : 'Add a job'}
          onAction={handleAddJob}
        />
      ) : (
        sections.map((section) => {
          const isExpanded = expanded[section.key]
          const visible = isExpanded ? section.jobs : section.jobs.slice(0, VISIBLE_PER_SECTION)
          const hidden = section.jobs.length - visible.length

          return (
            <SectionGroup key={section.key} title={section.label}>
              {visible.map((job) => (
                <ListRow
                  key={job.id}
                  icon={<Car size={18} weight="duotone" />}
                  iconTone={ICON_TONE[jobListIconTone(job)] ?? 'blue'}
                  title={job.client?.name ?? 'Client'}
                  subtitle={`${job.package?.name ?? 'Detail'} · ${capitalize(job.vehicle_type ?? 'vehicle')}`}
                  badgeStatus={job.invoice?.status === 'overdue' ? 'overdue' : job.status}
                  trailing={
                    <>
                      <CurrencyAmount value={job.revenue} className="ui-list-row__amount" />
                      <span className="ui-list-row__subtitle">{jobListRightTime(job)}</span>
                    </>
                  }
                  onClick={() => router.push(`/jobs/${job.id}`)}
                />
              ))}
              {hidden > 0 ? (
                <button
                  type="button"
                  className="more-pill"
                  onClick={() => setExpanded((e) => ({ ...e, [section.key]: true }))}
                >
                  + {hidden} more
                </button>
              ) : null}
            </SectionGroup>
          )
        })
      )}
    </div>
  )
}
