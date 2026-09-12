import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'

/** Write a data URL to cache so React Native FormData can upload it. */
export async function dataUrlToTempFile(
  dataUrl: string,
  filename: string
): Promise<{ uri: string; mimeType: string; filename: string }> {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl)
  if (!match) throw new Error('Invalid image data URL for sync upload')

  const mimeType = match[1] || 'image/jpeg'
  const base64 = match[2]
  const safeName = filename.replace(/[^\w.-]+/g, '_') || 'upload.jpg'
  const uri = `${FileSystem.cacheDirectory ?? ''}sync_${Date.now()}_${safeName}`
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })
  return { uri, mimeType, filename: safeName }
}

export async function fileUriToDataUrl(uri: string, mimeType: string): Promise<string> {
  if (uri.startsWith('data:')) return uri

  if (Platform.OS === 'web' || uri.startsWith('blob:')) {
    const res = await fetch(uri)
    if (!res.ok) throw new Error('Could not read the selected photo')
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new Error('Could not encode photo'))
      }
      reader.onerror = () => reject(new Error('Could not read photo'))
      reader.readAsDataURL(blob)
    })
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  return `data:${mimeType || 'image/jpeg'};base64,${base64}`
}
