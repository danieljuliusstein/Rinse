/**
 * Mobile-parity gates for booking / calendar grey days.
 * Matches apps/mobile `confirm-unblock-day.ts`.
 */
import type { ConfirmOptions } from '@/providers/UiProvider'
import type { DeskTimeBlock } from '@/lib/types'
import * as api from '@/lib/api'
import { weekdayFromIsoDate } from '@/lib/booking-calendar'
import {
  DEFAULT_BOOKING_SCHEDULE,
  type BookingSchedule,
} from '@/lib/booking-schedule'
import { loadAppSettings, saveAppSettings } from '@/lib/settings-api'

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function describeBlocks(blocks: DeskTimeBlock[]): string {
  if (blocks.length === 1) {
    const block = blocks[0]!
    if (block.all_day) {
      return block.label
        ? `You marked this day as time off (“${block.label}”).`
        : 'You marked this day as time off.'
    }
    const range =
      block.start_time && block.end_time ? ` (${block.start_time}–${block.end_time})` : ''
    return block.label
      ? `You have a time-off block${range} (“${block.label}”).`
      : `You have a time-off block${range}.`
  }
  return `You have ${blocks.length} time-off blocks on this day.`
}

export type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

/**
 * Prompt when booking/saving on a date that has time-off blocks.
 * @returns true if clear to proceed (no blocks, or operator removed them).
 */
export async function confirmUnblockDayIfNeeded(
  date: string,
  confirm: ConfirmFn,
): Promise<boolean> {
  const day = date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true

  let blocks: DeskTimeBlock[] = []
  try {
    blocks = await api.getTimeBlocksOnDate(day)
  } catch {
    // Fail open — same as mobile (network blip shouldn't hard-block the operator).
    return true
  }
  if (blocks.length === 0) return true

  const label = formatDayLabel(day)
  const remove = await confirm({
    title: 'Day is blocked',
    message: `${describeBlocks(blocks)} Remove the block${blocks.length === 1 ? '' : 's'} for ${label} so you can book?`,
    confirmLabel: 'Remove blocks',
    cancelLabel: 'Keep blocked',
    danger: true,
  })
  if (!remove) return false

  try {
    await api.deleteTimeBlocksOnDate(day)
    return true
  } catch (e) {
    // Surface via confirm-style alert path: callers should toast/alert on false.
    throw e instanceof Error ? e : new Error('Could not remove blocks')
  }
}

export type CalendarBlockReason = {
  hasTimeBlocks: boolean
  outsideWorkDays: boolean
  blocks: DeskTimeBlock[]
}

/** Open one specific calendar date without changing weekly work days. */
async function openSpecificDate(date: string): Promise<void> {
  const day = date.slice(0, 10)
  const settings = await loadAppSettings()
  const schedule: BookingSchedule = {
    ...(settings.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE),
    open_dates: [...(settings.booking_schedule?.open_dates ?? [])],
  }
  if (!schedule.open_dates.includes(day)) {
    schedule.open_dates = [...schedule.open_dates, day].sort()
    await saveAppSettings({ ...settings, booking_schedule: schedule })
  }
}

export async function getCalendarBlockReason(date: string): Promise<CalendarBlockReason> {
  const day = date.slice(0, 10)
  const settings = await loadAppSettings()
  const schedule = settings.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE
  const open = new Set(schedule.open_dates ?? [])
  const outsideWorkDays =
    !schedule.work_days.includes(weekdayFromIsoDate(day)) && !open.has(day)
  let blocks: DeskTimeBlock[] = []
  try {
    blocks = await api.getTimeBlocksOnDate(day)
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
 * Calendar grey day: Keep blocked / Unblock.
 * Unblock removes time-off for that date and/or opens only that specific date.
 */
export async function confirmUnblockCalendarDay(
  date: string,
  confirm: ConfirmFn,
): Promise<boolean> {
  const day = date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true

  const reason = await getCalendarBlockReason(day)
  if (!reason.hasTimeBlocks && !reason.outsideWorkDays) return true

  const label = formatDayLabel(day)
  const parts: string[] = []
  if (reason.hasTimeBlocks) parts.push(describeBlocks(reason.blocks))
  if (reason.outsideWorkDays) {
    parts.push(
      `${label} isn’t on your usual work-day schedule. Unblocking opens only this date — not every ${new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })}.`,
    )
  }
  parts.push(`Unblock ${label} so you can book?`)

  const unblockLabel =
    reason.hasTimeBlocks && !reason.outsideWorkDays ? 'Remove blocks' : 'Unblock day'
  const unblock = await confirm({
    title: 'Day is blocked',
    message: parts.join('\n\n'),
    confirmLabel: unblockLabel,
    cancelLabel: 'Keep blocked',
    danger: true,
  })
  if (!unblock) return false

  if (reason.hasTimeBlocks) await api.deleteTimeBlocksOnDate(day)
  if (reason.outsideWorkDays) await openSpecificDate(day)
  return true
}
