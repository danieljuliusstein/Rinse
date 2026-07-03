import { NextResponse } from 'next/server'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { createPortalToken, getRequestAppBaseUrl, resolveClientOrgId } from '@/lib/server/portal-tokens'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'

export async function POST(request: Request) {
  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    const body = await request.json()
    const { clientId, scope, jobId, quoteId } = body

    if (!clientId || !scope) {
      return NextResponse.json({ error: 'clientId and scope required' }, { status: 400 })
    }

    const pb = await authenticateServerAdmin()
    const organizationId = await resolveClientOrgId(pb, clientId)
    const premiumDenied = await requirePremiumSubscription(pb, organizationId)
    if (premiumDenied) return premiumDenied

    const result = await createPortalToken({
      clientId,
      scope,
      jobId,
      quoteId,
      appBaseUrl: await getRequestAppBaseUrl(),
    })

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Create failed' },
      { status: 500 }
    )
  }
}
