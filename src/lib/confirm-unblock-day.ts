/**
 * Mobile-parity gate for booking on a day with time-off blocks.
 * Matches apps/mobile `confirm-unblock-day.ts` → `confirmUnblockDayIfNeeded`.
 */
import type { ConfirmOptions } from '@/providers/UiProvider'
import type { DeskTimeBlock } from '@/lib/types'
import * as api from '@/lib/api'

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
