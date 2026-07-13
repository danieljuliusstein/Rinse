import { Alert } from 'react-native'
import {
  DEFAULT_BOOKING_SCHEDULE,
  type BookingSchedule,
} from '@/src/lib/booking-schedule'
import { weekdayFromIsoDate } from '@/src/lib/booking-calendar'
import { loadSettings, saveSettings } from '@/src/lib/settings-store'
import {
  deleteTimeBlocksOnDate,
  getTimeBlocksOnDate,
  type TimeBlock,
} from '@/src/lib/time-blocks-api'

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function describeBlocks(blocks: TimeBlock[]): string {
  if (blocks.length === 1) {
    const block = blocks[0]
    if (block.all_day) {
      return block.label
        ? `You marked this day as time off (“${block.label}”).`
        : 'You marked this day as time off.'
    }
    const range =
      block.start_time && block.end_time
        ? ` (${block.start_time}–${block.end_time})`
        : ''
    return block.label
      ? `You have a time-off block${range} (“${block.label}”).`
      : `You have a time-off block${range}.`
  }
  return `You have ${blocks.length} time-off blocks on this day.`
}

function promptKeepOrUnblock(title: string, message: string, unblockLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Keep blocked', style: 'cancel', onPress: () => resolve(false) },
      { text: unblockLabel, style: 'destructive', onPress: () => resolve(true) },
    ])
  })
}

/** Open one specific calendar date without changing weekly work days. */
async function openSpecificDate(date: string): Promise<void> {
  const day = date.slice(0, 10)
  const settings = await loadSettings()
  const schedule: BookingSchedule = {
    ...(settings.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE),
    open_dates: [...(settings.booking_schedule?.open_dates ?? [])],
  }
  if (!schedule.open_dates.includes(day)) {
    schedule.open_dates = [...schedule.open_dates, day].sort()
    await saveSettings({ booking_schedule: schedule })
  }
}

/**
 * Prompt when booking/saving on a date that has time-off blocks.
 * @returns true if clear to proceed (no blocks, or operator removed them).
 */
export async function confirmUnblockDayIfNeeded(date: string): Promise<boolean> {
  const day = date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true

  let blocks: TimeBlock[] = []
  try {
    blocks = await getTimeBlocksOnDate(day)
  } catch {
    return true
  }
  if (blocks.length === 0) return true

  const label = formatDayLabel(day)
  const remove = await promptKeepOrUnblock(
    'Day is blocked',
    `${describeBlocks(blocks)} Remove the block${blocks.length === 1 ? '' : 's'} for ${label} so you can book?`,
    'Remove blocks'
  )
  if (!remove) return false

  try {
    await deleteTimeBlocksOnDate(day)
    return true
  } catch (e) {
    Alert.alert(
      'Could not remove blocks',
      e instanceof Error ? e.message : 'Try again from Schedule & time off.'
    )
    return false
  }
}

export type CalendarBlockReason = {
  hasTimeBlocks: boolean
  outsideWorkDays: boolean
  blocks: TimeBlock[]
}

export async function getCalendarBlockReason(date: string): Promise<CalendarBlockReason> {
  const day = date.slice(0, 10)
  const settings = await loadSettings()
  const schedule = settings.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE
  const open = new Set(schedule.open_dates ?? [])
  const outsideWorkDays =
    !schedule.work_days.includes(weekdayFromIsoDate(day)) && !open.has(day)
  let blocks: TimeBlock[] = []
  try {
    blocks = await getTimeBlocksOnDate(day)
  } catch {
    blocks = []
  }
  return {
    hasTimeBlocks: blocks.length > 0,
    outsideWorkDays,
    blocks,
  }
}

/**
 * Home calendar: Keep blocked / Unblock for greyed days.
 * Unblock removes time-off for that date and/or opens only that specific date.
 */
export async function confirmUnblockCalendarDay(date: string): Promise<boolean> {
  const day = date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true

  const reason = await getCalendarBlockReason(day)
  if (!reason.hasTimeBlocks && !reason.outsideWorkDays) return true

  const label = formatDayLabel(day)
  const parts: string[] = []
  if (reason.hasTimeBlocks) parts.push(describeBlocks(reason.blocks))
  if (reason.outsideWorkDays) {
    parts.push(
      `${label} isn’t on your usual work-day schedule. Unblocking opens only this date — not every ${new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })}.`
    )
  }
  parts.push(`Unblock ${label} so you can book?`)

  const unblockLabel = reason.hasTimeBlocks && !reason.outsideWorkDays ? 'Remove blocks' : 'Unblock day'
  const unblock = await promptKeepOrUnblock('Day is blocked', parts.join('\n\n'), unblockLabel)
  if (!unblock) return false

  try {
    if (reason.hasTimeBlocks) await deleteTimeBlocksOnDate(day)
    if (reason.outsideWorkDays) await openSpecificDate(day)
    return true
  } catch (e) {
    Alert.alert(
      'Could not unblock day',
      e instanceof Error ? e.message : 'Try again from Schedule & time off.'
    )
    return false
  }
}
