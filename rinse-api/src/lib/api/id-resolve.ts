import { isDemoJobId } from '../demo-data'
import { getPocketBase } from '../pocketbase'
import { scopedStorageKey } from '../tenant'
import { loadData } from '../storage'
import { escapeFilterValue } from './mappers'
import * as pb from './pocketbase'

const ID_MAP_KEY = 'detailing_pb_id_map_v1'

type IdKind = 'job' | 'client' | 'package' | 'supply' | 'invoice'

function mapKey(kind: IdKind, localId: string): string {
  return `${kind}:${localId}`
}

export function loadIdMap(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(scopedStorageKey(ID_MAP_KEY)) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function saveIdMapEntry(localId: string, pbId: string, kind: IdKind): void {
  if (typeof window === 'undefined') return
  const map = loadIdMap()
  map[mapKey(kind, localId)] = pbId
  localStorage.setItem(scopedStorageKey(ID_MAP_KEY), JSON.stringify(map))
}

export function lookupIdMap(localId: string, kind: IdKind): string | undefined {
  return loadIdMap()[mapKey(kind, localId)]
}

async function pbRecordExists(collection: string, id: string): Promise<boolean> {
  const client = getPocketBase()
  if (!client?.authStore.isValid) return false
  try {
    await client.collection(collection).getOne(id)
    return true
  } catch {
    return false
  }
}

export async function resolvePackageId(id: string): Promise<string> {
  const mapped = lookupIdMap(id, 'package')
  if (mapped) return mapped
  if (await pbRecordExists('packages', id)) return id

  const local = loadData()
  const pkg = local.packages.find((p) => p.id === id)
  if (!pkg) throw new Error(`Unknown package: ${id}`)

  const pbPackages = await pb.getAllPackages()
  const match = pbPackages.find((p) => p.name.toLowerCase() === pkg.name.toLowerCase())
  if (!match) throw new Error(`Package not found on server: ${pkg.name}`)

  saveIdMapEntry(id, match.id, 'package')
  return match.id
}

export async function resolveClientId(id: string): Promise<string> {
  const mapped = lookupIdMap(id, 'client')
  if (mapped) return mapped
  if (await pbRecordExists('clients', id)) return id

  const local = loadData()
  const client = local.clients.find((c) => c.id === id)
  if (!client) throw new Error(`Unknown client: ${id}`)

  const pbClient = await pb.findOrCreateClient(client.name, null)
  saveIdMapEntry(id, pbClient.id, 'client')
  return pbClient.id
}

export async function resolveJobId(id: string): Promise<string> {
  if (isDemoJobId(id)) throw new Error(`Unknown job: ${id}`)

  const mapped = lookupIdMap(id, 'job')
  if (mapped) return mapped
  if (await pbRecordExists('jobs', id)) return id

  const local = loadData()
  const job = local.jobs.find((j) => j.id === id)
  if (!job) throw new Error(`Unknown job: ${id}`)

  const clientId = await resolveClientId(job.client_id)
  const escapedClient = escapeFilterValue(clientId)
  const escapedDate = escapeFilterValue(job.date)

  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')

  const matches = await client.collection('jobs').getFullList({
    filter: `client_id = "${escapedClient}" && date = "${escapedDate}"`,
    limit: 1,
  })

  if (matches.length > 0) {
    saveIdMapEntry(id, matches[0].id, 'job')
    return matches[0].id
  }

  throw new Error(`Job not found on server (${job.date})`)
}

export async function resolveInvoiceId(id: string): Promise<string> {
  const mapped = lookupIdMap(id, 'invoice')
  if (mapped) return mapped
  if (await pbRecordExists('invoices', id)) return id
  throw new Error(`Unknown invoice: ${id}`)
}

/** Preload persisted mappings into sync IdMaps */
export function preloadIdMaps(maps: {
  jobs: Map<string, string>
  supplies: Map<string, string>
  invoices: Map<string, string>
}): void {
  const stored = loadIdMap()
  for (const [key, pbId] of Object.entries(stored)) {
    const [kind, localId] = key.split(':')
    if (!localId) continue
    if (kind === 'job') maps.jobs.set(localId, pbId)
    if (kind === 'supply') maps.supplies.set(localId, pbId)
    if (kind === 'invoice') maps.invoices.set(localId, pbId)
  }
}
