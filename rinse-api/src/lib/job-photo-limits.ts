import type { PhotoType } from './types'

/** Max before or after photos stored per job. */
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
