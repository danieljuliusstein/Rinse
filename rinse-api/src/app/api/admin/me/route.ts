import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { isPlatformAdminEmail } from '@/lib/platform-admin'

export const runtime = 'nodejs'

/** Whether the signed-in user may access /admin and platform admin APIs. */
export async function GET(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) {
    return NextResponse.json({ admin: false })
  }
  return NextResponse.json({ admin: isPlatformAdminEmail(auth.email) })
}
