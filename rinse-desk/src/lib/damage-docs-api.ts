import { getPocketBase } from './pocketbase'
import { escapeFilter, formatPbError, orgFilter } from './org'

export type DeskDamageDoc = {
  id: string
  vehicle_id: string
  area: string
  note: string
  date: string
  uploaded_at?: string
  photo_url: string | null
  linked_job_id?: string
}

function damagePhotoUrl(
  record: Record<string, unknown>,
  fileToken?: string,
): string | null {
  const pb = getPocketBase()
  const photo = record.photo
  if (!photo || (Array.isArray(photo) && photo.length === 0)) return null
  const filename = Array.isArray(photo) ? String(photo[0]) : String(photo)
  return pb.files.getURL(record, filename, fileToken ? { token: fileToken } : undefined)
}

function mapDamage(record: Record<string, unknown>, fileToken?: string): DeskDamageDoc {
  return {
    id: String(record.id),
    vehicle_id: String(record.vehicle_id ?? ''),
    area: String(record.area ?? ''),
    note: String(record.note ?? ''),
    date: String(record.date ?? ''),
    uploaded_at: record.uploaded_at
      ? String(record.uploaded_at)
      : record.created
        ? String(record.created)
        : undefined,
    photo_url: damagePhotoUrl(record, fileToken),
    linked_job_id: record.job_id ? String(record.job_id) : undefined,
  }
}

async function listDamageDocs(filter: string): Promise<DeskDamageDoc[]> {
  const pb = getPocketBase()

  // Prefer `-date` (mobile vehicle path). Avoid `-uploaded_at` — Fly schemas often lack it (HTTP 400).
  const sortAttempts: (string | undefined)[] = ['-date', '-created', '-id', undefined]

  // Some envs tenant-scope damage_docs; others only auth. Try with org, then without.
  let orgPrefix: string | null = null
  try {
    orgPrefix = `${orgFilter()} && `
  } catch {
    orgPrefix = null
  }
  const filterAttempts = orgPrefix ? [`${orgPrefix}(${filter})`, filter] : [filter]

  let lastErr: unknown
  for (const f of filterAttempts) {
    for (const sort of sortAttempts) {
      try {
        const records = await pb.collection('damage_docs').getFullList({
          filter: f,
          ...(sort ? { sort } : {}),
        })

        let fileToken: string | undefined
        if (records.length > 0) {
          try {
            fileToken = await pb.files.getToken()
          } catch {
            fileToken = undefined
          }
        }

        return records.map((r) => mapDamage(r as unknown as Record<string, unknown>, fileToken))
      } catch (err) {
        lastErr = err
      }
    }
  }

  throw new Error(formatPbError(lastErr, 'Could not load damage docs'))
}

import { isTourSessionActive } from './onboarding-tour'

/** Damage docs linked to a job (`damage_docs.job_id`) — not job `photos`/`photo_meta`. */
export async function getDamageDocsForJob(jobId: string): Promise<DeskDamageDoc[]> {
  return listDamageDocs(`job_id = "${escapeFilter(jobId)}"`)
}

export async function getDamageDocsForVehicle(vehicleId: string): Promise<DeskDamageDoc[]> {
  if (vehicleId.startsWith('tour-') || isTourSessionActive()) {
    return [
      {
        id: `tour-dam-${vehicleId}-1`,
        vehicle_id: vehicleId,
        area: 'front_left',
        note: 'Micro-scratches along front fender clear coat near headlight. Needs single-stage polish.',
        date: new Date().toISOString().slice(0, 10),
        photo_url: null,
      },
      {
        id: `tour-dam-${vehicleId}-2`,
        vehicle_id: vehicleId,
        area: 'rear_bumper',
        note: 'Luggage scuffs on upper bumper shelf. Recommend ceramic coating protection.',
        date: new Date().toISOString().slice(0, 10),
        photo_url: null,
      },
    ]
  }
  return listDamageDocs(`vehicle_id = "${escapeFilter(vehicleId)}"`)
}
