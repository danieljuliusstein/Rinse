import { getPocketBase } from '../pocketbase'
import { escapeFilterValue, type PbRecord } from './mappers'
import { isMissingCollectionError } from './pb-errors'
import { tenantFilter, withOrganization } from './tenant-pocketbase'
import type { TimeBlock, TimeBlockInput } from '../types'

const MIGRATION_HINT =
  'Time blocks are not set up on the server yet. Run PocketBase migrations: cd pocketbase && ./pocketbase migrate up'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function pbTimeBlockToApp(r: PbRecord): TimeBlock {
  return {
    id: r.id,
    date: String(r.date ?? '').slice(0, 10),
    start_time: r.start_time ? String(r.start_time) : undefined,
    end_time: r.end_time ? String(r.end_time) : undefined,
    all_day: Boolean(r.all_day),
    label: r.label ? String(r.label) : undefined,
  }
}

function blockPayload(input: TimeBlockInput): Record<string, unknown> {
  return {
    date: input.date,
    start_time: input.all_day ? '' : (input.start_time?.trim() ?? ''),
    end_time: input.all_day ? '' : (input.end_time?.trim() ?? ''),
    all_day: input.all_day === true,
    label: input.label?.trim() ?? '',
  }
}

export async function getTimeBlocks(fromDate: string, toDate: string): Promise<TimeBlock[]> {
  try {
    const from = escapeFilterValue(fromDate)
    const to = escapeFilterValue(toDate)
    const records = await pb().collection('time_blocks').getFullList<PbRecord>({
      filter: `${tenantFilter()} && date >= "${from}" && date <= "${to}"`,
      sort: 'date,start_time',
    })
    return records.map(pbTimeBlockToApp)
  } catch (err) {
    if (isMissingCollectionError(err)) {
      console.warn('[time_blocks]', MIGRATION_HINT)
      return []
    }
    throw err
  }
}

export async function createTimeBlock(input: TimeBlockInput): Promise<TimeBlock> {
  try {
    const created = await pb().collection('time_blocks').create<PbRecord>(
      withOrganization(blockPayload(input)),
    )
    return pbTimeBlockToApp(created)
  } catch (err) {
    if (isMissingCollectionError(err)) throw new Error(MIGRATION_HINT)
    throw err
  }
}

export async function deleteTimeBlock(id: string): Promise<boolean> {
  try {
    await pb().collection('time_blocks').delete(id)
    return true
  } catch {
    return false
  }
}
