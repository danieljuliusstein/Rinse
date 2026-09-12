import { NextResponse } from 'next/server'
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

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}

export async function POST(request: Request) {
  const headers = corsHeaders(request)

  const tooLarge = rejectOversizedBody(request)
  if (tooLarge) return tooLarge

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
    const message = e instanceof Error ? e.message : 'Provisioning failed'
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
