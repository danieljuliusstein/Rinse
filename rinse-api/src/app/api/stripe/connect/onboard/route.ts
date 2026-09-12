import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import {
  buildConnectRedirectUrl,
  ensureConnectAccount,
  refreshConnectStatus,
} from '@/lib/server/stripe-connect'
import { isStripeConfigured } from '@/lib/server/stripe'

export const runtime = 'nodejs'

function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    return e.message
  }
  return 'Could not start Stripe onboarding'
}

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const auth = await authenticateRequestUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await auth.pb.collection('app_settings').getFullList({
      filter: `organization_id = "${auth.organizationId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
      limit: 1,
    })
    const businessName = String(settings[0]?.business_name ?? '').trim()
    const businessEmail = String(settings[0]?.business_email ?? '').trim()
    const connectEmail =
      businessEmail && !businessEmail.endsWith('@example.com') ? businessEmail : auth.email

    const accountId = await ensureConnectAccount(auth.organizationId, connectEmail, businessName, auth.pb)
    const status = await refreshConnectStatus(auth.organizationId, auth.pb)
    const url = await buildConnectRedirectUrl(accountId, request, status)

    return NextResponse.json({ url })
  } catch (e) {
    console.error('[stripe/connect/onboard]', e)
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
