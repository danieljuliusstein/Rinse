import { NextResponse } from 'next/server'
import { extractPocketBaseError, formatAuthApiError } from '@/lib/auth-messages'
import { provisionOrganizationForOAuthUser } from '@/lib/server/signup'
import { authenticateRequestUserLoose } from '@/lib/server/request-auth-loose'
import { rejectOversizedBody } from '@/lib/server/request-body'

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

function withCors(response: NextResponse, request: Request): NextResponse {
  const headers = corsHeaders(request)
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}

export async function POST(request: Request) {
  const headers = corsHeaders(request)

  const tooLarge = rejectOversizedBody(request)
  if (tooLarge) return withCors(tooLarge, request)

  const auth = await authenticateRequestUserLoose(request)
  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers })
  }

  try {
    const body = (await request.json()) as { businessName?: string }
    const result = await provisionOrganizationForOAuthUser({
      userId: auth.userId,
      email: auth.email,
      businessName: body.businessName ? String(body.businessName) : undefined,
    })

    if (result.alreadyProvisioned) {
      return NextResponse.json({ ok: true, alreadyProvisioned: true, slug: result.slug }, { headers })
    }

    // Refresh auth so client picks up organization_id
    const refreshed = await auth.pb.collection('users').authRefresh()
    return NextResponse.json(
      {
        ok: true,
        alreadyProvisioned: false,
        slug: result.slug,
        token: refreshed.token,
        record: refreshed.record,
      },
      { headers },
    )
  } catch (e) {
    const raw = extractPocketBaseError(e, e instanceof Error ? e.message : 'Provisioning failed')
    console.error('[oauth-provision]', raw, e)
    return NextResponse.json({ error: formatAuthApiError(raw) }, { status: 400, headers })
  }
}
