import { pocketBaseLogoFilename } from './business-logo'

/** PocketBase single-file field → filename string. */
export function pocketBasePhotoFilename(photo: unknown): string | undefined {
  return pocketBaseLogoFilename(photo)
}
