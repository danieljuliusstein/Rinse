'use client'

import { comingUpDetailsLine, type ComingUpJobData } from '@/lib/home-dashboard'

interface ComingUpCardProps {
  job: ComingUpJobData
  onPress: () => void
}

export default function ComingUpCard({ job, onPress }: ComingUpCardProps) {
  return (
    <button type="button" className="upcoming-card" onClick={onPress}>
      <div className="upcoming-date">
        <div className="upcoming-month">{job.monthLabel}</div>
        <div className="upcoming-day">{job.dayLabel}</div>
      </div>
      <div className="upcoming-body">
        <p className="upcoming-name">{job.clientName}</p>
        <p className="upcoming-meta">{comingUpDetailsLine(job)}</p>
      </div>
    </button>
  )
}
