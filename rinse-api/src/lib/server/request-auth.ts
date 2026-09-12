import PocketBase from 'pocketbase'
import { getServerPocketBase } from './pocketbase-admin'

export interface RequestAuthUser {
  pb: PocketBase
  userId: string
  email: string
  organizationId: string
}

export async function authenticateRequestUser(request: Request): Promise<RequestAuthUser | null> {
  const header = request.headers.get('authorization')
  const token = header?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null

  const base = getServerPocketBase()
  if (!base) return null

  const url = process.env.PB_URL ?? process.env.NEXT_PUBLIC_PB_URL
  if (!url) return null

  const pb = new PocketBase(url)
  pb.autoCancellation(false)
  pb.authStore.save(token, null)

  try {
    const auth = await pb.collection('users').authRefresh()
    const record = auth.record as { id?: string; email?: string; organization_id?: string }
    const organizationId = String(record.organization_id ?? '').trim()
    if (!organizationId) return null
    return {
      pb,
      userId: String(record.id),
      email: String(record.email ?? ''),
      organizationId,
    }
  } catch {
    return null
  }
}
