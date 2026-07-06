import { NextResponse } from 'next/server'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { logAuditEvent } from '@/lib/server/audit-log'
import { createPocketBaseBackup, logAdminBackupTrigger } from '@/lib/server/backup'
import { getClientIp } from '@/lib/server/client-ip'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { isPlatformAdminEmail } from '@/lib/platform-admin'

/**
 * Full cross-tenant backup — separate from org-scoped POST /api/backups/trigger.
 *
 * Path A: platform admin JWT (PLATFORM_ADMIN_EMAILS)
 * Path B: INTERNAL_API_SECRET / CRON_SECRET only (CLI/DR — not callable from browser)
 */
export async function POST(request: Request) {
  const hasBearer = Boolean(
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim(),
  )
  const user = await authenticateRequestUser(request)

  if (user) {
    if (!isPlatformAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return runFullBackup('platform_admin_jwt', user.email)
  }

  if (hasBearer) {
    logAuditEvent('auth_failure', {
      route: '/api/admin/backups/trigger',
      ip: getClientIp(request),
    })
  }

  if (!verifyApiSecret(request)) return apiUnauthorized()
  return runFullBackup('internal_api_secret', 'cli')
}

async function runFullBackup(
  authPath: 'platform_admin_jwt' | 'internal_api_secret',
  actor: string,
) {
  try {
    logAdminBackupTrigger({ authPath, actor, scope: 'all' })
    const backup = await createPocketBaseBackup()
    const filename = `detailing-full-backup-${backup.exported_at.slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Backup failed' },
      { status: 500 }
    )
  }
}

/** GET — metadata only; same dual auth as POST */
export async function GET(request: Request) {
  const user = await authenticateRequestUser(request)

  if (user) {
    if (!isPlatformAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (!verifyApiSecret(request)) {
    return apiUnauthorized()
  }

  try {
    const backup = await createPocketBaseBackup()
    const counts = Object.fromEntries(
      Object.entries(backup.collections).map(([k, v]) => [k, v.length])
    )
    return NextResponse.json({
      ok: true,
      scope: 'all',
      exported_at: backup.exported_at,
      counts,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Backup failed' },
      { status: 500 }
    )
  }
}
