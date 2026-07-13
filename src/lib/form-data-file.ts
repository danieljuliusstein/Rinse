import { Platform } from 'react-native'

/** Safe filename for damage/job photo uploads — always JPEG-friendly for PocketBase. */
export function photoUploadFilename(uri: string, preferredName?: string | null): string {
  const stamp = Date.now()
  const fromName = preferredName?.trim()
  if (fromName) {
    const cleaned = fromName.replace(/[^\w.-]+/g, '_')
    // HEIC/HEIF from the library is unreliable for FormData → PB; force .jpg name.
    if (/\.(heic|heif)$/i.test(cleaned)) return `photo-${stamp}.jpg`
    if (/\.(jpe?g|png|webp|gif)$/i.test(cleaned)) {
      return cleaned.replace(/\.jpeg$/i, '.jpg')
    }
  }
  const clean = uri.split('?')[0] ?? uri
  const base = clean.split('/').pop() ?? ''
  if (/\.(heic|heif)$/i.test(base)) return `photo-${stamp}.jpg`
  const match = /\.(jpe?g|png|webp|gif)$/i.exec(base)
  const ext = match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg'
  return `photo-${stamp}.${ext}`
}

export function photoMimeType(uri: string, mimeType?: string | null): string {
  const clean = uri.split('?')[0] ?? uri
  // Prefer JPEG when HEIC was re-encoded or named as jpg for upload.
  if (/\.(heic|heif)$/i.test(clean)) return 'image/jpeg'
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'image/jpeg'
  if (mimeType && mimeType.startsWith('image/') && mimeType !== 'image/heic' && mimeType !== 'image/heif') {
    return mimeType
  }
  if (/\.png$/i.test(clean)) return 'image/png'
  if (/\.webp$/i.test(clean)) return 'image/webp'
  if (/\.gif$/i.test(clean)) return 'image/gif'
  return 'image/jpeg'
}

/**
 * Append an image to FormData for PocketBase.
 * Native RN needs `{ uri, name, type }`; web needs a real Blob/File.
 */
export async function appendPhotoToFormData(
  formData: FormData,
  field: string,
  fileUri: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const res = await fetch(fileUri)
    if (!res.ok) throw new Error('Could not read the selected photo')
    const blob = await res.blob()
    const type = blob.type && blob.type !== 'image/heic' && blob.type !== 'image/heif'
      ? blob.type
      : mimeType || 'image/jpeg'
    if (typeof File !== 'undefined') {
      formData.append(field, new File([blob], filename, { type }))
    } else {
      ;(formData as FormData & { append(name: string, value: Blob, fileName?: string): void }).append(
        field,
        blob,
        filename,
      )
    }
    return
  }

  let uri = fileUri
  if (uri.startsWith('/') && !uri.startsWith('file://')) {
    uri = `file://${uri}`
  }

  formData.append(field, {
    uri,
    name: filename,
    type: mimeType || 'image/jpeg',
  } as unknown as Blob)
}
