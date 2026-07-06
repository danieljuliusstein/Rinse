import { NextResponse } from 'next/server'
import {
  CLIENT_PLATFORM_EVENT_TYPES,
  logPlatformEvent,
  type ClientPlatformEventType,
} from '@/lib/server/platform-events'
import { requireUser } from '@/lib/server/route-guard'

export const runtime = 'nodejs'

const ALLOWED = new Set<string>(CLIENT_PLATFORM_EVENT_TYPES)

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  let body: { type?: string; metadata?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const type = String(body.type ?? '').trim()
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 })
  }

  const metadata =
    body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata
      : undefined

  await logPlatformEvent(type as ClientPlatformEventType, {
    organizationId: auth.organizationId,
    actorEmail: auth.email,
    metadata,
  })

  return NextResponse.json({ ok: true })
}
