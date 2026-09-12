import type { CalCategory } from '@/lib/calendar-categories'
import { categoryForJob, colorForJob } from '@/lib/calendar-categories'
import type { DeskJob, DeskTimeBlock } from '@/lib/types'

export type ListJobItem = {
  kind: 'job'
  id: string
  title: string
  client: string
  subtitle: string
  date: string
  startHour: number
  duration: number
  allDay: boolean
  color: string
  categoryName: string
  job: DeskJob
}

export type ListBlockItem = {
  kind: 'block'
  id: string
  title: string
  date: string
  startHour: number
  duration: number
  allDay: boolean
  /** All-day block on a day that still has jobs — don't imply the day is fully off. */
  coexistsWithJobs: boolean
  timeLabel: string
  block: DeskTimeBlock
}

export type ListItem = ListJobItem | ListBlockItem

function parseHHMM(raw?: string): { h: number; m: number } | null {
  if (!raw) return null
  const m = raw.match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  return { h: Number(m[1]), m: Number(m[2]) }
}

export function startHourFromTime(raw?: string, fallback = 9): number {
  const p = parseHHMM(raw)
  if (!p) return fallback
  return p.h + p.m / 60
}

export function fmtTimeShort(hour: number): string {
  const h = Math.floor(hour)
  const mins = Math.round((hour - h) * 60)
  const am = h >= 12 ? 'p' : 'a'
  const h12 = ((h + 11) % 12) + 1
  if (mins === 0) return `${h12}${am}`
  return `${h12}:${String(mins).padStart(2, '0')}${am}`
}

export function jobToListItem(job: DeskJob, cats: CalCategory[]): ListJobItem {
  const cat = categoryForJob(job.id, cats)
  const color = colorForJob(job.id, cats)
  const fallback = `${job.client?.name || 'Job'}${job.packageName ? ` · ${job.packageName}` : ''}`
  const title = job.notes?.trim() || fallback
  const allDay = !job.start_time
  const hours = job.hours_worked && job.hours_worked > 0 ? job.hours_worked : 1
  return {
    kind: 'job',
    id: job.id,
    title,
    client: job.client?.name || 'Client',
    subtitle: [job.client?.name, job.packageName || cat.name].filter(Boolean).join(' · '),
    date: job.date.slice(0, 10),
    startHour: allDay ? 9 : startHourFromTime(job.start_time),
    duration: allDay ? 0 : hours,
    allDay,
    color,
    categoryName: cat.name,
    job,
  }
}

export function blockToListItem(
  block: DeskTimeBlock,
  dayHasJobs = false,
): ListBlockItem {
  const storedAllDay = block.all_day || !block.start_time
  const coexistsWithJobs = storedAllDay && dayHasJobs
  // When jobs remain on an "all day" block day, treat the block as an overlay chip — not an exclusive all-day event.
  const allDay = storedAllDay && !coexistsWithJobs
  const start = startHourFromTime(block.start_time, 9)
  let duration = 1
  if (!storedAllDay && block.end_time) {
    const end = startHourFromTime(block.end_time, start + 1)
    duration = Math.max(0.5, end - start)
  }
  return {
    kind: 'block',
    id: block.id,
    title: block.label?.trim() || (coexistsWithJobs ? 'Unavailable' : 'Time off'),
    date: block.date.slice(0, 10),
    startHour: storedAllDay ? 0 : start,
    duration: allDay ? 24 : coexistsWithJobs ? 0 : duration,
    allDay,
    coexistsWithJobs,
    timeLabel: allDay
      ? 'All day'
      : coexistsWithJobs
        ? 'Blocked'
        : fmtTimeShort(start),
    block,
  }
}

export function itemsOnDate(
  jobs: DeskJob[],
  blocks: DeskTimeBlock[],
  iso: string,
  cats: CalCategory[],
): ListItem[] {
  const dayJobs = jobs
    .filter((j) => j.status !== 'cancelled' && j.date.slice(0, 10) === iso)
    .map((j) => jobToListItem(j, cats))
  const dayHasJobs = dayJobs.length > 0
  const dayBlocks = blocks
    .filter((b) => b.date.slice(0, 10) === iso)
    .map((b) => blockToListItem(b, dayHasJobs))
  return [...dayJobs, ...dayBlocks].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
    return a.startHour - b.startHour
  })
}

/** Soft chip colors from category accent hex. */
export function chipTone(hex: string): {
  accent: string
  bg: string
  text: string
  border: string
} {
  return {
    accent: hex,
    bg: `color-mix(in srgb, ${hex} 12%, white)`,
    text: hex,
    border: `color-mix(in srgb, ${hex} 28%, white)`,
  }
}

export function weekStartFromISO(iso: string): Date {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateLocalFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
