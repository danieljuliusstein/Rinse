import { getAuthFetchHeaders, getPocketBaseAuthToken } from './pb-auth'
import { loadSettings } from './settings'
import { loadData } from './storage'
import { getCurrentOrganizationId } from './tenant'

export interface LocalExportBundle {
  exported_at: string
  version: 1
  source: 'local'
  data: ReturnType<typeof loadData>
  settings: ReturnType<typeof loadSettings>
}

export function buildLocalExport(): LocalExportBundle {
  return {
    exported_at: new Date().toISOString(),
    version: 1,
    source: 'local',
    data: loadData(),
    settings: loadSettings(),
  }
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function triggerServerBackup(): Promise<{ ok: boolean; error?: string }> {
  if (!getPocketBaseAuthToken()) {
    return { ok: false, error: 'Sign in to download server backup' }
  }

  const organizationId = getCurrentOrganizationId()
  if (!organizationId) {
    return { ok: false, error: 'No organization selected' }
  }

  const endpoint = `/api/backups/trigger?organizationId=${encodeURIComponent(organizationId)}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: getAuthFetchHeaders(),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data.error ?? `Backup failed (${res.status})` }
  }

  const blob = await res.blob()
  const filename =
    res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
    ?? `detailing-backup-${new Date().toISOString().slice(0, 10)}.json`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)

  return { ok: true }
}

export async function runNotificationsCheck(): Promise<{ ok: boolean; error?: string; created?: number }> {
  if (!getPocketBaseAuthToken()) {
    return { ok: false, error: 'Sign in to run notifications' }
  }

  const res = await fetch('/api/cron/notifications', {
    method: 'POST',
    headers: getAuthFetchHeaders(),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.error ?? 'Cron failed' }
  return { ok: true, created: data.created }
}
