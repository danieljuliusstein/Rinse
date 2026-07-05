import { NextResponse } from 'next/server'
import { buildWeatherReadinessForJobs } from '@/lib/server/weather-forecast'
import {
  loadBusinessAddressForOrg,
  loadUpcomingWeatherJobsForOrg,
  pbJobsToWeatherInputs,
} from '@/lib/server/weather-readiness-jobs'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { isoDate } from '@/lib/weather-risk'

export const runtime = 'nodejs'

function clientKey(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function parseToday(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const today = (body as { today?: unknown }).today
  if (typeof today !== 'string') return undefined
  const trimmed = today.trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined
}

export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = enforceRateLimit(
    `weather-readiness:${auth.userId}:${clientKey(request)}`,
    RATE_LIMITS.publicRead,
  )
  if (limited) return limited

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // Empty body is fine — today defaults to server date below.
  }

  const today = parseToday(body) ?? isoDate(new Date())

  try {
    const [jobRecords, businessAddress] = await Promise.all([
      loadUpcomingWeatherJobsForOrg(auth.pb, auth.organizationId, today),
      loadBusinessAddressForOrg(auth.pb, auth.organizationId),
    ])

    const jobs = pbJobsToWeatherInputs(jobRecords, businessAddress)
    const readiness = await buildWeatherReadinessForJobs(jobs, today)

    if (readiness.status === 'unresolved') {
      console.warn('[weather-readiness] all qualifying jobs unresolved', {
        organizationId: auth.organizationId,
        today,
        qualifyingCount: readiness.unresolvedCount ?? 0,
      })
    } else if (readiness.status === 'partial') {
      console.warn('[weather-readiness] partial forecast resolution', {
        organizationId: auth.organizationId,
        today,
        unresolvedCount: readiness.unresolvedCount,
        resolvedRows: readiness.rows.length,
      })
    }

    return NextResponse.json({ readiness })
  } catch (e) {
    console.error('[weather-readiness] lookup failed', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Weather lookup failed' },
      { status: 500 },
    )
  }
}
