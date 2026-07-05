'use client'

import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, WarningCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui'
import type { WeatherIconKind, WeatherReadinessResult, WeatherReadinessRow } from '@/lib/weather-risk'
import {
  WEATHER_READINESS_EMPTY_MESSAGE,
  WEATHER_READINESS_UNRESOLVED_MESSAGE,
  weatherReadinessPartialNote,
} from '@/lib/weather-risk'

interface WeatherReadinessCardProps {
  result: WeatherReadinessResult
  /** Skip row entrance when showing cached data (avoids flash on revisit). */
  skipEnterAnimation?: boolean
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

function ForecastRows({ rows }: { rows: WeatherReadinessRow[] }) {
  return (
    <>
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
    </>
  )
}

export default function WeatherReadinessCard({
  result,
  skipEnterAnimation = false,
}: WeatherReadinessCardProps) {
  return (
    <section
      className={`weather-readiness${skipEnterAnimation ? ' weather-readiness--settled' : ''}`}
      aria-label="Job readiness"
    >
      <p className="sec">Job readiness</p>
      <ul className="weather-readiness__list">
        {result.status === 'no_jobs' ? (
          <li className="weather-readiness-row">
            <Sun size={26} weight="duotone" className="weather-readiness-row__icon" aria-hidden />
            <div className="weather-readiness-row__body">
              <p className="weather-readiness-row__primary">{WEATHER_READINESS_EMPTY_MESSAGE}</p>
            </div>
          </li>
        ) : null}

        {result.status === 'unresolved' ? (
          <li className="weather-readiness-row weather-readiness-row--unresolved">
            <WarningCircle size={26} weight="duotone" className="weather-readiness-row__icon" aria-hidden />
            <div className="weather-readiness-row__body">
              <p className="weather-readiness-row__primary">{WEATHER_READINESS_UNRESOLVED_MESSAGE}</p>
            </div>
          </li>
        ) : null}

        {result.status === 'ready' || result.status === 'partial' ? (
          <ForecastRows rows={result.rows} />
        ) : null}

        {result.status === 'partial' && result.unresolvedCount ? (
          <li className="weather-readiness-row weather-readiness-row--note">
            <div className="weather-readiness-row__body">
              <p className="weather-readiness-row__secondary">{weatherReadinessPartialNote(result.unresolvedCount)}</p>
            </div>
          </li>
        ) : null}
      </ul>
    </section>
  )
}
