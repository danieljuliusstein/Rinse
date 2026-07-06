import { getOrganizationBySlug } from '@/lib/server/organization'
import { createPublicBookingForOrg } from '@/lib/server/booking-public'
import type { PublicBookingInput } from '@/lib/booking-public'
import { getClientIp } from '@/lib/server/client-ip'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { rejectOversizedBody } from '@/lib/server/request-body'
import { jsonWithCors, publicCorsHeaders } from '@/lib/server/public-cors'

type Params = { params: Promise<{ slug: string }> }

const MAX_FIELD = {
  name: 120,
  phone: 32,
  email: 254,
  address: 500,
  notes: 2000,
  vehicleType: 40,
} as const

function clip(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, max)
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 15)
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: publicCorsHeaders(request) })
}

export async function POST(request: Request, { params }: Params) {
  const tooLarge = rejectOversizedBody(request, 16_384)
  if (tooLarge) return tooLarge

  const ip = getClientIp(request)
  const ipLimited = await enforceRateLimit(`booking:ip:${ip}`, RATE_LIMITS.publicBookingIp, 'public-booking')
  if (ipLimited) {
    return jsonWithCors(request, { error: 'Too many booking attempts. Try again later.' }, 429)
  }

  const { slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) {
    return jsonWithCors(request, { error: 'Not found' }, 404)
  }

  try {
    const body = (await request.json()) as Partial<PublicBookingInput>
    const phone = clip(String(body.phone ?? ''), MAX_FIELD.phone) ?? ''
    const name = clip(String(body.name ?? ''), MAX_FIELD.name) ?? ''

    if (!name || !phone) {
      return jsonWithCors(request, { error: 'Name and phone are required' }, 400)
    }

    const phoneKey = normalizePhone(phone)
    if (phoneKey) {
      const phoneLimited = await enforceRateLimit(
        `booking:${org.id}:${phoneKey}`,
        RATE_LIMITS.publicBookingPhone,
        'public-booking-phone',
      )
      if (phoneLimited) {
        return jsonWithCors(request, { error: 'Too many requests for this number. Try again tomorrow.' }, 429)
      }
    }

    const input = {
      packageId: String(body.packageId ?? '').slice(0, 64),
      date: String(body.date ?? '').slice(0, 10),
      startTime: String(body.startTime ?? '').slice(0, 5),
      locationType: body.locationType === 'fixed' ? 'fixed' : 'mobile',
      vehicleType: clip(String(body.vehicleType ?? 'sedan'), MAX_FIELD.vehicleType) ?? 'sedan',
      name,
      phone,
      email: clip(body.email ? String(body.email) : undefined, MAX_FIELD.email),
      address: clip(body.address ? String(body.address) : undefined, MAX_FIELD.address),
      notes: clip(body.notes ? String(body.notes) : undefined, MAX_FIELD.notes),
    } as PublicBookingInput

    const result = await createPublicBookingForOrg(org.id, input)
    return jsonWithCors(request, { ok: true, booking: result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Booking failed'
    const status = message.includes('no longer available') ? 409 : 400
    return jsonWithCors(request, { error: message }, status)
  }
}
