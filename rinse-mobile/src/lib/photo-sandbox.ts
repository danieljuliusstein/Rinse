import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'

/** Copy a picked image into app document storage before upload (native only). */
export async function persistPhotoToSandbox(
  sourceUri: string,
  folder: string,
  filename: string
): Promise<string> {
  // Web ImagePicker returns blob:/data: URIs — FileSystem sandbox isn't available.
  if (Platform.OS === 'web' || sourceUri.startsWith('blob:') || sourceUri.startsWith('data:')) {
    return sourceUri
  }

  const root = FileSystem.documentDirectory
  if (!root) return sourceUri

  const dir = `${root}${folder}/`
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  const dest = `${dir}${filename}`
  await FileSystem.copyAsync({ from: sourceUri, to: dest })
  return dest
}
