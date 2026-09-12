import { resolveClientOrgId } from './portal-tokens'
import { apiUnauthorized } from './api-auth'
import { isPlatformAdminEmail } from '@/lib/platform-admin'
import { authenticateRequestUser, type RequestAuthUser } from './request-auth'

export async function requireUser(
  request: Request,
): Promise<RequestAuthUser | Response> {
  const user = await authenticateRequestUser(request)
  if (!user) return apiUnauthorized()
  return user
}

export async function requirePlatformAdmin(
  request: Request,
): Promise<RequestAuthUser | Response> {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth
  if (!isPlatformAdminEmail(auth.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return auth
}

/** Returns a 403 Response when the resource is outside the user's org; null when allowed. */
export async function assertOrgAccess(
  user: RequestAuthUser,
  opts: { clientId?: string; organizationId?: string },
): Promise<Response | null> {
  if (opts.organizationId && opts.organizationId !== user.organizationId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (opts.clientId) {
    const clientOrgId = await resolveClientOrgId(user.pb, opts.clientId)
    if (clientOrgId !== user.organizationId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return null
}
