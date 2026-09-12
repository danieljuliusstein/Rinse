import { NextResponse } from 'next/server'
import { removePushSubscription, savePushSubscription } from '@/lib/server/push'
import type { PushSubscriptionJSON } from '@/lib/server/push'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { rejectOversizedBody } from '@/lib/server/request-body'

export async function POST(request: Request) {
  const tooLarge = rejectOversizedBody(request)
  if (tooLarge) return tooLarge

  const auth = await authenticateRequestUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = await enforceRateLimit(`push:${auth.userId}`, RATE_LIMITS.pushSubscribe, 'push-subscribe')
  if (limited) return limited

  try {
    const body = await request.json()
    const subscription = body.subscription as PushSubscriptionJSON | undefined

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    await savePushSubscription(subscription, auth.organizationId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Subscribe failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const endpoint = body.endpoint as string | undefined
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    }

    await removePushSubscription(endpoint, auth.organizationId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unsubscribe failed' },
      { status: 500 }
    )
  }
}
