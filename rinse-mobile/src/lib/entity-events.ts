import { getPocketBase } from './pocketbase'
import { requireOrganizationId } from './org'
import { isOnline } from './network'

export type EntityEvent = {
  id: string
  entity: 'job' | 'invoice'
  entity_id: string
  actor_id?: string
  action: string
  patch?: Record<string, unknown>
  occurred_at: string
}

export async function listEntityEvents(
  entity: 'job' | 'invoice',
  entityId: string,
): Promise<EntityEvent[]> {
  if (!(await isOnline())) return []
  try {
    const pb = getPocketBase()
    if (!pb.authStore.isValid) return []
    const orgId = requireOrganizationId()
    const orgEsc = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const idEsc = entityId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const rows = await pb.collection('entity_events').getFullList({
      filter: `organization_id = "${orgEsc}" && entity = "${entity}" && entity_id = "${idEsc}"`,
      sort: '-occurred_at',
      limit: 50,
    })
    return rows.map((r) => ({
      id: String(r.id),
      entity: String(r.entity) as 'job' | 'invoice',
      entity_id: String(r.entity_id),
      actor_id: r.actor_id ? String(r.actor_id) : undefined,
      action: String(r.action ?? ''),
      patch: (r.patch as Record<string, unknown> | undefined) ?? undefined,
      occurred_at: String(r.occurred_at ?? r.created ?? ''),
    }))
  } catch {
    return []
  }
}

export async function appendEntityEvent(input: {
  entity: 'job' | 'invoice'
  entity_id: string
  action: string
  patch?: Record<string, unknown>
}): Promise<void> {
  if (!(await isOnline())) return
  try {
    const pb = getPocketBase()
    if (!pb.authStore.isValid) return
    const orgId = requireOrganizationId()
    await pb.collection('entity_events').create({
      organization_id: orgId,
      entity: input.entity,
      entity_id: input.entity_id,
      actor_id: pb.authStore.record?.id ? String(pb.authStore.record.id) : '',
      action: input.action,
      patch: input.patch ?? {},
      occurred_at: new Date().toISOString(),
    })
  } catch {
    // audit is best-effort until migration is applied
  }
}
