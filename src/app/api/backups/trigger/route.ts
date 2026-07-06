import { NextResponse } from 'next/server'
import { createPocketBaseBackup } from '@/lib/server/backup'
import { parseSearchParams } from '@/lib/server/parse-body'
import { assertOrgAccess, requireUser } from '@/lib/server/route-guard'
import { backupOrgQuerySchema } from '@/lib/validation/api-schemas'

async function handleBackup(request: Request, download: boolean) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const parsed = parseSearchParams(request, backupOrgQuerySchema)
  if (parsed instanceof NextResponse) return parsed
  const { organizationId } = parsed.data

  const denied = await assertOrgAccess(auth, { organizationId })
  if (denied) return denied

  try {
    const backup = await createPocketBaseBackup(organizationId, auth.pb)

    if (!download) {
      const counts = Object.fromEntries(
        Object.entries(backup.collections).map(([k, v]) => [k, v.length])
      )
      return NextResponse.json({
        ok: true,
        exported_at: backup.exported_at,
        counts,
      })
    }

    const filename = `detailing-backup-${backup.exported_at.slice(0, 10)}.json`
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

export async function POST(request: Request) {
  return handleBackup(request, true)
}

/** GET returns backup metadata without download (health check) */
export async function GET(request: Request) {
  return handleBackup(request, false)
}
