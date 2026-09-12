/** Verify internal API / cron requests */
export function verifyApiSecret(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET ?? process.env.CRON_SECRET
  if (!secret) {
    // Allow unauthenticated in development when no secret is set
    return process.env.NODE_ENV !== 'production'
  }

  const header = request.headers.get('x-api-secret') ?? request.headers.get('x-cron-secret')
  if (header === secret) return true

  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ') && auth.slice(7) === secret) return true

  return false
}

export function apiUnauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
