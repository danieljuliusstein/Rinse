'use client'

import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun } from '@phosphor-icons/react'
import { Badge } from '@/components/ui'
import type { WeatherIconKind, WeatherReadinessRow } from '@/lib/weather-risk'

interface WeatherReadinessCardProps {
  rows: WeatherReadinessRow[]
}

function WeatherIcon({ kind }: { kind: WeatherIconKind }) {
  const props = {
    size: 26,
    weight: 'duotone' as const,
    className: 'weather-readiness-row__icon',
    'aria-hidden': true as const,
  }
  switch (kind) {
    case 'rain':
      return <CloudRain {...props} />
    case 'storm':
      return <CloudLightning {...props} />
    case 'snow':
      return <CloudSnow {...props} />
    case 'cloud':
      return <Cloud {...props} />
    case 'sun':
    default:
      return <Sun {...props} />
  }
}

export default function WeatherReadinessCard({ rows }: WeatherReadinessCardProps) {
  if (rows.length === 0) return null

  return (
    <section className="weather-readiness" aria-label="Job readiness">
      <p className="sec">Job readiness</p>
      <ul className="weather-readiness__list">
        {rows.map((row) => {
          if (row.kind === 'good') {
            return (
              <li key={`good-${row.date}`} className="weather-readiness-row">
                <WeatherIcon kind={row.icon} />
                <div className="weather-readiness-row__body">
                  <p className="weather-readiness-row__primary">{row.primary}</p>
                  <p className="weather-readiness-row__secondary">{row.secondary}</p>
                </div>
                <Badge tone="green">{row.statusLabel}</Badge>
              </li>
            )
          }

          const high = row.status === 'high_rain_risk'
          return (
            <li
              key={row.jobId}
              className={`weather-readiness-row weather-readiness-row--risk${high ? ' weather-readiness-row--high' : ''}`}
            >
              <WeatherIcon kind={row.icon} />
              <div className="weather-readiness-row__body">
                <p className="weather-readiness-row__primary">{row.primary}</p>
                <p className="weather-readiness-row__secondary">{row.secondary}</p>
              </div>
              <Badge tone="amber">{row.statusLabel}</Badge>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
