import { getPocketBase } from './pocketbase'
import { formatPbError } from './org'
import {
  buildJobPhotos,
  compressJobPhoto,
  isJobPhotoTypeAtLimit,
  jobPhotoLimitMessage,
  type JobPhoto,
  type PhotoMeta,
  type PhotoType,
} from './job-photos'

export type { JobPhoto, PhotoMeta, PhotoType } from './job-photos'
export {
  MAX_JOB_PHOTOS_PER_TYPE,
  JOB_PHOTO_MAX_EDGE_PX,
  JOB_PHOTO_JPEG_QUALITY,
  isJobPhotoTypeAtLimit,
  jobPhotoLimitMessage,
  countJobPhotosByType,
  compressJobPhoto,
} from './job-photos'

import { isTourSessionActive } from './onboarding-tour'

export async function getJobPhotos(jobId: string): Promise<JobPhoto[]> {
  if (jobId.startsWith('tour-') || isTourSessionActive()) {
    return [
      {
        filename: `tour-photo-${jobId}-before.svg`,
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%2318181b"/><text x="50%" y="45%" fill="%23e4e4e7" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">Before: Swirl Marks &amp; Heavy Road Film</text><text x="50%" y="60%" fill="%23a1a1aa" font-family="sans-serif" font-size="13" text-anchor="middle">Pre-detail intake documentation</text></svg>',
        type: 'before',
      },
      {
        filename: `tour-photo-${jobId}-after.svg`,
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23052e16"/><text x="50%" y="45%" fill="%234ade80" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">After: 2-Stage Paint Correction &amp; Ceramic</text><text x="50%" y="60%" fill="%2386efac" font-family="sans-serif" font-size="13" text-anchor="middle">Mirror gloss &amp; 5-year hydrophobic protection</text></svg>',
        type: 'after',
      },
    ]
  }
  const pb = getPocketBase()
  try {
    const record = await pb.collection('jobs').getOne(jobId)
    return await buildJobPhotos(record as unknown as Record<string, unknown>)
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not load photos'))
  }
}

export async function uploadJobPhoto(
  jobId: string,
  file: File,
  type: PhotoType,
): Promise<JobPhoto> {
  const pb = getPocketBase()
  try {
    const record = await pb.collection('jobs').getOne(jobId)
    const existingMeta = Array.isArray(record.photo_meta)
      ? ([...(record.photo_meta as PhotoMeta[])] as PhotoMeta[])
      : []
    const typeCount = existingMeta.filter((m) => m.type === type).length
    if (isJobPhotoTypeAtLimit(typeCount)) {
      throw new Error(jobPhotoLimitMessage(type))
    }

    const compressed = await compressJobPhoto(file)
    const formData = new FormData()
    formData.append('photos+', compressed, compressed.name)

    let updated: Record<string, unknown>
    try {
      updated = (await pb.collection('jobs').update(jobId, formData)) as unknown as Record<
        string,
        unknown
      >
    } catch (err) {
      throw new Error(formatPbError(err, 'Upload failed'))
    }

    const filenames = Array.isArray(updated.photos) ? (updated.photos as string[]) : []
    const newFilename =
      filenames.find((f) => !existingMeta.some((m) => m.filename === f)) ??
      filenames[filenames.length - 1]

    if (!newFilename) {
      throw new Error('Photo upload did not return a filename')
    }

    existingMeta.push({ filename: newFilename, type })
    await pb.collection('jobs').update(jobId, { photo_meta: existingMeta })

    const photos = await getJobPhotos(jobId)
    const row = photos.find((p) => p.filename === newFilename)
    if (!row) {
      throw new Error('Photo uploaded but could not be reloaded')
    }
    return row
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error(formatPbError(err, 'Upload failed'))
  }
}

export async function deleteJobPhoto(jobId: string, filename: string): Promise<void> {
  const pb = getPocketBase()
  try {
    const record = await pb.collection('jobs').getOne(jobId)
    const meta = Array.isArray(record.photo_meta)
      ? (record.photo_meta as PhotoMeta[]).filter((m) => m.filename !== filename)
      : []

    const formData = new FormData()
    formData.append('photos-', filename)
    await pb.collection('jobs').update(jobId, formData)
    await pb.collection('jobs').update(jobId, { photo_meta: meta })
  } catch (err) {
    throw new Error(formatPbError(err, 'Could not delete photo'))
  }
}
