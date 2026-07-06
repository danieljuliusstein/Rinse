import { NextResponse } from 'next/server'
import { createPortalToken, getRequestAppBaseUrl } from '@/lib/server/portal-tokens'
import { parseJsonBody } from '@/lib/server/parse-body'
import { assertOrgAccess, requireUser } from '@/lib/server/route-guard'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'
import { portalCreateBodySchema } from '@/lib/validation/api-schemas'

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const parsed = await parseJsonBody(request, portalCreateBodySchema)
  if (parsed instanceof NextResponse) return parsed
  const { clientId, scope, jobId, quoteId } = parsed.data

  const denied = await assertOrgAccess(auth, { clientId })
  if (denied) return denied

  const premiumDenied = await requirePremiumSubscription(auth.pb, auth.organizationId)
  if (premiumDenied) return premiumDenied

  try {
    const result = await createPortalToken({
      clientId,
      scope,
      jobId,
      quoteId,
      appBaseUrl: await getRequestAppBaseUrl(),
      pb: auth.pb,
    })

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Create failed' },
      { status: 500 }
    )
  }
}
