import { Alert, Platform } from 'react-native'
import * as Device from 'expo-device'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'

/** Options that produce a local JPEG-friendly file PocketBase can accept. */
const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.85,
  // SDK 57+ defaults to `.current` (keeps HEIC). Automatic restores JPEG re-encode for uploads.
  preferredAssetRepresentationMode:
    ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic,
}

/**
 * Simulator (and some devices) cannot open UIImagePickerController camera —
 * calling launchCameraAsync throws an uncaught native exception and aborts the app.
 */
export async function ensureCameraAvailable(): Promise<boolean> {
  if (!Device.isDevice) {
    Alert.alert(
      'Camera unavailable',
      'This simulator has no camera. Use Choose from library, or test on a physical device.',
    )
    return false
  }
  return true
}

export async function launchCameraSafe(
  options?: ImagePicker.ImagePickerOptions,
): Promise<ImagePicker.ImagePickerResult | null> {
  if (!(await ensureCameraAvailable())) return null

  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) {
    Alert.alert('Camera access needed', 'Enable camera permission in Settings.')
    return null
  }

  return ImagePicker.launchCameraAsync({ ...PICK_OPTIONS, ...options })
}

export async function launchLibrarySafe(
  options?: ImagePicker.ImagePickerOptions,
): Promise<ImagePicker.ImagePickerResult | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) {
    Alert.alert('Photos access needed', 'Enable photo library permission in Settings.')
    return null
  }
  return ImagePicker.launchImageLibraryAsync({ ...PICK_OPTIONS, ...options })
}

/** Normalize picker URI for RN FormData (must be a readable local file). */
export async function prepareLocalPhotoUri(uri: string, destFolder: string, filename: string): Promise<string> {
  if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('data:')) {
    return uri
  }

  const root = FileSystem.documentDirectory
  if (!root) return ensureFileUri(uri)

  const dir = `${root}${destFolder}/`
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  const dest = `${dir}${filename}`

  try {
    const info = await FileSystem.getInfoAsync(uri)
    if (!info.exists) {
      throw new Error('Selected photo is no longer available — try choosing it again.')
    }
    await FileSystem.copyAsync({ from: uri, to: dest })
  } catch (err) {
    // Some picker URIs are already in app cache and copy may race; fall back to original.
    const msg = err instanceof Error ? err.message : String(err)
    if (/no longer available/i.test(msg)) throw err
    const fallbackInfo = await FileSystem.getInfoAsync(uri)
    if (fallbackInfo.exists) return ensureFileUri(uri)
    throw new Error(msg || 'Could not prepare photo for upload')
  }

  const copied = await FileSystem.getInfoAsync(dest)
  if (!copied.exists) {
    throw new Error('Could not save photo for upload')
  }
  return ensureFileUri(dest)
}

function ensureFileUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://')) {
    return uri
  }
  if (uri.startsWith('/')) return `file://${uri}`
  return uri
}
