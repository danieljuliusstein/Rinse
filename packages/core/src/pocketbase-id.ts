/** PocketBase default record id: 15 lowercase alphanumeric chars. */
const POCKETBASE_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const POCKETBASE_ID_LENGTH = 15

/**
 * Generate a client-side id matching PocketBase's format.
 * Use at record creation time so offline FKs (e.g. job.client_id) never need remapping.
 */
export function generatePocketBaseId(): string {
  const bytes = new Uint8Array(POCKETBASE_ID_LENGTH)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < POCKETBASE_ID_LENGTH; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  let id = ''
  for (let i = 0; i < POCKETBASE_ID_LENGTH; i++) {
    id += POCKETBASE_ID_ALPHABET[bytes[i]! % POCKETBASE_ID_ALPHABET.length]!
  }
  return id
}
