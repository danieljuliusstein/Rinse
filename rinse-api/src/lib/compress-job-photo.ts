import { JOB_PHOTO_JPEG_QUALITY, JOB_PHOTO_MAX_EDGE_PX } from './job-photo-limits'

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

/** Resize and compress job photos before upload (browser only). */
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
