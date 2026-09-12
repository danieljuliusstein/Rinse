import { NextResponse } from 'next/server'
import { optimizeTripOrder, type TripWaypoint } from '@/lib/server/route-trip'

export const runtime = 'nodejs'

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}

/**
 * POST {
 *   stops: [{ id, lat, lng }, ...],
 *   depot?: { lat, lng }
 * } → { orderedIds, geometry?: [lng,lat][], duration_minutes?, distance_meters? }
 */
export async function POST(request: Request) {
  const headers = corsHeaders(request)
  let body: {
    stops?: Array<{ id?: string; lat?: number; lng?: number }>
    depot?: { lat?: number; lng?: number } | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  const stops: TripWaypoint[] = []
  for (const s of body.stops ?? []) {
    const id = String(s.id ?? '').trim()
    const lat = Number(s.lat)
    const lng = Number(s.lng)
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'each stop needs id, lat, lng' }, { status: 400, headers })
    }
    stops.push({ id, lat, lng })
  }

  if (stops.length === 0) {
    return NextResponse.json({ error: 'stops required' }, { status: 400, headers })
  }

  let depot: { lat: number; lng: number } | null = null
  if (body.depot && body.depot.lat != null && body.depot.lng != null) {
    const lat = Number(body.depot.lat)
    const lng = Number(body.depot.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'invalid depot' }, { status: 400, headers })
    }
    depot = { lat, lng }
  }

  try {
    const result = await optimizeTripOrder(stops, depot)
    if (!result) {
      return NextResponse.json({ error: 'Could not optimize trip' }, { status: 422, headers })
    }
    return NextResponse.json(result, { headers })
  } catch (e) {
    console.error('[route-trip]', e)
    return NextResponse.json({ error: 'Trip optimize failed' }, { status: 502, headers })
  }
}
