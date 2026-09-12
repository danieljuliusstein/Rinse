import { NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/server/route-guard'
import { listPlatformEvents, type PlatformEventCategory } from '@/lib/server/platform-events'

export const runtime = 'nodejs'

const CATEGORIES = new Set<PlatformEventCategory>(['product', 'security', 'admin', 'billing'])

export async function GET(request: Request) {
  const auth = await requirePlatformAdmin(request)
  if (auth instanceof Response) return auth

  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 100), 1), 200)
  const type = url.searchParams.get('type')?.trim() || undefined
  const organizationId = url.searchParams.get('organizationId')?.trim() || undefined
  const categoryParam = url.searchParams.get('category')?.trim()
  const category =
    categoryParam && CATEGORIES.has(categoryParam as PlatformEventCategory)
      ? (categoryParam as PlatformEventCategory)
      : undefined

  try {
    const events = await listPlatformEvents({ limit, type, organizationId, category })
    return NextResponse.json({ events })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load events' },
      { status: 500 },
    )
  }
}
