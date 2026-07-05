import { NextResponse } from 'next/server'
import { buildWeatherReadinessForJobs } from '@/lib/server/weather-forecast'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import type { WeatherJobInput } from '@/lib/weather-risk'

export const runtime = 'nodejs'

function clientKey(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function parseJobs(body: unknown): WeatherJobInput[] | null {
  if (!body || typeof body !== 'object') return null
  const jobs = (body as { jobs?: unknown }).jobs
  if (!Array.isArray(jobs)) return null

  const out: WeatherJobInput[] = []
  for (const item of jobs) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const id = typeof row.id === 'string' ? row.id.trim() : ''
    const date = typeof row.date === 'string' ? row.date.trim() : ''
    const clientName = typeof row.clientName === 'string' ? row.clientName.trim() : ''
    const location_type = row.location_type === 'fixed' ? 'fixed' : 'mobile'
    if (!id || !date || !clientName) continue
    out.push({
      id,
      date,
      clientName,
      location_type,
      start_time: typeof row.start_time === 'string' ? row.start_time : undefined,
      address: typeof row.address === 'string' ? row.address : undefined,
      status: typeof row.status === 'string' ? row.status : undefined,
    })
  }
  return out
}

export async function POST(request: Request) {
  // Rate-limit only — payload is client-supplied addresses (no tenant data read).
  // Auth was blocking local/demo Home when PB_URL is set but the session is local.
  const limited = enforceRateLimit(`weather-readiness:${clientKey(request)}`, RATE_LIMITS.publicRead)
  if (limited) return limited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const jobs = parseJobs(body)
  if (!jobs) {
    return NextResponse.json({ error: 'jobs array required' }, { status: 400 })
  }

  try {
    const result = await buildWeatherReadinessForJobs(jobs)
    return NextResponse.json({ readiness: result })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Weather lookup failed' },
      { status: 500 },
    )
  }
}
