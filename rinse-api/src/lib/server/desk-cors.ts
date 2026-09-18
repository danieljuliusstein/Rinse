import { NextResponse } from 'next/server'

/**
 * CORS for Desk SPA (Vite) calling rinse-api with PocketBase Bearer.
 * Mirrors oauth-provision: reflect request Origin so desk.rinsehq.com / localhost work.
 */
export function deskCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

export function withDeskCors(response: Response, request: Request): NextResponse {
  const next = response instanceof NextResponse ? response : new NextResponse(response.body, response)
  const headers = deskCorsHeaders(request)
  for (const [key, value] of Object.entries(headers)) {
    next.headers.set(key, value)
  }
  return next
}

export function deskCorsOptions(request: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: deskCorsHeaders(request) })
}
