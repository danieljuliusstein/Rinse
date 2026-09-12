/** PocketBase returns 404 when a collection is not migrated yet. */
export function isMissingCollectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { status?: number; message?: string; response?: { message?: string } }
  if (e.status === 404) return true
  const msg = `${e.message ?? ''} ${e.response?.message ?? ''}`.toLowerCase()
  return msg.includes('missing collection') || msg.includes('collection context')
}
