'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { buildMonthCalendarDays } from '@/lib/month-revenue'
import type { JobWithRelations } from '@/lib/types'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface HomeMonthCalendarProps {
  jobs: JobWithRelations[]
  viewDate?: Date
}

export default function HomeMonthCalendar({ jobs, viewDate = new Date() }: HomeMonthCalendarProps) {
  const router = useRouter()
  const days = useMemo(() => buildMonthCalendarDays(jobs, viewDate), [jobs, viewDate])
  const monthTitle = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="home-month-cal">
      <div className="home-month-cal__head">
        <h2 className="home-month-cal__title">{monthTitle}</h2>
      </div>
      <div className="home-month-cal__weekdays" aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`} className="home-month-cal__weekday">
            {d}
          </span>
        ))}
      </div>
      <div className="home-month-cal__grid">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`home-month-cal__day${day.isToday ? ' home-month-cal__day--today' : ''}${
              !day.inMonth ? ' home-month-cal__day--muted' : ''
            }${day.jobCount > 0 ? ' home-month-cal__day--has-jobs' : ''}`}
            onClick={() => day.inMonth && router.push(`/jobs?date=${day.date}`)}
            disabled={!day.inMonth}
          >
            <span className="home-month-cal__num">{day.dayNum}</span>
            {day.jobCount > 0 ? <span className="home-month-cal__dot" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
    </div>
  )
}
