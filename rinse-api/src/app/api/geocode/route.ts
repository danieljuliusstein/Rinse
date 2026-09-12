import { NextResponse } from 'next/server'
import { geocodeAddress, suggestAddresses } from '@/lib/server/geocode'

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

type Body = {
  address?: string
  suggest?: boolean
  limit?: number
  /** Business / depot address — fills missing city/state on the query. */
  context?: string
  near?: { lat?: number; lng?: number }
}

/**
 * POST { address, suggest?, limit?, context?, near? }
 * → { lat, lng, display_name, quality }
 * or with suggest:true → { …, suggestions: [...] }
 */
export async function POST(request: Request) {
  const headers = corsHeaders(request)
  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  const address = String(body.address ?? '').trim()
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400, headers })
  }

  const near =
    body.near &&
    Number.isFinite(Number(body.near.lat)) &&
    Number.isFinite(Number(body.near.lng))
      ? { lat: Number(body.near.lat), lng: Number(body.near.lng) }
      : undefined

  const options = {
    context: String(body.context ?? '').trim() || undefined,
    near,
    limit: typeof body.limit === 'number' ? body.limit : undefined,
  }

  try {
    if (body.suggest) {
      const suggestions = await suggestAddresses(address, {
        ...options,
        limit: options.limit ?? 5,
      })
      const first = suggestions[0]
      if (!first) {
        return NextResponse.json(
          { error: 'Could not geocode address — try adding city and state' },
          { status: 422, headers },
        )
      }
      return NextResponse.json(
        {
          lat: first.lat,
          lng: first.lng,
          display_name: first.display_name,
          quality: first.quality,
          suggestions,
        },
        { headers },
      )
    }

    const result = await geocodeAddress(address, options)
    if (!result) {
      return NextResponse.json(
        { error: 'Could not geocode address — try adding city and state' },
        { status: 422, headers },
      )
    }
    return NextResponse.json(result, { headers })
  } catch (e) {
    console.error('[geocode]', e)
    return NextResponse.json({ error: 'Geocode failed' }, { status: 502, headers })
  }
}
