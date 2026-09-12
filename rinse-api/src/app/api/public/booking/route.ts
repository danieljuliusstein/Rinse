import { jsonWithCors, publicCorsHeaders } from '@/lib/server/public-cors'

const GONE = {
  error: 'This endpoint is deprecated. Use /api/public/{slug}/booking instead.',
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: publicCorsHeaders(request) })
}

export async function POST(request: Request) {
  return jsonWithCors(request, GONE, 410)
}
