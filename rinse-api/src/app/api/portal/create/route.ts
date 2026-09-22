import { NextResponse } from 'next/server'
import { createPortalToken, getRequestAppBaseUrl } from '@/lib/server/portal-tokens'
import { parseJsonBody } from '@/lib/server/parse-body'
import { assertOrgAccess, requireUser } from '@/lib/server/route-guard'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'
import { portalCreateBodySchema } from '@/lib/validation/api-schemas'
import { deskCorsOptions, withDeskCors } from '@/lib/server/desk-cors'

export async function OPTIONS(request: Request) {
  return deskCorsOptions(request)
}

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return withDeskCors(auth, request)

  const parsed = await parseJsonBody(request, portalCreateBodySchema)
  if (parsed instanceof NextResponse) return withDeskCors(parsed, request)
  const { clientId, scope, jobId, quoteId } = parsed.data

  const denied = await assertOrgAccess(auth, { clientId, ...(jobId ? { jobId } : {}), ...(quoteId ? { quoteId } : {}) })
  if (denied) return withDeskCors(denied, request)

  const premiumDenied = scope === 'invoice' ? null : await requirePremiumSubscription(auth.pb, auth.organizationId)
  if (premiumDenied) return withDeskCors(premiumDenied, request)

  try {
    const result = await createPortalToken({
      clientId,
      scope,
      jobId,
      quoteId,
      appBaseUrl: await getRequestAppBaseUrl(),
      pb: auth.pb,
    })

    return withDeskCors(NextResponse.json(result), request)
  } catch (e) {
    return withDeskCors(
      NextResponse.json(
        { error: e instanceof Error ? e.message : 'Create failed' },
        { status: 500 },
      ),
      request,
    )
  }
}
