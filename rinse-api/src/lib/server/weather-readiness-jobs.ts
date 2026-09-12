import type PocketBase from 'pocketbase'
import { escapeFilterValue, pbClientToApp, pbJobToApp, type PbRecord } from '@/lib/api/mappers'
import {
  nextThreeDayDates,
  resolveWeatherJobAddress,
  type WeatherJobInput,
} from '@/lib/weather-risk'

export async function loadBusinessAddressForOrg(
  pb: PocketBase,
  organizationId: string,
): Promise<string | undefined> {
  try {
    const records = await pb.collection('app_settings').getFullList<PbRecord>({
      filter: `organization_id = "${escapeFilterValue(organizationId)}"`,
      limit: 1,
    })
    const address = String(records[0]?.business_address ?? '').trim()
    return address || undefined
  } catch {
    return undefined
  }
}

export async function loadUpcomingWeatherJobsForOrg(
  pb: PocketBase,
  organizationId: string,
  todayStr: string,
): Promise<PbRecord[]> {
  const dates = nextThreeDayDates(new Date(`${todayStr}T12:00:00`))
  const endDate = dates[dates.length - 1]
  const org = escapeFilterValue(organizationId)
  const filter = `organization_id = "${org}" && date >= "${todayStr}" && date <= "${endDate}"`

  return pb.collection('jobs').getFullList<PbRecord>({
    filter,
    expand: 'client_id',
    sort: 'date,start_time',
  })
}

export function pbJobsToWeatherInputs(
  records: PbRecord[],
  businessAddress?: string,
): WeatherJobInput[] {
  return records.map((record) => {
    const job = pbJobToApp(record)
    const client = record.expand?.client_id ? pbClientToApp(record.expand.client_id) : undefined
    const { address, addressSource } = resolveWeatherJobAddress(client?.address, businessAddress)

    return {
      id: job.id,
      date: job.date,
      start_time: job.start_time,
      location_type: job.location_type,
      clientName: client?.name ?? 'Client',
      address,
      addressSource,
      status: job.status,
    }
  })
}
