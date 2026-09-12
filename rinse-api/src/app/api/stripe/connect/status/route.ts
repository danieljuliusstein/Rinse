import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { refreshConnectStatus } from '@/lib/server/stripe-connect'
import { isStripeConfigured } from '@/lib/server/stripe'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const auth = await authenticateRequestUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await refreshConnectStatus(auth.organizationId, auth.pb)
    return NextResponse.json(status)
  } catch (e) {
    console.error('[stripe/connect/status]', e)
    const message = e instanceof Error ? e.message : 'Could not load Stripe status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
