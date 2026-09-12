import { NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/server/route-guard'
import { getSignupMetrics } from '@/lib/server/platform-events'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requirePlatformAdmin(request)
  if (auth instanceof Response) return auth

  const url = new URL(request.url)
  const days = Number(url.searchParams.get('days') ?? 30)

  try {
    const metrics = await getSignupMetrics(days)
    return NextResponse.json(metrics)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load signup metrics' },
      { status: 500 },
    )
  }
}
