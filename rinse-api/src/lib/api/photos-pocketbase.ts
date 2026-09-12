import { getPocketBase } from '../pocketbase'
import { isJobPhotoTypeAtLimit, jobPhotoLimitMessage } from '../job-photo-limits'
import { pbJobToApp, type PbRecord } from './mappers'
import type { JobPhoto, PhotoMeta, PhotoType } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function photoUrl(record: PbRecord, filename: string): string {
  return pb().files.getURL(record, filename)
}

export async function getJobPhotos(jobId: string): Promise<JobPhoto[]> {
  const record = await pb().collection('jobs').getOne<PbRecord>(jobId)
  const filenames = Array.isArray(record.photos) ? (record.photos as string[]) : []
  const meta = Array.isArray(record.photo_meta) ? (record.photo_meta as PhotoMeta[]) : []

  return filenames.map((filename) => {
    const entry = meta.find((m) => m.filename === filename)
    return {
      filename,
      url: photoUrl(record, filename),
      type: entry?.type ?? 'after',
    }
  })
}

export async function uploadJobPhoto(
  jobId: string,
  file: File,
  type: PhotoType
): Promise<JobPhoto> {
  const record = await pb().collection('jobs').getOne<PbRecord>(jobId)
  const existingMeta = Array.isArray(record.photo_meta) ? [...(record.photo_meta as PhotoMeta[])] : []

  const typeCount = existingMeta.filter((m) => m.type === type).length
  if (isJobPhotoTypeAtLimit(typeCount)) {
    throw new Error(jobPhotoLimitMessage(type))
  }

  const formData = new FormData()
  formData.append('photos+', file)

  const updated = await pb().collection('jobs').update<PbRecord>(jobId, formData)
  const filenames = Array.isArray(updated.photos) ? (updated.photos as string[]) : []
  const newFilename = filenames.find((f) => !existingMeta.some((m) => m.filename === f))
    ?? filenames[filenames.length - 1]

  if (newFilename) {
    existingMeta.push({ filename: newFilename, type })
    await pb().collection('jobs').update(jobId, { photo_meta: existingMeta })
  }

  const final = await pb().collection('jobs').getOne<PbRecord>(jobId)
  const filename = newFilename ?? file.name
  return {
    filename,
    url: photoUrl(final, filename),
    type,
  }
}

export async function deleteJobPhoto(jobId: string, filename: string): Promise<void> {
  const record = await pb().collection('jobs').getOne<PbRecord>(jobId)
  const meta = Array.isArray(record.photo_meta)
    ? (record.photo_meta as PhotoMeta[]).filter((m) => m.filename !== filename)
    : []

  const formData = new FormData()
  formData.append('photos-', filename)

  await pb().collection('jobs').update(jobId, formData)
  await pb().collection('jobs').update(jobId, { photo_meta: meta })
}

export async function getJobPhotoCount(jobId: string): Promise<number> {
  try {
    const record = await pb().collection('jobs').getOne<PbRecord>(jobId)
    return pbJobToApp(record).photo_count
  } catch {
    return 0
  }
}
