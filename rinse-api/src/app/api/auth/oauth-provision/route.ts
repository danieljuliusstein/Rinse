import { NextResponse } from 'next/server'
import { provisionOrganizationForOAuthUser } from '@/lib/server/signup'
import { authenticateRequestUserLoose } from '@/lib/server/request-auth-loose'
import { rejectOversizedBody } from '@/lib/server/request-body'

export async function POST(request: Request) {
  const tooLarge = rejectOversizedBody(request)
  if (tooLarge) return tooLarge

  const auth = await authenticateRequestUserLoose(request)
  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { businessName?: string }
    const result = await provisionOrganizationForOAuthUser({
      userId: auth.userId,
      email: auth.email,
      businessName: body.businessName ? String(body.businessName) : undefined,
    })

    if (result.alreadyProvisioned) {
      return NextResponse.json({ ok: true, alreadyProvisioned: true, slug: result.slug })
    }

    // Refresh auth so client picks up organization_id
    const refreshed = await auth.pb.collection('users').authRefresh()
    return NextResponse.json({
      ok: true,
      alreadyProvisioned: false,
      slug: result.slug,
      token: refreshed.token,
      record: refreshed.record,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Provisioning failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
