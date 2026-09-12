export type RecurrenceCadence = 'weekly' | 'biweekly' | 'monthly'

export const RECURRENCE_CADENCE_OPTIONS: { value: RecurrenceCadence | 'none'; label: string }[] = [
  { value: 'none', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

export function isRecurringJob(cadence?: string | null): cadence is RecurrenceCadence {
  return cadence === 'weekly' || cadence === 'biweekly' || cadence === 'monthly'
}

export function recurrenceLabel(cadence?: string | null): string {
  if (!isRecurringJob(cadence)) return ''
  return RECURRENCE_CADENCE_OPTIONS.find((o) => o.value === cadence)?.label ?? cadence
}

/** Next occurrence after `fromDate` using anchor + cadence. */
export function nextRecurrenceDate(
  anchorDate: string,
  cadence: RecurrenceCadence,
  fromDate = new Date().toISOString().slice(0, 10)
): string {
  const anchor = new Date(anchorDate + 'T12:00:00')
  let cursor = new Date(anchor)
  const end = new Date(fromDate + 'T12:00:00')

  while (cursor <= end) {
    if (cadence === 'weekly') cursor.setDate(cursor.getDate() + 7)
    else if (cadence === 'biweekly') cursor.setDate(cursor.getDate() + 14)
    else cursor.setMonth(cursor.getMonth() + 1)
  }

  return cursor.toISOString().slice(0, 10)
}
