import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'

export interface TimeBlock {
  id: string
  date: string
  start_time?: string
  end_time?: string
  all_day?: boolean
  label?: string
}

export interface TimeBlockInput {
  date: string
  all_day?: boolean
  start_time?: string
  end_time?: string
  label?: string
}

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function getTimeBlocks(fromDate: string, toDate: string): Promise<TimeBlock[]> {
  if (!(await isOnline())) return []
  try {
    const orgId = requireOrganizationId()
    const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const records = await pb().collection('time_blocks').getFullList({
      filter: `organization_id = "${escaped}" && date >= "${fromDate}" && date <= "${toDate}"`,
      sort: 'date,start_time',
    })
    return records.map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id),
        date: String(row.date ?? '').slice(0, 10),
        start_time: row.start_time ? String(row.start_time) : undefined,
        end_time: row.end_time ? String(row.end_time) : undefined,
        all_day: Boolean(row.all_day),
        label: row.label ? String(row.label) : undefined,
      }
    })
  } catch {
    return []
  }
}

export async function getTimeBlocksOnDate(date: string): Promise<TimeBlock[]> {
  const day = date.slice(0, 10)
  return getTimeBlocks(day, day)
}

export async function createTimeBlock(input: TimeBlockInput): Promise<TimeBlock> {
  if (!(await isOnline())) throw new Error('You are offline')
  const orgId = requireOrganizationId()
  const created = await pb().collection('time_blocks').create({
    organization_id: orgId,
    date: input.date,
    start_time: input.all_day ? '' : (input.start_time?.trim() ?? ''),
    end_time: input.all_day ? '' : (input.end_time?.trim() ?? ''),
    all_day: input.all_day === true,
    label: input.label?.trim() ?? '',
  })
  const row = created as Record<string, unknown>
  return {
    id: String(row.id),
    date: String(row.date ?? '').slice(0, 10),
    start_time: row.start_time ? String(row.start_time) : undefined,
    end_time: row.end_time ? String(row.end_time) : undefined,
    all_day: Boolean(row.all_day),
    label: row.label ? String(row.label) : undefined,
  }
}

export async function deleteTimeBlock(id: string): Promise<boolean> {
  if (!(await isOnline())) throw new Error('You are offline')
  try {
    await pb().collection('time_blocks').delete(id)
    return true
  } catch {
    return false
  }
}

/** Deletes every time-off block on a calendar day. Returns how many were removed. */
export async function deleteTimeBlocksOnDate(date: string): Promise<number> {
  const blocks = await getTimeBlocksOnDate(date)
  let removed = 0
  for (const block of blocks) {
    if (await deleteTimeBlock(block.id)) removed += 1
  }
  return removed
}
