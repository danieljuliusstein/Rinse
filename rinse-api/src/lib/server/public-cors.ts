const DEFAULT_ORIGINS = ['http://localhost:3001', 'http://127.0.0.1:3001']

function allowedOrigins(): string[] {
  const raw = process.env.BOOKING_ALLOWED_ORIGINS?.trim()
  if (!raw) return DEFAULT_ORIGINS
  return raw.split(',').map((o) => o.trim()).filter(Boolean)
}

export function publicCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin')
  const allowed = allowedOrigins()
  const match = origin && allowed.includes(origin) ? origin : allowed[0]
  return {
    'Access-Control-Allow-Origin': match,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export function jsonWithCors(request: Request, body: unknown, status = 200) {
  return Response.json(body, { status, headers: publicCorsHeaders(request) })
}
