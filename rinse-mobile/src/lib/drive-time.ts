import type { JobWithRelations } from '@rinse/core'
import { appApiJson } from '@/src/lib/app-api'
import { loadSettings } from '@/src/lib/settings-store'

export function formatDriveMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  return `${m} min drive`
}

/** Prefer static OSRM estimate; fall back to booking schedule drive pad. */
export async function estimateDriveBetweenStops(
  originAddress: string | undefined,
  destinationAddress: string | undefined,
): Promise<number | null> {
  const origin = originAddress?.trim()
  const destination = destinationAddress?.trim()
  if (!origin || !destination) {
    const settings = await loadSettings()
    const pad = settings.booking_schedule?.drive_time_pad_minutes
    return pad != null && pad > 0 ? pad : null
  }

  try {
    const data = await appApiJson<{ minutes?: number; source?: string }>('/api/drive-time', {
      method: 'POST',
      body: JSON.stringify({ origin, destination }),
    })
    if (typeof data.minutes === 'number' && data.minutes > 0) return data.minutes
  } catch {
    // fall through to pad
  }

  const settings = await loadSettings()
  const pad = settings.booking_schedule?.drive_time_pad_minutes
  return pad != null && pad > 0 ? pad : null
}

export async function driveSubtitlesForDayJobs(
  jobs: JobWithRelations[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (let i = 1; i < jobs.length; i++) {
    const prev = jobs[i - 1]
    const curr = jobs[i]
    const minutes = await estimateDriveBetweenStops(prev.client?.address, curr.client?.address)
    if (minutes != null) out[curr.id] = formatDriveMinutes(minutes)
  }
  return out
}
