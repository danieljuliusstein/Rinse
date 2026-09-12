'use client'

import { useMemo } from 'react'
import { RinseDayPicker } from '@/components/ui'
import type { JobWithRelations } from '@/lib/types'
import type { WeatherReadinessResult } from '@/lib/weather-risk'

interface HomeMonthCalendarProps {
  jobs: JobWithRelations[]
  viewDate?: Date
  selectedDate?: string | null
  onSelectDate?: (iso: string | null) => void
  weatherReadiness?: WeatherReadinessResult | null
}

function rainRiskDates(result: WeatherReadinessResult | null | undefined): Set<string> {
  const set = new Set<string>()
  if (!result) return set
  for (const row of result.rows) {
    if (row.kind === 'risk') set.add(row.date)
  }
  return set
}

export default function HomeMonthCalendar({
  jobs,
  viewDate = new Date(),
  selectedDate,
  onSelectDate,
  weatherReadiness,
}: HomeMonthCalendarProps) {
  const jobDates = useMemo(() => {
    const set = new Set<string>()
    for (const job of jobs) {
      set.add(job.date)
    }
    return set
  }, [jobs])

  const rainDates = useMemo(() => rainRiskDates(weatherReadiness), [weatherReadiness])

  const modifiers = useMemo(
    () => ({
      hasJobs: (date: Date) => {
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        return jobDates.has(iso)
      },
      rainRisk: (date: Date) => {
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        return rainDates.has(iso)
      },
    }),
    [jobDates, rainDates],
  )

  return (
    <div className="home-month-cal-picker">
      <RinseDayPicker
        variant="operator"
        framed
        showLegend
        selectedIso={selectedDate ?? undefined}
        onSelectIso={(iso) => onSelectDate?.(iso)}
        defaultMonth={viewDate}
        modifiers={modifiers}
        modifiersClassNames={{
          hasJobs: 'rinse-day-picker__day--has-jobs',
          rainRisk: 'rinse-day-picker__day--rain-risk',
        }}
      />
    </div>
  )
}
