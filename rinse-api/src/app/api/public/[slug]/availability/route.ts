import { getOrganizationBySlug } from '@/lib/server/organization'
import { getAvailabilityForOrg } from '@/lib/server/booking-public'
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

  const url = new URL(request.url)
  const date = url.searchParams.get('date')?.trim() ?? ''
  const packageId = url.searchParams.get('packageId')?.trim() || undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonWithCors(request, { error: 'Invalid date' }, 400, origins)
  }

  try {
    const slots = await getAvailabilityForOrg(org.id, date, packageId)
    return jsonWithCors(request, { date, slots }, 200, origins)
  } catch {
    return jsonWithCors(request, { error: 'Failed to load availability' }, 500, origins)
  }
}
