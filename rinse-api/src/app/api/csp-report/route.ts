import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/server/client-ip'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'

/** Accept browser CSP violation reports (Report-Only phase — Wave 5). */
export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limited = await enforceRateLimit(`csp-report:${ip}`, RATE_LIMITS.cspReport, 'csp-report')
  if (limited) return limited

  const contentType = request.headers.get('content-type') ?? ''
  if (
    !contentType.includes('application/json') &&
    !contentType.includes('application/csp-report')
  ) {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
  }

  let report: unknown
  try {
    const text = await request.text()
    if (!text.trim()) {
      return new NextResponse(null, { status: 204 })
    }
    report = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.info(
    JSON.stringify({
      event: 'csp_violation',
      timestamp: new Date().toISOString(),
      ip,
      report,
    }),
  )

  return new NextResponse(null, { status: 204 })
}
