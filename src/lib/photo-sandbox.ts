import * as FileSystem from 'expo-file-system/legacy'

/** Copy a picked image into app document storage before upload. */
export async function persistPhotoToSandbox(
  sourceUri: string,
  folder: string,
  filename: string
): Promise<string> {
  const dir = `${FileSystem.documentDirectory ?? ''}${folder}/`
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  const dest = `${dir}${filename}`
  await FileSystem.copyAsync({ from: sourceUri, to: dest })
  return dest
}
