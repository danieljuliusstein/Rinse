/** Set when PocketBase has no `leads` collection (migration not run). */
let leadsCollectionMissing = false

export function markLeadsCollectionMissing(): void {
  leadsCollectionMissing = true
}

export function isLeadsCollectionMissing(): boolean {
  return leadsCollectionMissing
}

export function clearLeadsCollectionMissing(): void {
  leadsCollectionMissing = false
}

export const LEADS_MIGRATION_BANNER =
  'Lead pipeline is not set up on PocketBase yet. From the pocketbase folder run: fly deploy && fly ssh console -C "/pb/pocketbase migrate up" — then refresh.'
