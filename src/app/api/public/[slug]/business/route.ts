import { getOrganizationBySlug } from '@/lib/server/organization'
import { getPublicBusinessInfoForOrg } from '@/lib/server/booking-public'
import { getClientIp } from '@/lib/server/client-ip'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { jsonWithCors, publicCorsHeaders } from '@/lib/server/public-cors'

type Params = { params: Promise<{ slug: string }> }

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: publicCorsHeaders(request) })
}

export async function GET(request: Request, { params }: Params) {
  const ip = getClientIp(request)
  const limited = await enforceRateLimit(`public-read:${ip}`, RATE_LIMITS.publicRead, 'public-read')
  if (limited) {
    return jsonWithCors(request, { error: 'Too many requests' }, 429)
  }

  const { slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) {
    return jsonWithCors(request, { error: 'Not found' }, 404)
  }
  try {
    const business = await getPublicBusinessInfoForOrg(org.id, org.slug)
    return jsonWithCors(request, { business, slug: org.slug })
  } catch {
    return jsonWithCors(request, { error: 'Failed to load business' }, 500)
  }
}
