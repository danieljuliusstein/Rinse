import {
  INVENTORY_PHOTO_JPEG_QUALITY,
  INVENTORY_PHOTO_MAX_BYTES,
  INVENTORY_PHOTO_MAX_EDGE_PX,
} from './inventory-photo-limits'

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

async function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  baseName: string,
  quality: number,
): Promise<File | null> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
  if (!blob) return null
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

/** Resize and compress inventory photos before upload (browser only). */
export async function compressInventoryPhoto(file: File): Promise<File> {
  if (typeof document === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
    const { width, height } = scaledDimensions(
      bitmap.width,
      bitmap.height,
      INVENTORY_PHOTO_MAX_EDGE_PX,
    )

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'product'
    let quality = INVENTORY_PHOTO_JPEG_QUALITY
    let result = await canvasToJpegFile(canvas, baseName, quality)

    while (result && result.size > INVENTORY_PHOTO_MAX_BYTES && quality > 0.45) {
      quality -= 0.08
      result = await canvasToJpegFile(canvas, baseName, quality)
    }

    return result ?? file
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}
