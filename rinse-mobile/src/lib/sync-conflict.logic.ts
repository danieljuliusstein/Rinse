/** Pure LWW conflict check — shared by conflict.ts and sync-qa script. */
export function isServerRecordNewer(serverUpdated: string, localUpdated: string): boolean {
  if (!serverUpdated || !localUpdated) return false
  return serverUpdated > localUpdated
}
