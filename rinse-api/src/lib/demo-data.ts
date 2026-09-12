import type { HomeInventoryItem } from './home-inventory'

const DEMO_CLIENT_IDS = new Set(['cli_marcus', 'cli_sarah', 'cli_james'])
export const DEMO_JOB_IDS = new Set(['job_001', 'job_002', 'job_003', 'job_004', 'job_005'])

export function isDemoJobId(id: string): boolean {
  return DEMO_JOB_IDS.has(id) || /^job_\d{3}$/.test(id)
}
const DEMO_INVENTORY_IDS = new Set([
  'hi_1', 'hi_2', 'hi_3', 'hi_4', 'hi_5', 'hi_6',
  'hi_7', 'hi_8', 'hi_9', 'hi_10', 'hi_11', 'hi_12', 'hi_13', 'hi_14',
])

export function isDemoAppData(data: {
  clients: { id: string }[]
  jobs: { id: string }[]
  invoices: { id: string }[]
}): boolean {
  if (data.clients.some((c) => DEMO_CLIENT_IDS.has(c.id))) return true
  if (data.jobs.some((j) => DEMO_JOB_IDS.has(j.id))) return true
  if (data.invoices.some((i) => i.id === 'inv_001' || i.id === 'inv_002')) return true
  return false
}

export function isDemoHomeInventory(items: HomeInventoryItem[]): boolean {
  if (items.length === 0) return false
  return items.every((i) => DEMO_INVENTORY_IDS.has(i.id))
}
