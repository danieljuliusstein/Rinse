export interface AvailabilitySlot {
  time: string
  label: string
  available: boolean
}

export interface BookingSchedule {
  work_days: number[]
  start_time: string
  end_time: string
  lunch_start?: string
  lunch_end?: string
  slot_interval_minutes: number
}

export const DEFAULT_BOOKING_SCHEDULE: BookingSchedule = {
  work_days: [1, 2, 3, 4, 5, 6],
  start_time: '08:00',
  end_time: '18:00',
  lunch_start: '12:00',
  lunch_end: '13:00',
  slot_interval_minutes: 120,
}

export const DEFAULT_PACKAGE_DURATION_MINUTES = 120

export interface TimeInterval {
  start: number
  end: number
}

export interface AvailabilityJob {
  start_time?: string
  status: string
  duration_minutes?: number
}

export interface AvailabilityBlock {
  date: string
  start_time?: string
  end_time?: string
  all_day?: boolean
}

export function normalizeBookingSchedule(raw: unknown): BookingSchedule {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return normalizeBookingSchedule(JSON.parse(raw))
    } catch {
      return { ...DEFAULT_BOOKING_SCHEDULE }
    }
  }
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_BOOKING_SCHEDULE }
  const o = raw as Record<string, unknown>
  const workDays = Array.isArray(o.work_days)
    ? o.work_days
        .map((d) => {
          const n = typeof d === 'number' ? d : typeof d === 'string' ? Number(d) : NaN
          return Number.isInteger(n) && n >= 0 && n <= 6 ? n : null
        })
        .filter((d): d is number => d !== null)
    : DEFAULT_BOOKING_SCHEDULE.work_days
  const intervalRaw = o.slot_interval_minutes
  const parsedInterval =
    typeof intervalRaw === 'number'
      ? intervalRaw
      : typeof intervalRaw === 'string'
        ? Number(intervalRaw)
        : NaN
  const interval =
    parsedInterval > 0 ? parsedInterval : DEFAULT_BOOKING_SCHEDULE.slot_interval_minutes
  return {
    work_days: workDays.length > 0 ? workDays : [...DEFAULT_BOOKING_SCHEDULE.work_days],
    start_time: typeof o.start_time === 'string' && o.start_time ? o.start_time : DEFAULT_BOOKING_SCHEDULE.start_time,
    end_time: typeof o.end_time === 'string' && o.end_time ? o.end_time : DEFAULT_BOOKING_SCHEDULE.end_time,
    lunch_start: typeof o.lunch_start === 'string' ? o.lunch_start : DEFAULT_BOOKING_SCHEDULE.lunch_start,
    lunch_end: typeof o.lunch_end === 'string' ? o.lunch_end : DEFAULT_BOOKING_SCHEDULE.lunch_end,
    slot_interval_minutes: interval,
  }
}

export function parseTimeToMinutes(time: string): number | null {
  const trimmed = time.trim()
  if (!trimmed) return null
  const [h, m] = trimmed.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function slotLabel(time: string): string {
  const mins = parseTimeToMinutes(time)
  if (mins === null) return time
  const dt = new Date()
  dt.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function weekdayFromIsoDate(date: string): number {
  return new Date(date + 'T12:00:00').getDay()
}

export function generateSlotStarts(schedule: BookingSchedule): string[] {
  const start = parseTimeToMinutes(schedule.start_time)
  const end = parseTimeToMinutes(schedule.end_time)
  if (start === null || end === null || end <= start) return []
  const step = schedule.slot_interval_minutes
  const slots: string[] = []
  for (let t = start; t < end; t += step) {
    slots.push(minutesToTime(t))
  }
  return slots
}

export function lunchInterval(schedule: BookingSchedule): TimeInterval | null {
  if (!schedule.lunch_start || !schedule.lunch_end) return null
  const start = parseTimeToMinutes(schedule.lunch_start)
  const end = parseTimeToMinutes(schedule.lunch_end)
  if (start === null || end === null || end <= start) return null
  return { start, end }
}

export function jobBusyInterval(job: AvailabilityJob, fallbackDurationMinutes: number): TimeInterval | null {
  if (job.status !== 'scheduled' && job.status !== 'in_progress') return null
  const start = parseTimeToMinutes(job.start_time ?? '')
  if (start === null) return null
  const duration = job.duration_minutes && job.duration_minutes > 0 ? job.duration_minutes : fallbackDurationMinutes
  return { start, end: start + duration }
}

export function blockBusyInterval(block: AvailabilityBlock): TimeInterval | null {
  if (block.all_day) return { start: 0, end: 24 * 60 }
  const start = parseTimeToMinutes(block.start_time ?? '')
  const end = parseTimeToMinutes(block.end_time ?? '')
  if (start === null || end === null || end <= start) return { start: 0, end: 24 * 60 }
  return { start, end }
}

function slotFitsAndAvailable(
  slotStart: number,
  packageDurationMinutes: number,
  scheduleEnd: number,
  busy: TimeInterval[],
): boolean {
  const slotEnd = slotStart + packageDurationMinutes
  if (slotEnd > scheduleEnd) return false
  return !busy.some((b) => intervalsOverlap(slotStart, slotEnd, b.start, b.end))
}

export function computeAvailability(input: {
  schedule: BookingSchedule
  date: string
  packageDurationMinutes: number
  jobs: AvailabilityJob[]
  blocks: AvailabilityBlock[]
}): AvailabilitySlot[] {
  const { schedule, date, packageDurationMinutes, jobs, blocks } = input
  const weekday = weekdayFromIsoDate(date)
  const scheduleEnd = parseTimeToMinutes(schedule.end_time) ?? 24 * 60
  const slotTimes = generateSlotStarts(schedule)

  const closedDay = !schedule.work_days.includes(weekday)
  const allDayBlock = blocks.some((b) => b.all_day)

  const busy: TimeInterval[] = []
  const lunch = lunchInterval(schedule)
  if (lunch) busy.push(lunch)
  for (const block of blocks) {
    const interval = blockBusyInterval(block)
    if (interval) busy.push(interval)
  }
  for (const job of jobs) {
    const interval = jobBusyInterval(job, packageDurationMinutes)
    if (interval) busy.push(interval)
  }

  return slotTimes.map((time) => {
    const start = parseTimeToMinutes(time)
    const unavailable =
      closedDay ||
      allDayBlock ||
      start === null ||
      !slotFitsAndAvailable(start, packageDurationMinutes, scheduleEnd, busy)
    return {
      time,
      label: slotLabel(time),
      available: !unavailable,
    }
  })
}
