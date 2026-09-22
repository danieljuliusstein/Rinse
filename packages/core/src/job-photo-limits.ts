import type { PhotoMeta, PhotoType } from './types'

export const MAX_JOB_PHOTOS_PER_TYPE = 6
export const JOB_PHOTO_MAX_EDGE_PX = 1600
export const JOB_PHOTO_JPEG_QUALITY = 0.82

export function isJobPhotoTypeAtLimit(count: number): boolean {
  return count >= MAX_JOB_PHOTOS_PER_TYPE
}

export function jobPhotoLimitMessage(type: PhotoType): string {
  const label = type === 'before' ? 'before' : 'after'
  return `Maximum ${MAX_JOB_PHOTOS_PER_TYPE} ${label} photos per job. Delete one to add another.`
}

export type JobPhotoCounts = {
  before: number
  after: number
  total: number
}

export function countJobPhotosByType(
  photos: Array<{ type?: PhotoType } | PhotoMeta>,
): JobPhotoCounts {
  let before = 0
  let after = 0
  for (const photo of photos) {
    if (photo.type === 'before') before += 1
    else after += 1
  }
  return { before, after, total: before + after }
}

/** Wave 2C: at least one before and one after for transformation proof. */
export function jobHasBeforeAndAfter(
  photos: Array<{ type?: PhotoType } | PhotoMeta>,
): boolean {
  const counts = countJobPhotosByType(photos)
  return counts.before >= 1 && counts.after >= 1
}

export function jobPhotoCompletenessMessage(counts: JobPhotoCounts): string {
  if (counts.before >= 1 && counts.after >= 1) {
    return `${counts.before} before · ${counts.after} after`
  }
  if (counts.before < 1 && counts.after < 1) {
    return 'Add before & after photos for the transformation PDF'
  }
  if (counts.before < 1) return 'Add at least one before photo'
  return 'Add at least one after photo'
}

/** Pair before/after by index for side-by-side PDF pages. */
export function pairBeforeAfterPhotos<T extends { type: PhotoType }>(
  photos: T[],
): Array<{ before?: T; after?: T }> {
  const befores = photos.filter((p) => p.type === 'before')
  const afters = photos.filter((p) => p.type === 'after')
  const pairs: Array<{ before?: T; after?: T }> = []
  const n = Math.max(befores.length, afters.length)
  for (let i = 0; i < n; i++) {
    pairs.push({ before: befores[i], after: afters[i] })
  }
  return pairs
}

export function transformationPdfMissingMessage(): string {
  return 'Add at least one before and one after photo before downloading the transformation PDF. Open the job photos screen to capture them.'
}
