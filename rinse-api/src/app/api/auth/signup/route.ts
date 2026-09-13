import { NextResponse } from 'next/server'
import { formatAuthApiError } from '@/lib/auth-messages'
import { isPlatformAdminEmail } from '@/lib/platform-admin'
import { registerOrganization } from '@/lib/server/signup'
import { getClientIp } from '@/lib/server/client-ip'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { rejectOversizedBody } from '@/lib/server/request-body'

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  const ip = getClientIp(request)
  const limited = await enforceRateLimit(`signup:${ip}`, RATE_LIMITS.signup, 'signup')
  if (limited) return limited

  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
      businessName?: string
      slug?: string
    }

    const email = String(body.email ?? '').trim().toLowerCase()
    if (isPlatformAdminEmail(email)) {
      return NextResponse.json(
        { error: 'This email is reserved for platform admin. Sign in at /auth/admin instead.' },
        { status: 400, headers },
      )
    }

    const result = await registerOrganization({
      email,
      password: String(body.password ?? ''),
      businessName: String(body.businessName ?? ''),
      slug: body.slug ? String(body.slug) : undefined,
    })

    return NextResponse.json(
      { ok: true, slug: result.slug, email: result.email, verificationEmailSent: result.verificationEmailSent },
      { headers },
    )
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Signup failed'
    const error = formatAuthApiError(raw)
    const isConfig =
      raw.includes('PocketBase URL not configured') ||
      raw.includes('PocketBase admin not configured')
    return NextResponse.json({ error }, { status: isConfig ? 503 : 400, headers })
  }
}
