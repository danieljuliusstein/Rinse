'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Car } from '@phosphor-icons/react'
import { ListRow, SectionGroup } from '@/components/ui'
import { useDetailNavigation } from '@/hooks/useDetailNavigation'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import type { JobWithRelations } from '@/lib/types'

interface HomeDayJobsPanelProps {
  date: string
  jobs: JobWithRelations[]
  onClear: () => void
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function HomeDayJobsPanel({ date, jobs, onClear }: HomeDayJobsPanelProps) {
  const router = useRouter()
  const { openJob } = useDetailNavigation()

  const dayJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.date === date)
        .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '')),
    [jobs, date],
  )

  const label = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="home-day-jobs">
      <div className="home-day-jobs__head">
        <h3 className="home-day-jobs__title">{label}</h3>
        <button type="button" className="home-day-jobs__clear" onClick={onClear}>
          Clear
        </button>
      </div>
      {dayJobs.length === 0 ? (
        <p className="form-field-hint" style={{ margin: 0 }}>
          No jobs scheduled —{' '}
          <button type="button" className="btn-link" onClick={() => router.push(`/jobs/new?date=${date}`)}>
            Add one
          </button>
        </p>
      ) : (
        <SectionGroup title={`${dayJobs.length} job${dayJobs.length !== 1 ? 's' : ''}`}>
          {dayJobs.map((job) => (
            <ListRow
              key={job.id}
              morphLayoutId={`job-${job.id}`}
              icon={<Car size={18} weight="duotone" />}
              iconTone="green"
              title={job.client?.name ?? 'Client'}
              subtitle={`${job.package?.name ?? 'Detail'} · ${capitalize(job.vehicle_type ?? 'vehicle')}`}
              badgeStatus={job.status}
              trailing={<CurrencyAmount value={job.revenue} className="ui-list-row__amount" />}
              onClick={() => openJob(job.id)}
            />
          ))}
        </SectionGroup>
      )}
    </div>
  )
}
