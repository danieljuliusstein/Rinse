const DEFAULT_ORIGINS = ['http://localhost:3001', 'http://127.0.0.1:3001']

function allowedOrigins(tenantOrigins: string[] = []): string[] {
  const set = new Set<string>(DEFAULT_ORIGINS)
  const raw = process.env.BOOKING_ALLOWED_ORIGINS?.trim()
  if (raw) {
    for (const o of raw.split(',')) {
      if (o.trim()) set.add(o.trim())
    }
  }
  for (const o of tenantOrigins) {
    if (o?.trim()) set.add(o.trim())
  }
  return Array.from(set)
}

export function publicCorsHeaders(request: Request, tenantOrigins: string[] = []): HeadersInit {
  const origin = request.headers.get('origin')
  const allowed = allowedOrigins(tenantOrigins)
  const match = origin && allowed.includes(origin) ? origin : allowed[0]
  return {
    'Access-Control-Allow-Origin': match,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export function jsonWithCors(
  request: Request,
  body: unknown,
  status = 200,
  tenantOrigins: string[] = [],
) {
  return Response.json(body, { status, headers: publicCorsHeaders(request, tenantOrigins) })
}
