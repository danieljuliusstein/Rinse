import { getPocketBase } from './pocketbase'

export type PhotoType = 'before' | 'after'

export interface PhotoMeta {
  filename: string
  type: PhotoType
}

export interface JobPhoto {
  filename: string
  url: string
  type: PhotoType
}

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

/** Mobile transformation PDF gate — need at least one before and one after. */
export function jobHasBeforeAndAfter(
  photos: Array<{ type?: PhotoType } | PhotoMeta>,
): boolean {
  const counts = countJobPhotosByType(photos)
  return counts.before > 0 && counts.after > 0
}

export function transformationPdfMissingMessage(): string {
  return 'Add at least one before and one after photo before marking this invoice sent.'
}

function scaledDimensions(width: number, height: number, maxEdge: number) {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height }
  }
  const scale = maxEdge / Math.max(width, height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/** Resize and compress job photos before upload (browser). */
export async function compressJobPhoto(file: File): Promise<File> {
  if (typeof document === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
    const { width, height } = scaledDimensions(bitmap.width, bitmap.height, JOB_PHOTO_MAX_EDGE_PX)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', JOB_PHOTO_JPEG_QUALITY)
    })
    if (!blob) return file

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}

export async function buildJobPhotos(record: Record<string, unknown>): Promise<JobPhoto[]> {
  const pb = getPocketBase()
  const filenames = Array.isArray(record.photos) ? (record.photos as string[]) : []
  const meta = Array.isArray(record.photo_meta) ? (record.photo_meta as PhotoMeta[]) : []

  let fileToken: string | undefined
  if (filenames.length > 0) {
    try {
      fileToken = await pb.files.getToken()
    } catch {
      fileToken = undefined
    }
  }

  return filenames.map((filename) => {
    const entry = meta.find((m) => m.filename === filename)
    return {
      filename,
      url: pb.files.getURL(record, filename, fileToken ? { token: fileToken } : undefined),
      type: entry?.type ?? 'after',
    }
  })
}
