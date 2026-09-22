import { getOrganizationBySlug } from '@/lib/server/organization'
import { getPublicBusinessInfoForOrg } from '@/lib/server/booking-public'
import { getClientIp } from '@/lib/server/client-ip'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { jsonWithCors, publicCorsHeaders } from '@/lib/server/public-cors'
import { getAllowedOriginsForSlug } from '@/lib/server/origin-resolver'

type Params = { params: Promise<{ slug: string }> }

export async function OPTIONS(request: Request, { params }: Params) {
  const { slug } = await params
  const origins = await getAllowedOriginsForSlug(slug)
  return new Response(null, { status: 204, headers: publicCorsHeaders(request, origins) })
}

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)
  const origins = org?.allowed_origins ?? []

  const ip = getClientIp(request)
  const limited = await enforceRateLimit(`public-read:${ip}`, RATE_LIMITS.publicRead, 'public-read')
  if (limited) {
    return jsonWithCors(request, { error: 'Too many requests' }, 429, origins)
  }

  if (!org) {
    return jsonWithCors(request, { error: 'Not found' }, 404)
  }
  try {
    const business = await getPublicBusinessInfoForOrg(org.id, org.slug)
    return jsonWithCors(request, { business, slug: org.slug }, 200, origins)
  } catch {
    return jsonWithCors(request, { error: 'Failed to load business' }, 500, origins)
  }
}
