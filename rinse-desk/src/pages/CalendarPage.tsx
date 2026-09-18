import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
  SlotLabelContentArg,
  SlotLaneContentArg,
} from '@fullcalendar/core'
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction'
import { CalendarDays, CalendarOff, ListOrdered, Plus, Sun } from 'lucide-react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import { useOptionalTour } from '@/components/tour/tour-provider'
import { PanelEdgeToggle } from '@/components/automations/PanelEdgeToggle'
import { EventPopover } from '@/components/calendar/EventPopover'
import { EventDetailSidebar } from '@/components/calendar/EventDetailSidebar'
import { DayAgendaView } from '@/components/calendar/DayAgendaView'
import { DayAmPmView } from '@/components/calendar/DayAmPmView'
import { ScheduleListView } from '@/components/calendar/ScheduleListView'
import { CleanWeekEmpty } from '@/components/calendar/CleanWeekEmpty'
import {
  addDaysISO,
  formatDateLocalFromDate,
  weekStartFromISO,
} from '@/components/calendar/calendarListModel'
import * as api from '@/lib/api'
import {
  computeScheduleClosedDates,
  datesInInclusiveRange,
} from '@/lib/booking-calendar'
import {
  DEFAULT_BOOKING_SCHEDULE,
  type BookingSchedule,
} from '@/lib/booking-schedule'
import {
  confirmUnblockCalendarDay,
  confirmUnblockDayIfNeeded,
} from '@/lib/confirm-unblock-day'
import { loadAppSettings } from '@/lib/settings-api'
import type { DeskClient, DeskJob, DeskPackage, DeskTimeBlock, JobStatus } from '@/lib/types'
import { colors } from '@/theme/colors'
import { todayISO } from '@/lib/metrics'
import {
  type CalCategory,
  assignEventCategory,
  assignEventColor,
  categoryForJob,
  clearEventMeta,
  colorForJob,
  loadCategories,
} from '@/lib/calendar-categories'

type ViewMode = 'month' | 'week' | 'day' | 'schedule'
/** Day layout options for the single-day view */
type DayLayout = 'grid' | 'agenda' | 'thirds'

interface CalEvent {
  id: string
  title: string
  date: string
  color: string
  details: string
  time?: string
  priority: 'High' | 'Medium' | 'Low'
  allDay: boolean
  categoryId: string
  category: string
  status: JobStatus
  job: DeskJob
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const VIEW_MAP: Record<ViewMode, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
  schedule: 'listWeek',
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function isEphemeralEventId(id: string) {
  return id.startsWith('temp-') || id.startsWith('draft-')
}

function isDraftEventId(id: string) {
  return id.startsWith('draft-')
}

function jobToEvent(job: DeskJob, cats: CalCategory[]): CalEvent {
  const cat = categoryForJob(job.id, cats)
  const priority: CalEvent['priority'] =
    job.status === 'in_progress' ? 'High' : job.status === 'scheduled' ? 'Medium' : 'Low'
  const fallback = `${job.client?.name || 'Job'}${job.packageName ? ` - ${job.packageName}` : ''}`
  return {
    id: job.id,
    title: job.notes?.trim() || fallback,
    date: job.date.slice(0, 10),
    color: colorForJob(job.id, cats),
    details: job.notes || `${job.status.replace('_', ' ')} · ${job.location_type || 'mobile'}`,
    time: job.start_time?.slice(0, 5),
    priority,
    allDay: !job.start_time,
    categoryId: cat.id,
    category: cat.name,
    status: job.status,
    job,
  }
}

function parseStartTime(raw?: string): { h: number; m: number } | null {
  if (!raw) return null
  const m = raw.match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  return { h: Number(m[1]), m: Number(m[2]) }
}

function jobToFcEvent(job: DeskJob, cats: CalCategory[]): EventInput {
  const cat = categoryForJob(job.id, cats)
  const fallback = `${job.client?.name || 'Job'}${job.packageName ? ` - ${job.packageName}` : ''}`
  const title = job.notes?.trim() || fallback
  const date = job.date.slice(0, 10)
  const startParts = parseStartTime(job.start_time)
  const hours = job.hours_worked && job.hours_worked > 0 ? job.hours_worked : 1
  const color = colorForJob(job.id, cats)

  if (!startParts) {
    return {
      id: job.id,
      title,
      start: date,
      allDay: true,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { job, categoryId: cat.id },
    }
  }

  const start = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    startParts.h,
    startParts.m,
    0,
  )
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
  return {
    id: job.id,
    title,
    start,
    end,
    allDay: false,
    backgroundColor: color,
    borderColor: color,
    extendedProps: { job, categoryId: cat.id },
  }
}

function formatTimeLocal(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function durationHours(start: Date, end: Date) {
  return Math.max(0.25, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
}

function buildDraftCalEvent(opts: {
  date: string
  startTime?: string
  hoursWorked?: number
  allDay?: boolean
  title?: string
  cats: CalCategory[]
  client?: DeskClient
  pkg?: DeskPackage
}): CalEvent {
  const id = `draft-${Date.now()}`
  const title = opts.title?.trim() || 'New event'
  const allDay = opts.allDay === true
  const start_time = allDay ? undefined : opts.startTime || '09:00'
  const hours_worked = allDay ? 0 : opts.hoursWorked && opts.hoursWorked > 0 ? opts.hoursWorked : 1
  const defaultCat = opts.cats[0]
  const job: DeskJob = {
    id,
    date: opts.date,
    start_time,
    status: 'scheduled',
    revenue: opts.pkg?.base_price ?? 0,
    tip: 0,
    client_id: opts.client?.id ?? '',
    package_id: opts.pkg?.id ?? '',
    notes: title,
    hours_worked,
    client: opts.client,
    packageName: opts.pkg?.name,
  }
  return {
    id,
    title,
    date: opts.date.slice(0, 10),
    color: defaultCat?.color ?? colors.green,
    details: 'Draft — not saved',
    time: start_time?.slice(0, 5),
    priority: 'Medium',
    allDay,
    categoryId: defaultCat?.id ?? 'meeting',
    category: defaultCat?.name ?? 'Meeting',
    status: 'scheduled',
    job,
  }
}

function draftToFcEvent(ev: CalEvent): EventInput {
  const date = ev.date.slice(0, 10)
  const title = `${ev.title || 'New event'} (Draft)`
  const color = ev.color
  const base = {
    id: ev.id,
    title,
    editable: false,
    startEditable: false,
    durationEditable: false,
    backgroundColor: color,
    borderColor: color,
    classNames: ['fc-draft-event', 'fc-event-selected', 'cursor-pointer'],
    extendedProps: { kind: 'draft' as const, job: ev.job, categoryId: ev.categoryId },
  }
  if (ev.allDay || !ev.time) {
    return { ...base, start: date, allDay: true }
  }
  const startParts = parseStartTime(ev.time)
  if (!startParts) return { ...base, start: date, allDay: true }
  const hours = ev.job.hours_worked && ev.job.hours_worked > 0 ? ev.job.hours_worked : 1
  const start = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    startParts.h,
    startParts.m,
    0,
  )
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
  return { ...base, start, end, allDay: false }
}

function endHHMMFromStart(start: string, hours: number): string {
  const parts = parseStartTime(start)
  if (!parts) return '17:00'
  const total = parts.h * 60 + parts.m + Math.max(15, Math.round(hours * 60))
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return `${pad(eh)}:${pad(em)}`
}

/** Background hatch so blocked ranges gray out the grid (jobs stay on top). */
function blockToFcEvent(block: DeskTimeBlock): EventInput {
  const date = block.date.slice(0, 10)
  const title = block.label?.trim() || 'Time off'
  const base = {
    id: `block-${block.id}`,
    title,
    editable: false,
    startEditable: false,
    durationEditable: false,
    classNames: ['fc-time-block', 'cursor-pointer'],
    display: 'background' as const,
    extendedProps: { kind: 'block' as const, block },
  }

  if (block.all_day || !block.start_time) {
    return { ...base, start: date, allDay: true }
  }

  const startParts = parseStartTime(block.start_time)
  const endParts = parseStartTime(block.end_time)
  if (!startParts) {
    return { ...base, start: date, allDay: true }
  }

  const start = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    startParts.h,
    startParts.m,
    0,
  )
  let end: Date
  if (endParts) {
    end = new Date(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      endParts.h,
      endParts.m,
      0,
    )
    if (end <= start) end = new Date(start.getTime() + 60 * 60 * 1000)
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }

  return {
    ...base,
    start,
    end,
    allDay: false,
  }
}

export default function CalendarPage() {
  const now = new Date()
  const { jobs, setJobs, clients, setClients, packages } = useData()
  const { alert, toast, promptForm, confirm } = useUi()
  const { ensureClientsAndPackages } = useCreateActions()
  const { calendarDraft, clearCalendarDraft, setPage } = useDeskNav()
  const tour = useOptionalTour()
  const calendarRef = useRef<FullCalendar | null>(null)
  const calendarHostRef = useRef<HTMLDivElement | null>(null)
  const panelHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const blocksRangeRef = useRef<{ from: Date; to: Date } | null>(null)

  const [view, setView] = useState<ViewMode>('week')
  const [dayLayout, setDayLayout] = useState<DayLayout>('grid')
  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<DeskTimeBlock | null>(null)
  /** When true, Save creates/converts to a time block instead of a job. */
  const [asBlocked, setAsBlocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [blockSaving, setBlockSaving] = useState(false)
  const [anchorDate, setAnchorDate] = useState(todayISO())
  const [categories, setCategories] = useState<CalCategory[]>(() => loadCategories())
  const [colorTick, setColorTick] = useState(0)
  const [timeBlocks, setTimeBlocks] = useState<DeskTimeBlock[]>([])
  const [bookingSchedule, setBookingSchedule] = useState<BookingSchedule>(() => ({
    ...DEFAULT_BOOKING_SCHEDULE,
    open_dates: [],
  }))
  const [blocksRangeISO, setBlocksRangeISO] = useState<{ from: string; to: string } | null>(
    null,
  )

  const isDraft = Boolean(selected && isDraftEventId(selected.id))
  const panelOpen = selected !== null || selectedBlock !== null

  useEffect(() => {
    setCategories(loadCategories())
  }, [])

  useEffect(() => {
    void loadAppSettings().then((s) => setBookingSchedule(s.booking_schedule))
  }, [])

  useEffect(() => {
    if (!calendarDraft) return
    const client = clients.find((c) => c.id === calendarDraft.clientId)
    if (!client) {
      clearCalendarDraft()
      alert('Contact not found for meeting draft', 'Calendar')
      return
    }
    if (!packages.length) {
      clearCalendarDraft()
      void ensureClientsAndPackages('schedule a meeting')
      return
    }
    const pkg = packages.filter((p) => p.active)[0] ?? packages[0]!
    const draft = buildDraftCalEvent({
      date: todayISO(),
      startTime: '10:00',
      hoursWorked: 1,
      title: calendarDraft.title ?? `Meeting with ${client.name}`,
      cats: categories,
      client,
      pkg,
    })
    setSelected(draft)
    setTitle(draft.title)
    setView('day')
    clearCalendarDraft()
    requestAnimationFrame(() => {
      const api = calendarRef.current?.getApi()
      if (api) {
        api.changeView('timeGridDay')
        api.gotoDate(draft.date)
      }
      titleInputRef.current?.focus()
    })
  }, [calendarDraft, clients, packages, categories, clearCalendarDraft, alert])

  const jobFcEvents = useMemo(
    () => jobs.filter((j) => j.status !== 'cancelled').map((j) => jobToFcEvent(j, categories)),
    [jobs, categories, colorTick],
  )

  /** Bolt-style custom surfaces — FullCalendar stays for month / week / day grid. */
  const useCustomSurface =
    view === 'schedule' || (view === 'day' && (dayLayout === 'agenda' || dayLayout === 'thirds'))

  const weekStartISO = useMemo(
    () => formatDateLocalFromDate(weekStartFromISO(anchorDate)),
    [anchorDate],
  )

  const visibleDates = useMemo(() => {
    // Schedule / week surfaces render Mon–Sun from weekStartISO — don't trust
    // blocksRangeISO alone (loadBlocksAround is anchor→+7, not week-aligned).
    if (view === 'schedule' || view === 'week') {
      const weekDates = datesInInclusiveRange(weekStartISO, addDaysISO(weekStartISO, 6))
      if (!blocksRangeISO) return weekDates
      const merged = new Set([
        ...weekDates,
        ...datesInInclusiveRange(blocksRangeISO.from, blocksRangeISO.to),
      ])
      return [...merged].sort()
    }
    if (view === 'day') {
      const day = anchorDate.slice(0, 10)
      if (!blocksRangeISO) return [day]
      const merged = new Set([
        day,
        ...datesInInclusiveRange(blocksRangeISO.from, blocksRangeISO.to),
      ])
      return [...merged].sort()
    }
    if (blocksRangeISO) {
      return datesInInclusiveRange(blocksRangeISO.from, blocksRangeISO.to)
    }
    if (view === 'month') {
      const start = new Date(`${anchorDate.slice(0, 10)}T12:00:00`)
      start.setDate(1)
      start.setDate(start.getDate() - 7)
      const end = new Date(`${anchorDate.slice(0, 10)}T12:00:00`)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setDate(end.getDate() + 7)
      return datesInInclusiveRange(formatDateLocalFromDate(start), formatDateLocalFromDate(end))
    }
    return datesInInclusiveRange(weekStartISO, addDaysISO(weekStartISO, 6))
  }, [blocksRangeISO, view, anchorDate, weekStartISO])

  /** Closed weekdays from booking_schedule (not all-day time_blocks). */
  const scheduleClosedDates = useMemo(
    () => computeScheduleClosedDates(visibleDates, bookingSchedule),
    [visibleDates, bookingSchedule],
  )

  const weekIsEmpty = useMemo(() => {
    if (view !== 'week') return false
    const end = addDaysISO(weekStartISO, 6)
    const hasJob = jobs.some((j) => {
      if (j.status === 'cancelled') return false
      const d = j.date.slice(0, 10)
      return d >= weekStartISO && d <= end
    })
    const hasBlock = timeBlocks.some((b) => {
      const d = b.date.slice(0, 10)
      return d >= weekStartISO && d <= end
    })
    const hasScheduleClosed = [...scheduleClosedDates].some(
      (d) => d >= weekStartISO && d <= end,
    )
    // Schedule-closed days still need the grid (grey hatch) — don't treat as blank week.
    return !hasJob && !hasBlock && !hasScheduleClosed && !selected && !selectedBlock
  }, [view, weekStartISO, jobs, timeBlocks, scheduleClosedDates, selected, selectedBlock])

  const showFc = !useCustomSurface && !weekIsEmpty

  function titleForAnchor(iso: string, mode: ViewMode): string {
    const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
    if (mode === 'day') {
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }
    if (mode === 'schedule' || mode === 'week') {
      const start = weekStartFromISO(iso)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const sameMonth = start.getMonth() === end.getMonth()
      if (sameMonth) {
        return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
      }
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }

  function loadBlocksAround(iso: string, mode: ViewMode) {
    const start = new Date(`${iso.slice(0, 10)}T00:00:00`)
    const end = new Date(start)
    if (mode === 'day') end.setDate(end.getDate() + 1)
    else if (mode === 'month') end.setMonth(end.getMonth() + 1)
    else end.setDate(end.getDate() + 7)
    void loadBlocksForRange(start, end)
  }

  function shiftAnchor(dir: -1 | 1) {
    const d = new Date(`${anchorDate.slice(0, 10)}T12:00:00`)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === 'month') d.setMonth(d.getMonth() + dir)
    else d.setDate(d.getDate() + 7 * dir)
    const next = formatDateLocalFromDate(d)
    setAnchorDate(next)
    setTitle(titleForAnchor(next, view))
    loadBlocksAround(next, view)
    calendarRef.current?.getApi().gotoDate(next)
  }

  function goTodayAnchor() {
    const next = todayISO()
    setAnchorDate(next)
    setTitle(titleForAnchor(next, view))
    loadBlocksAround(next, view)
    calendarRef.current?.getApi().today()
  }

  function openDraftAtHour(dateISO: string, startHour: number) {
    const h = Math.floor(startHour)
    const m = Math.round((startHour - h) * 60)
    openDraft(
      buildDraftCalEvent({
        date: dateISO,
        startTime: `${pad(h)}:${pad(m)}`,
        hoursWorked: 1,
        allDay: false,
        title: 'New event',
        cats: categories,
        client: clients[0],
        pkg: packages[0],
      }),
    )
  }

  function openNewEventDraft() {
    openDraft(
      buildDraftCalEvent({
        date: anchorDate,
        startTime: '09:00',
        hoursWorked: 1,
        allDay: false,
        title: 'New event',
        cats: categories,
        client: clients[0],
        pkg: packages[0],
      }),
    )
  }

  const fcEvents = useMemo(() => {
    const selectedId = selected?.id
    const jobsMapped = jobFcEvents.map((ev) => {
      const base = Array.isArray(ev.classNames)
        ? ev.classNames
        : ev.classNames
          ? [ev.classNames]
          : []
      return {
        ...ev,
        classNames: [
          ...base,
          'cursor-pointer',
          'fc-job-event',
          selectedId && ev.id === selectedId ? 'fc-event-selected' : '',
        ].filter(Boolean) as string[],
      }
    })
    const blocks = timeBlocks.map((b) => {
      const mapped = blockToFcEvent(b)
      if (selectedBlock?.id === b.id) {
        const base = Array.isArray(mapped.classNames)
          ? mapped.classNames
          : mapped.classNames
            ? [mapped.classNames]
            : []
        return {
          ...mapped,
          classNames: [...base, 'fc-event-selected', 'fc-time-block-selected'],
        }
      }
      return mapped
    })
    const allDayBlockDates = new Set(
      timeBlocks
        .filter((b) => b.all_day || !b.start_time)
        .map((b) => b.date.slice(0, 10)),
    )
    // Paint closed weekdays the same as mobile Home (work_days ∪ all-day blocks).
    const scheduleClosed = [...scheduleClosedDates]
      .filter((date) => !allDayBlockDates.has(date))
      .map(
        (date): EventInput => ({
          id: `schedule-closed-${date}`,
          title: 'Closed',
          start: date,
          allDay: true,
          editable: false,
          startEditable: false,
          durationEditable: false,
          classNames: ['fc-time-block', 'fc-schedule-closed', 'cursor-pointer'],
          display: 'background',
          extendedProps: { kind: 'schedule-closed' as const, date },
        }),
      )
    const draftEv =
      selected && isDraftEventId(selected.id) ? [draftToFcEvent(selected)] : []
    return [...jobsMapped, ...blocks, ...scheduleClosed, ...draftEv]
  }, [jobFcEvents, timeBlocks, selected, selectedBlock, scheduleClosedDates])

  async function loadBlocksForRange(from: Date, to: Date) {
    blocksRangeRef.current = { from, to }
    const fromISO = formatDateLocal(from)
    // FullCalendar `end` is exclusive — subtract one day for inclusive PB filter
    const toInclusive = new Date(to.getTime() - 24 * 60 * 60 * 1000)
    const toISO = formatDateLocal(toInclusive > from ? toInclusive : to)
    setBlocksRangeISO({ from: fromISO, to: toISO })
    const blocks = await api.listTimeBlocks(fromISO, toISO)
    setTimeBlocks(blocks)
  }

  async function refreshScheduleAndBlocks() {
    const settings = await loadAppSettings()
    setBookingSchedule(settings.booking_schedule)
    await reloadBlocks()
  }

  async function reloadBlocks() {
    if (blocksRangeRef.current) {
      await loadBlocksForRange(blocksRangeRef.current.from, blocksRangeRef.current.to)
    }
  }

  const changeView = useCallback(
    (mode: ViewMode) => {
      setView(mode)
      setTitle(titleForAnchor(anchorDate, mode))
      loadBlocksAround(anchorDate, mode)
      const api = calendarRef.current?.getApi()
      if (!api) return
      if (mode === 'schedule' || (mode === 'day' && (dayLayout === 'agenda' || dayLayout === 'thirds'))) {
        // Custom surface — keep FC on a nearby grid view for gotoDate sync
        api.changeView(mode === 'day' ? 'timeGridDay' : 'timeGridWeek')
        api.gotoDate(anchorDate)
        return
      }
      api.changeView(VIEW_MAP[mode])
      api.gotoDate(anchorDate)
    },
    [dayLayout, anchorDate],
  )

  const applyDayLayout = useCallback(
    (layout: DayLayout) => {
      setDayLayout(layout)
      if (view !== 'day') return
      const api = calendarRef.current?.getApi()
      if (!api) return
      api.changeView('timeGridDay')
      api.gotoDate(anchorDate)
      setTitle(titleForAnchor(anchorDate, 'day'))
    },
    [view, anchorDate],
  )

  const slotLaneClassNames = useCallback((_arg: SlotLaneContentArg) => [], [])

  const slotLabelContent = useCallback((arg: SlotLabelContentArg) => arg.text, [])

  function select(ev: CalEvent) {
    setSelectedBlock(null)
    setAsBlocked(false)
    setSelected(ev)
  }

  function dismissPanel() {
    setSelected(null)
    setSelectedBlock(null)
    setAsBlocked(false)
    calendarRef.current?.getApi().unselect()
  }

  function openDraft(ev: CalEvent) {
    setSelectedBlock(null)
    setAsBlocked(false)
    setSelected(ev)
    calendarRef.current?.getApi().unselect()
  }

  async function openCreateTimeBlock(defaults?: {
    date?: string
    startTime?: string
    endTime?: string
    allDay?: boolean
  }) {
    const date = defaults?.date ?? todayISO()
    const jobsOnDay = jobs.filter(
      (j) => j.status !== 'cancelled' && j.date.slice(0, 10) === date,
    )
    // Don't default to all-day when the day already has jobs — that reads as "day fully off".
    const defaultAllDay =
      defaults?.allDay === true
        ? jobsOnDay.length === 0
        : defaults?.allDay === false
          ? false
          : jobsOnDay.length === 0
    const values = await promptForm({
      title: 'Block time',
      submitLabel: 'Block',
      fields: [
        {
          name: 'label',
          label: 'Label',
          placeholder: 'Time off / Vacation',
          defaultValue: 'Time off',
        },
        {
          name: 'date',
          label: 'Date',
          type: 'date',
          required: true,
          defaultValue: date,
        },
        {
          name: 'all_day',
          label: 'All day',
          type: 'select',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          defaultValue: defaultAllDay ? 'yes' : 'no',
        },
        {
          name: 'start_time',
          label: 'Start (HH:MM)',
          placeholder: '09:00',
          defaultValue: defaults?.startTime ?? '09:00',
        },
        {
          name: 'end_time',
          label: 'End (HH:MM)',
          placeholder: '17:00',
          defaultValue: defaults?.endTime ?? '17:00',
        },
      ],
    })
    if (!values?.date) return
    let allDay = values.all_day !== 'no'
    const blockDate = values.date.slice(0, 10)
    const stillHasJobs = jobs.some(
      (j) => j.status !== 'cancelled' && j.date.slice(0, 10) === blockDate,
    )
    if (allDay && stillHasJobs) {
      const proceed = window.confirm(
        'This day already has scheduled jobs. An all-day block grays the whole day as unavailable — jobs stay, but booking will treat the day as blocked. Prefer a timed block unless you mean the full day.\n\nUse all-day anyway?',
      )
      if (!proceed) allDay = false
    }
    setBlockSaving(true)
    try {
      const created = await api.createTimeBlock({
        date: blockDate,
        all_day: allDay,
        start_time: allDay ? undefined : values.start_time || '09:00',
        end_time: allDay ? undefined : values.end_time || '17:00',
        label: values.label?.trim() || 'Time off',
      })
      await reloadBlocks()
      setSelected(null)
      setAsBlocked(false)
      setSelectedBlock(created)
      toast('Time blocked')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not block time', 'Calendar')
    } finally {
      setBlockSaving(false)
    }
  }

  async function saveSelectedBlock(patch: {
    label?: string
    date?: string
    all_day?: boolean
    start_time?: string
    end_time?: string
  }) {
    if (!selectedBlock) return
    setBlockSaving(true)
    try {
      const updated = await api.updateTimeBlock(selectedBlock.id, patch)
      setSelectedBlock(updated)
      await reloadBlocks()
      toast('Block updated')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update block', 'Calendar')
    } finally {
      setBlockSaving(false)
    }
  }

  async function deleteSelectedBlock() {
    if (!selectedBlock) return
    if (!window.confirm('Remove this time block?')) return
    setBlockSaving(true)
    try {
      await api.deleteTimeBlock(selectedBlock.id)
      setSelectedBlock(null)
      await reloadBlocks()
      toast('Block removed')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete block', 'Calendar')
    } finally {
      setBlockSaving(false)
    }
  }

  function patchDraft(
    patch: Partial<{
      title: string
      date: string
      time: string
      hours_worked: number
      categoryId: string
      color: string
      client_id: string
      package_id: string
    }>,
  ) {
    setSelected((prev) => {
      if (!prev || !isDraftEventId(prev.id)) return prev
      const client =
        patch.client_id !== undefined
          ? clients.find((c) => c.id === patch.client_id)
          : prev.job.client ?? clients.find((c) => c.id === prev.job.client_id)
      const pkg =
        patch.package_id !== undefined
          ? packages.find((p) => p.id === patch.package_id)
          : packages.find((p) => p.id === prev.job.package_id)
      const nextJob: DeskJob = {
        ...prev.job,
        notes: patch.title !== undefined ? patch.title : prev.job.notes,
        date: patch.date !== undefined ? patch.date : prev.job.date,
        start_time:
          patch.time !== undefined
            ? patch.time || undefined
            : prev.job.start_time,
        hours_worked:
          patch.hours_worked !== undefined ? patch.hours_worked : prev.job.hours_worked,
        client_id: patch.client_id !== undefined ? patch.client_id : prev.job.client_id,
        package_id: patch.package_id !== undefined ? patch.package_id : prev.job.package_id,
        client: client ?? prev.job.client,
        packageName: pkg?.name ?? prev.job.packageName,
        revenue: pkg?.base_price ?? prev.job.revenue,
      }
      const cat =
        patch.categoryId !== undefined
          ? categories.find((c) => c.id === patch.categoryId) ??
            categoryForJob(prev.id, categories)
          : categories.find((c) => c.id === prev.categoryId) ?? categoryForJob(prev.id, categories)
      const nextTitle = patch.title !== undefined ? patch.title : prev.title
      const nextDate = patch.date !== undefined ? patch.date : prev.date
      const nextTime =
        patch.time !== undefined ? patch.time || undefined : prev.time
      const allDay = !nextTime
      return {
        ...prev,
        title: nextTitle,
        date: nextDate,
        time: nextTime,
        allDay,
        color: patch.color !== undefined ? patch.color : prev.color,
        categoryId: cat.id,
        category: cat.name,
        job: nextJob,
      }
    })
  }

  function refreshSelected(job: DeskJob) {
    select(jobToEvent(job, loadCategories()))
  }

  function setEventCategory(jobId: string, categoryId: string) {
    if (isDraftEventId(jobId)) {
      patchDraft({ categoryId })
      return
    }
    if (isEphemeralEventId(jobId)) return
    assignEventCategory(jobId, categoryId)
    // Keep any custom event color; only category label changes
    setColorTick((t) => t + 1)
    const job = jobs.find((j) => j.id === jobId)
    if (job) refreshSelected(job)
  }

  function onRecolorEvent(jobId: string, color: string) {
    if (isDraftEventId(jobId)) {
      patchDraft({ color })
      return
    }
    if (isEphemeralEventId(jobId)) return
    assignEventColor(jobId, color)
    setColorTick((t) => t + 1)
    const job = jobs.find((j) => j.id === jobId)
    if (job) refreshSelected(job)
  }

  async function deleteSelected() {
    if (!selected || isEphemeralEventId(selected.id)) return
    const id = selected.id
    setSaving(true)
    try {
      if (selected.id.startsWith('tour-') || selected.id.startsWith('dummy-') || tour?.active) {
        clearEventMeta(id)
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: 'cancelled' as const } : j)))
        setSelected(null)
        toast('Event deleted')
        return
      }
      await api.deleteJob(id)
      clearEventMeta(id)
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: 'cancelled' as const } : j)))
      setSelected(null)
      toast('Event deleted')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete event', 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && (selected || selectedBlock)) {
        e.preventDefault()
        dismissPanel()
        return
      }
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const el = e.target as HTMLElement | null
      if (el?.closest?.('input, textarea, select, [contenteditable="true"]')) return

      if (selectedBlock) {
        if (blockSaving) return
        e.preventDefault()
        void deleteSelectedBlock()
        return
      }

      if (!selected || saving) return

      // Drafts: Delete dismisses the unsaved preview
      if (isDraftEventId(selected.id)) {
        e.preventDefault()
        dismissPanel()
        return
      }

      if (isEphemeralEventId(selected.id)) return
      e.preventDefault()
      void deleteSelected()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, selectedBlock, saving, blockSaving])

  useEffect(() => {
    if (!selected) return
    const t = window.setTimeout(() => {
      // Drafts: jump into the title so you can name the new event immediately.
      // Saved events: focus the panel heading (not an input) so Delete/Backspace work.
      if (isDraftEventId(selected.id)) {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      } else {
        panelHeadingRef.current?.focus()
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [selected?.id])

  async function saveSelected(patch: {
    notes?: string
    date?: string
    status?: JobStatus
    start_time?: string
    hours_worked?: number
    client_id?: string
    package_id?: string
  }) {
    if (!selected || isEphemeralEventId(selected.id)) return

    if (selected.id.startsWith('tour-') || selected.id.startsWith('dummy-') || tour?.active) {
      const client =
        clients.find((c) => c.id === (patch.client_id ?? selected.job.client_id)) ?? selected.job.client
      const pkg =
        packages.find((p) => p.id === (patch.package_id ?? selected.job.package_id))
      const hydrated = {
        ...selected.job,
        ...patch,
        client: client ?? selected.job.client,
        packageName: pkg?.name ?? selected.job.packageName,
      }
      setJobs((prev) => prev.map((j) => (j.id === hydrated.id ? hydrated : j)))
      refreshSelected(hydrated)
      toast('Event saved')
      tour?.notifyCreated('job')
      return
    }

    const nextDate = patch.date?.slice(0, 10)
    if (nextDate && nextDate !== selected.date.slice(0, 10)) {
      try {
        const clear = await confirmUnblockDayIfNeeded(nextDate, confirm)
        if (!clear) return
        await reloadBlocks()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Could not remove blocks', 'Day is blocked')
        return
      }
    }
    setSaving(true)
    try {
      const updated = await api.updateJob(selected.id, patch)
      const client =
        clients.find((c) => c.id === (patch.client_id ?? updated.client_id)) ?? updated.client
      const pkg =
        packages.find((p) => p.id === (patch.package_id ?? updated.package_id))
      const hydrated = {
        ...updated,
        client: updated.client ?? client,
        packageName: updated.packageName ?? pkg?.name,
      }
      setJobs((prev) => prev.map((j) => (j.id === hydrated.id ? hydrated : j)))
      refreshSelected(hydrated)
      toast('Event saved')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save', 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveDraftAsBlock() {
    if (!selected || !isDraftEventId(selected.id)) return
    const draft = selected
    const allDay = draft.allDay || !draft.time
    const start_time = allDay ? undefined : draft.time || draft.job.start_time || '09:00'
    const hours =
      draft.job.hours_worked && draft.job.hours_worked > 0 ? draft.job.hours_worked : 1
    const end_time = allDay || !start_time ? undefined : endHHMMFromStart(start_time, hours)
    const label =
      draft.title.trim() && draft.title.trim() !== 'New event'
        ? draft.title.trim()
        : 'Time off'
    setSaving(true)
    try {
      const created = await api.createTimeBlock({
        date: draft.date.slice(0, 10),
        all_day: allDay,
        start_time,
        end_time,
        label,
      })
      await reloadBlocks()
      setSelected(null)
      setAsBlocked(false)
      setSelectedBlock(created)
      toast('Time blocked')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not block time', 'Calendar')
    } finally {
      setSaving(false)
    }
  }

  async function convertSelectedToBlock() {
    if (!selected || isEphemeralEventId(selected.id)) return
    const ev = selected
    const allDay = ev.allDay || !ev.time
    const start_time = allDay ? undefined : ev.time || ev.job.start_time || '09:00'
    const hours =
      ev.job.hours_worked && ev.job.hours_worked > 0 ? ev.job.hours_worked : 1
    const end_time = allDay || !start_time ? undefined : endHHMMFromStart(start_time, hours)
    const label = ev.title.trim() || 'Time off'
    setSaving(true)
    try {
      const created = await api.createTimeBlock({
        date: ev.date.slice(0, 10),
        all_day: allDay,
        start_time,
        end_time,
        label,
      })
      await api.deleteJob(ev.id)
      clearEventMeta(ev.id)
      setJobs((prev) =>
        prev.map((j) => (j.id === ev.id ? { ...j, status: 'cancelled' as const } : j)),
      )
      await reloadBlocks()
      setSelected(null)
      setAsBlocked(false)
      setSelectedBlock(created)
      toast('Converted to blocked time')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not convert', 'Calendar')
    } finally {
      setSaving(false)
    }
  }

  async function saveDraft() {
    if (!selected || !isDraftEventId(selected.id)) return
    if (asBlocked) {
      await saveDraftAsBlock()
      return
    }
    const client =
      clients.find((c) => c.id === selected.job.client_id) ?? clients[0]
    const pkg =
      packages.find((p) => p.id === selected.job.package_id) ??
      packages.filter((p) => p.active)[0] ??
      packages[0]
    if (!client || !pkg) {
      await ensureClientsAndPackages('create this event')
      return
    }
    try {
      const clear = await confirmUnblockDayIfNeeded(selected.date, confirm)
      if (!clear) return
      await reloadBlocks()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove blocks', 'Day is blocked')
      return
    }
    const draft = selected
    const allDay = draft.allDay
    const start_time = allDay ? undefined : draft.time || draft.job.start_time || '09:00'
    const hours_worked = allDay
      ? 0
      : draft.job.hours_worked && draft.job.hours_worked > 0
        ? draft.job.hours_worked
        : 1
    const notes = draft.title.trim() || 'New event'

    if (tour?.active) {
      const hydrated: DeskJob = {
        id: `tour-job-${Date.now()}`,
        client_id: client.id,
        package_id: pkg.id,
        date: draft.date,
        start_time,
        notes,
        revenue: pkg.base_price,
        hours_worked,
        status: 'scheduled',
        tip: 0,
        client,
        packageName: pkg.name,
      }
      setJobs((prev) => [hydrated, ...prev.filter((j) => j.id !== hydrated.id)])
      assignEventCategory(hydrated.id, draft.categoryId || categories[0]?.id || 'meeting')
      if (draft.color) assignEventColor(hydrated.id, draft.color)
      setCategories(loadCategories())
      setColorTick((t) => t + 1)
      select(jobToEvent(hydrated, loadCategories()))
      toast('Event created')
      tour?.notifyCreated('job')
      return
    }

    setSaving(true)
    try {
      const created = await api.createJob({
        client_id: client.id,
        package_id: pkg.id,
        date: draft.date,
        start_time,
        notes,
        revenue: pkg.base_price,
        hours_worked,
      })
      const hydrated = {
        ...created,
        notes: created.notes || notes,
        client: created.client ?? client,
        packageName: created.packageName ?? pkg.name,
      }
      setJobs((prev) => [hydrated, ...prev.filter((j) => j.id !== hydrated.id)])
      assignEventCategory(hydrated.id, draft.categoryId || categories[0]?.id || 'meeting')
      if (draft.color) assignEventColor(hydrated.id, draft.color)
      setCategories(loadCategories())
      setColorTick((t) => t + 1)
      select(jobToEvent(hydrated, loadCategories()))
      toast('Event created')
      tour?.notifyCreated('job')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create event', 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  async function persistEventTimes(jobId: string, start: Date, end: Date | null, allDay: boolean) {
    if (isEphemeralEventId(jobId)) return false
    if (jobId.startsWith('tour-') || jobId.startsWith('dummy-') || tour?.active) {
      const date = formatDateLocal(start)
      const startTime = allDay ? '' : formatTimeLocal(start)
      const hoursWorked = allDay ? 0 : end ? durationHours(start, end) : 1
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, date, start_time: startTime, hours_worked: hoursWorked } : j,
        ),
      )
      toast('Schedule updated')
      tour?.notifyCreated('job')
      return true
    }
    try {
      const clear = await confirmUnblockDayIfNeeded(formatDateLocal(start), confirm)
      if (!clear) return false
      await reloadBlocks()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove blocks', 'Day is blocked')
      return false
    }
    try {
      const patch: Parameters<typeof api.updateJob>[1] = {
        date: formatDateLocal(start),
      }
      if (allDay) {
        patch.start_time = ''
        patch.hours_worked = 0
      } else {
        patch.start_time = formatTimeLocal(start)
        patch.hours_worked = end ? durationHours(start, end) : 1
      }
      const updated = await api.updateJob(jobId, patch)
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
      if (selected?.id === jobId) select(jobToEvent(updated, categories))
      toast('Schedule updated')
      return true
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not move event', 'Update failed')
      calendarRef.current?.getApi().refetchEvents()
      // Force remount data from jobs state
      setJobs((prev) => [...prev])
      return false
    }
  }

  function onEventDrop(info: EventDropArg) {
    const kind = (info.event.extendedProps as { kind?: string }).kind
    if (kind === 'block' || kind === 'draft' || isEphemeralEventId(info.event.id)) {
      info.revert()
      return
    }
    const start = info.event.start
    if (!start) {
      info.revert()
      return
    }
    void (async () => {
      const ok = await persistEventTimes(info.event.id, start, info.event.end, info.event.allDay)
      if (!ok) info.revert()
    })()
  }

  function onEventResize(info: EventResizeDoneArg) {
    const kind = (info.event.extendedProps as { kind?: string }).kind
    if (kind === 'block' || kind === 'draft' || isEphemeralEventId(info.event.id)) {
      info.revert()
      return
    }
    const start = info.event.start
    const end = info.event.end
    if (!start || !end) {
      info.revert()
      return
    }
    void (async () => {
      const ok = await persistEventTimes(info.event.id, start, end, false)
      if (!ok) info.revert()
    })()
  }

  function onEventClick(info: EventClickArg) {
    const props = info.event.extendedProps as {
      kind?: string
      job?: DeskJob
      block?: DeskTimeBlock
      date?: string
    }
    if (props.kind === 'schedule-closed') {
      const date =
        props.date?.slice(0, 10) ||
        (info.event.startStr ? info.event.startStr.slice(0, 10) : '')
      if (!date) return
      void (async () => {
        try {
          const ok = await confirmUnblockCalendarDay(date, confirm)
          if (!ok) return
          await refreshScheduleAndBlocks()
          toast('Day unblocked')
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Could not unblock day', 'Day is blocked')
        }
      })()
      return
    }
    if (props.kind === 'block') {
      if (props.block) {
        setSelected(null)
        setAsBlocked(false)
        setSelectedBlock(props.block)
      }
      return
    }
    if (props.kind === 'draft') {
      // Already selected draft preview
      return
    }
    const job = props.job
    if (job && !isDraftEventId(job.id)) {
      select(jobToEvent(job, categories))
      if (tour?.active && tour.stop.id === 'calendar') {
        toast(`Inspected scheduled job: ${job.packageName || 'Detail'}`)
        tour?.notifyCreated('job')
      }
    }
  }

  function openDraftFromRange(start: Date, end: Date | null, allDay: boolean) {
    const date = formatDateLocal(start)
    let startTime: string | undefined
    let hoursWorked = 1
    if (!allDay) {
      startTime = formatTimeLocal(start)
      if (end) {
        hoursWorked = durationHours(start, end)
      }
    }
    openDraft(
      buildDraftCalEvent({
        date,
        startTime,
        hoursWorked,
        allDay,
        title: 'New event',
        cats: categories,
        client: clients[0],
        pkg: packages[0],
      }),
    )
  }

  /** Drag-to-create: selection spans start → end (requires selectMinDistance). */
  function onDateSelect(arg: DateSelectArg) {
    openDraftFromRange(arg.start, arg.end ?? null, arg.allDay)
  }

  /** Double-click empty slot/day to create a 1-hour (or all-day) draft. */
  function onDateClick(arg: DateClickArg) {
    if (arg.jsEvent.detail !== 2) return
    const start = arg.date
    let end: Date | null = null
    if (!arg.allDay) {
      end = new Date(start.getTime())
      end.setHours(end.getHours() + 1)
    }
    openDraftFromRange(start, end, arg.allDay)
  }

  const slotLabelFormat = { hour: 'numeric' as const, minute: '2-digit' as const, omitZeroMinute: false, meridiem: 'short' as const }

  return (
    <div
      className={`flex flex-col flex-1 overflow-hidden ${
        tour?.isArmed('calendar-panel') || tour?.isArmed('calendar-new')
          ? 'tour-armed relative z-[55] pointer-events-auto'
          : ''
      }`}
      data-tour-target="calendar-panel"
      onClick={() => {
        if (tour?.active && tour.stop.id === 'calendar') {
          tour.notifyCreated('job')
        }
      }}
    >
      <Header
        title="Calendar"
        subtitle="Jobs & time off (shared with mobile)"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={blockSaving}
              onClick={() => void openCreateTimeBlock({ date: anchorDate.slice(0, 10) })}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40"
            >
              <CalendarOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Block time
            </button>
            <button
              type="button"
              data-tour-target="calendar-new"
              onClick={() => openNewEventDraft()}
              className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-green-600 ${
                tour?.isArmed('calendar-new')
                  ? 'tour-armed relative z-[55] pointer-events-auto ring-2 ring-white/80'
                  : ''
              }`}
              style={{ background: colors.green }}
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              New event
            </button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 flex-wrap">
            <div className="flex items-center gap-1" role="group" aria-label="Navigate calendar">
              <button
                type="button"
                aria-label="Previous period"
                onClick={() => {
                  if (useCustomSurface || weekIsEmpty) shiftAnchor(-1)
                  else calendarRef.current?.getApi().prev()
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next period"
                onClick={() => {
                  if (useCustomSurface || weekIsEmpty) shiftAnchor(1)
                  else calendarRef.current?.getApi().next()
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                ›
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (useCustomSurface || weekIsEmpty) goTodayAnchor()
                else calendarRef.current?.getApi().today()
              }}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              Today
            </button>
            <h2 className="text-lg font-semibold text-gray-900 ml-1">{title || `${MONTHS[now.getMonth()]} ${now.getFullYear()}`}</h2>

            {view === 'day' && (
              <div className="ml-2 flex items-center gap-2" role="group" aria-label="Day layout">
                <span className="text-[12px] font-medium text-gray-400">Day layout</span>
                <div className="inline-flex items-center rounded-lg bg-gray-100 p-0.5">
                  {(
                    [
                      {
                        id: 'grid' as const,
                        label: 'Grid',
                        Icon: CalendarDays,
                        title: 'Hour grid from 12 AM to 12 AM',
                      },
                      {
                        id: 'agenda' as const,
                        label: 'Agenda',
                        Icon: ListOrdered,
                        title: 'Chronological list for the day',
                      },
                      {
                        id: 'thirds' as const,
                        label: 'AM/PM',
                        Icon: Sun,
                        title: 'Morning / afternoon columns',
                      },
                    ] as const
                  ).map((opt) => {
                    const active = dayLayout === opt.id
                    const Icon = opt.Icon
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => applyDayLayout(opt.id)}
                        title={opt.title}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                          active
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/[0.04]'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-700" aria-hidden="true">
                <span className="inline-block w-3 h-3 rounded-sm bg-slate-400/50 border border-slate-500" />
                Blocked
              </div>
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden" role="group" aria-label="Calendar view">
                {(['month', 'week', 'day', 'schedule'] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => changeView(v)}
                    className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500 ${
                      view === v ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={view === v ? { background: colors.green } : {}}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={calendarHostRef}
            className="flex-1 overflow-hidden relative flex flex-col min-h-0"
          >
            {view === 'day' && dayLayout === 'agenda' ? (
              <DayAgendaView
                dateISO={anchorDate.slice(0, 10)}
                jobs={jobs}
                blocks={timeBlocks}
                scheduleClosed={scheduleClosedDates.has(anchorDate.slice(0, 10))}
                categories={categories}
                selectedId={selected && !isDraftEventId(selected.id) ? selected.id : null}
                selectedBlockId={selectedBlock?.id ?? null}
                onSelectJob={(job) => select(jobToEvent(job, categories))}
                onSelectBlock={(block) => {
                  setSelected(null)
                  setAsBlocked(false)
                  setSelectedBlock(block)
                }}
                onDraftAt={openDraftAtHour}
                onUnblockDay={(iso) => {
                  void (async () => {
                    try {
                      const ok = await confirmUnblockCalendarDay(iso, confirm)
                      if (!ok) return
                      await refreshScheduleAndBlocks()
                      toast('Day unblocked')
                    } catch (err) {
                      alert(
                        err instanceof Error ? err.message : 'Could not unblock day',
                        'Day is blocked',
                      )
                    }
                  })()
                }}
              />
            ) : null}

            {view === 'day' && dayLayout === 'thirds' ? (
              <DayAmPmView
                dateISO={anchorDate.slice(0, 10)}
                jobs={jobs}
                blocks={timeBlocks}
                scheduleClosed={scheduleClosedDates.has(anchorDate.slice(0, 10))}
                categories={categories}
                selectedId={selected && !isDraftEventId(selected.id) ? selected.id : null}
                selectedBlockId={selectedBlock?.id ?? null}
                onSelectJob={(job) => select(jobToEvent(job, categories))}
                onSelectBlock={(block) => {
                  setSelected(null)
                  setAsBlocked(false)
                  setSelectedBlock(block)
                }}
                onDraftAt={openDraftAtHour}
                onUnblockDay={(iso) => {
                  void (async () => {
                    try {
                      const ok = await confirmUnblockCalendarDay(iso, confirm)
                      if (!ok) return
                      await refreshScheduleAndBlocks()
                      toast('Day unblocked')
                    } catch (err) {
                      alert(
                        err instanceof Error ? err.message : 'Could not unblock day',
                        'Day is blocked',
                      )
                    }
                  })()
                }}
              />
            ) : null}

            {view === 'schedule' ? (
              <ScheduleListView
                anchorISO={anchorDate.slice(0, 10)}
                jobs={jobs}
                blocks={timeBlocks}
                scheduleClosedDates={scheduleClosedDates}
                categories={categories}
                selectedId={selected && !isDraftEventId(selected.id) ? selected.id : null}
                selectedBlockId={selectedBlock?.id ?? null}
                onSelectJob={(job) => select(jobToEvent(job, categories))}
                onSelectBlock={(block) => {
                  setSelected(null)
                  setAsBlocked(false)
                  setSelectedBlock(block)
                }}
                onOpenRoutes={() => setPage('routes')}
                onUnblockDay={(iso) => {
                  void (async () => {
                    try {
                      const ok = await confirmUnblockCalendarDay(iso, confirm)
                      if (!ok) return
                      await refreshScheduleAndBlocks()
                      toast('Day unblocked')
                    } catch (err) {
                      alert(
                        err instanceof Error ? err.message : 'Could not unblock day',
                        'Day is blocked',
                      )
                    }
                  })()
                }}
              />
            ) : null}

            {weekIsEmpty ? (
              <CleanWeekEmpty
                anchorISO={anchorDate.slice(0, 10)}
                onDraftAt={openDraftAtHour}
                onNewEvent={openNewEventDraft}
                onBlockTime={() =>
                  void openCreateTimeBlock({ date: anchorDate.slice(0, 10), allDay: true })
                }
              />
            ) : null}

            <div
              className={
                showFc
                  ? 'flex-1 min-h-0 px-2 pb-2'
                  : 'absolute w-px h-px overflow-hidden opacity-0 pointer-events-none'
              }
              aria-hidden={!showFc}
            >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={VIEW_MAP.week}
              headerToolbar={false}
              height="100%"
              events={fcEvents}
              editable
              selectable
              selectMirror
              selectMinDistance={6}
              nowIndicator
              eventStartEditable
              eventDurationEditable
              eventResizableFromStart
              dragScroll
              allDaySlot
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              slotDuration="00:30:00"
              snapDuration="00:15:00"
              scrollTime="07:00:00"
              expandRows
              weekends
              dayMaxEvents={3}
              slotLabelFormat={slotLabelFormat}
              slotLaneClassNames={slotLaneClassNames}
              slotLabelContent={slotLabelContent}
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              datesSet={(arg) => {
                if (!showFc) return
                setTitle(arg.view.title)
                setAnchorDate(formatDateLocal(arg.view.currentStart))
                void loadBlocksForRange(arg.start, arg.end)
              }}
              eventClick={onEventClick}
              eventDrop={onEventDrop}
              eventResize={onEventResize}
              select={onDateSelect}
              dateClick={onDateClick}
              eventClassNames={(arg) => {
                const kind = (arg.event.extendedProps as { kind?: string }).kind
                if (kind === 'block' || kind === 'schedule-closed') return ['fc-time-block']
                const classes = ['cursor-pointer', 'fc-job-event']
                if (selected?.id && arg.event.id === selected.id) {
                  classes.push('fc-event-selected')
                }
                return classes
              }}
              eventDidMount={(info) => {
                info.el.setAttribute('data-cal-event-id', info.event.id)
                if (info.event.id === 'tour-job-1' || info.event.id.startsWith('tour-')) {
                  info.el.setAttribute('data-tour-target', 'calendar-event')
                }
                const kind = (info.event.extendedProps as { kind?: string }).kind
                if (kind === 'block' || kind === 'schedule-closed') return
                if (kind === 'draft') {
                  info.el.setAttribute('aria-label', 'Draft event, not saved')
                }
                const isSelected = Boolean(selected?.id && info.event.id === selected.id)
                info.el.setAttribute('aria-selected', isSelected ? 'true' : 'false')
                if (isSelected) info.el.setAttribute('aria-current', 'true')
                else info.el.removeAttribute('aria-current')
              }}
              eventAllow={(_span, moving) => {
                const kind = (moving?.extendedProps as { kind?: string } | undefined)?.kind
                return kind !== 'block' && kind !== 'schedule-closed' && kind !== 'draft'
              }}
            />
            </div>
          </div>
        </div>

        {panelOpen && selectedBlock && (
        <aside
          className="relative w-72 bg-white border-l border-gray-100 flex flex-col overflow-hidden flex-shrink-0"
          aria-label="Time block details"
        >
          <PanelEdgeToggle side="right" expanded onToggle={dismissPanel} label="block details" />
          <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 outline-none">Time off</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Shared with mobile — blocks unavailable time on the calendar.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissPanel}
              aria-label="Close block panel"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
              <input
                type="text"
                defaultValue={selectedBlock.label || 'Time off'}
                key={selectedBlock.id + '-label'}
                onBlur={(e) => {
                  const next = e.target.value.trim() || 'Time off'
                  if (next !== (selectedBlock.label || '').trim()) {
                    void saveSelectedBlock({ label: next })
                  }
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 text-gray-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
              <input
                type="date"
                defaultValue={selectedBlock.date}
                key={selectedBlock.id + '-date'}
                onChange={(e) => void saveSelectedBlock({ date: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 text-gray-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">All day</label>
              <select
                defaultValue={selectedBlock.all_day ? 'yes' : 'no'}
                key={selectedBlock.id + '-allday'}
                onChange={(e) => {
                  const allDay = e.target.value === 'yes'
                  void saveSelectedBlock({
                    all_day: allDay,
                    start_time: allDay ? '' : selectedBlock.start_time || '09:00',
                    end_time: allDay ? '' : selectedBlock.end_time || '17:00',
                  })
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 text-gray-900"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {!selectedBlock.all_day && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Start</label>
                  <input
                    type="time"
                    defaultValue={(selectedBlock.start_time || '09:00').slice(0, 5)}
                    key={selectedBlock.id + '-start'}
                    onChange={(e) => void saveSelectedBlock({ start_time: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End</label>
                  <input
                    type="time"
                    defaultValue={(selectedBlock.end_time || '17:00').slice(0, 5)}
                    key={selectedBlock.id + '-end'}
                    onChange={(e) => void saveSelectedBlock({ end_time: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 text-gray-900"
                  />
                </div>
              </>
            )}
            {selectedBlock.all_day &&
            jobs.some(
              (j) =>
                j.status !== 'cancelled' &&
                j.date.slice(0, 10) === selectedBlock.date.slice(0, 10),
            ) ? (
              <p className="text-[12px] text-ink-500 leading-snug rounded-lg bg-ink-50 px-3 py-2">
                This day still has jobs. The block grays availability — it doesn&apos;t cancel
                those events. Switch to timed hours if you only meant part of the day.
              </p>
            ) : null}
            <button
              type="button"
              disabled={blockSaving}
              onClick={() => void deleteSelectedBlock()}
              className="w-full py-2 text-xs font-medium rounded-lg mt-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60"
            >
              {blockSaving ? 'Removing…' : 'Remove block'}
            </button>
          </div>
        </aside>
        )}

        {panelOpen && selected && !selectedBlock && (
          view === 'month' ? (
          <EventPopover
            model={{
              id: selected.id,
              title: selected.title,
              date: selected.date,
              time: selected.time,
              allDay: selected.allDay,
              hoursWorked: selected.job.hours_worked || (selected.time ? 1 : 0),
              clientId: selected.job.client_id || '',
              packageId: selected.job.package_id || '',
              notes: selected.job.notes || '',
              categoryId: selected.categoryId,
              color: selected.color,
              statusLabel: `${selected.job.status.replace('_', ' ')}${
                selected.job.client?.name ? ` · ${selected.job.client.name}` : ''
              }${selected.job.packageName ? ` · ${selected.job.packageName}` : ''}`,
              isDraft,
            }}
            clients={clients}
            packages={packages}
            categories={categories}
            saving={saving}
            calendarRoot={calendarHostRef.current}
            headingRef={panelHeadingRef}
            titleInputRef={titleInputRef}
            onClose={dismissPanel}
            onChangeTitle={(title) => {
              if (isDraft) patchDraft({ title })
              else void saveSelected({ notes: title })
            }}
            onChangeClient={(clientId) => {
              if (isDraft) {
                patchDraft({ client_id: clientId })
                return
              }
              void saveSelected({ client_id: clientId })
            }}
            onChangeLocation={async ({ address, lat, lng }) => {
              const clientId = selected.job.client_id
              if (!clientId) {
                alert('Pick a contact before adding a location.', 'Calendar')
                return
              }
              const patch: Parameters<typeof api.updateClient>[1] = { address }
              if (lat !== undefined) patch.lat = lat
              if (lng !== undefined) patch.lng = lng
              if (lat === null || lng === null) {
                patch.geocoded_at = null
              } else if (typeof lat === 'number' && typeof lng === 'number') {
                patch.geocoded_at = new Date().toISOString()
              }
              const updated = await api.updateClient(clientId, patch)
              setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
              setJobs((prev) =>
                prev.map((j) =>
                  j.client_id === updated.id
                    ? { ...j, client: j.client ? { ...j.client, ...updated } : updated }
                    : j,
                ),
              )
              setSelected((prev) =>
                prev
                  ? {
                      ...prev,
                      job: {
                        ...prev.job,
                        client: prev.job.client ? { ...prev.job.client, ...updated } : updated,
                        client_id: updated.id,
                      },
                    }
                  : prev,
              )
              toast('Location saved')
            }}
            onChangePackage={(packageId) => {
              if (isDraft) {
                patchDraft({ package_id: packageId })
                return
              }
              void saveSelected({ package_id: packageId })
            }}
            onChangeDate={(date) => {
              if (isDraft) patchDraft({ date })
              else void saveSelected({ date })
            }}
            onChangeTime={(time) => {
              if (isDraft) {
                patchDraft({
                  time,
                  hours_worked: time ? selected.job.hours_worked || 1 : 0,
                })
                return
              }
              void saveSelected({
                start_time: time || '',
                hours_worked: time ? selected.job.hours_worked || 1 : 0,
              })
            }}
            onChangeDuration={(hours) => {
              if (isDraft) patchDraft({ hours_worked: hours })
              else void saveSelected({ hours_worked: hours })
            }}
            onChangeNotes={(notes) => {
              if (isDraft) patchDraft({ title: notes || 'New event' })
              else void saveSelected({ notes })
            }}
            onChangeCategory={(categoryId) => setEventCategory(selected.id, categoryId)}
            onChangeColor={(color) => onRecolorEvent(selected.id, color)}
            onCategoriesChange={setCategories}
            asBlocked={asBlocked}
            onChangeAsBlocked={setAsBlocked}
            onSave={() => {
              if (isDraft) void saveDraft()
              else if (asBlocked) void convertSelectedToBlock()
              else void saveSelected({ notes: selected.title })
            }}
            onDelete={isDraft ? undefined : () => void deleteSelected()}
          />
          ) : (
          <EventDetailSidebar
            model={{
              id: selected.id,
              title: selected.title,
              date: selected.date,
              time: selected.time,
              allDay: selected.allDay,
              hoursWorked: selected.job.hours_worked || (selected.time ? 1 : 0),
              clientId: selected.job.client_id || '',
              packageId: selected.job.package_id || '',
              notes: selected.job.notes || '',
              categoryId: selected.categoryId,
              color: selected.color,
              statusLabel: `${selected.job.status.replace('_', ' ')}${
                selected.job.client?.name ? ` · ${selected.job.client.name}` : ''
              }${selected.job.packageName ? ` · ${selected.job.packageName}` : ''}`,
              isDraft,
            }}
            clients={clients}
            packages={packages}
            categories={categories}
            saving={saving}
            headingRef={panelHeadingRef}
            titleInputRef={titleInputRef}
            onClose={dismissPanel}
            onChangeTitle={(title) => {
              if (isDraft) patchDraft({ title })
              else void saveSelected({ notes: title })
            }}
            onChangeClient={(clientId) => {
              if (isDraft) {
                patchDraft({ client_id: clientId })
                return
              }
              void saveSelected({ client_id: clientId })
            }}
            onChangeLocation={async ({ address, lat, lng }) => {
              const clientId = selected.job.client_id
              if (!clientId) {
                alert('Pick a contact before adding a location.', 'Calendar')
                return
              }
              const patch: Parameters<typeof api.updateClient>[1] = { address }
              if (lat !== undefined) patch.lat = lat
              if (lng !== undefined) patch.lng = lng
              if (lat === null || lng === null) {
                patch.geocoded_at = null
              } else if (typeof lat === 'number' && typeof lng === 'number') {
                patch.geocoded_at = new Date().toISOString()
              }
              const updated = await api.updateClient(clientId, patch)
              setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
              setJobs((prev) =>
                prev.map((j) =>
                  j.client_id === updated.id
                    ? { ...j, client: j.client ? { ...j.client, ...updated } : updated }
                    : j,
                ),
              )
              setSelected((prev) =>
                prev
                  ? {
                      ...prev,
                      job: {
                        ...prev.job,
                        client: prev.job.client ? { ...prev.job.client, ...updated } : updated,
                        client_id: updated.id,
                      },
                    }
                  : prev,
              )
              toast('Location saved')
            }}
            onChangePackage={(packageId) => {
              if (isDraft) {
                patchDraft({ package_id: packageId })
                return
              }
              void saveSelected({ package_id: packageId })
            }}
            onChangeDate={(date) => {
              if (isDraft) patchDraft({ date })
              else void saveSelected({ date })
            }}
            onChangeTime={(time) => {
              if (isDraft) {
                patchDraft({
                  time,
                  hours_worked: time ? selected.job.hours_worked || 1 : 0,
                })
                return
              }
              void saveSelected({
                start_time: time || '',
                hours_worked: time ? selected.job.hours_worked || 1 : 0,
              })
            }}
            onChangeDuration={(hours) => {
              if (isDraft) patchDraft({ hours_worked: hours })
              else void saveSelected({ hours_worked: hours })
            }}
            onChangeCategory={(categoryId) => setEventCategory(selected.id, categoryId)}
            onChangeColor={(color) => onRecolorEvent(selected.id, color)}
            onCategoriesChange={setCategories}
            asBlocked={asBlocked}
            onChangeAsBlocked={setAsBlocked}
            onSave={() => {
              if (isDraft) void saveDraft()
              else if (asBlocked) void convertSelectedToBlock()
              else void saveSelected({ notes: selected.title })
            }}
            onDelete={isDraft ? undefined : () => void deleteSelected()}
          />
          )
        )}
      </div>

      <style>{`
        .fc {
          --fc-border-color: #e5e7eb;
          --fc-today-bg-color: #f0fdf4;
          --fc-event-border-color: transparent;
          --fc-page-bg-color: #fff;
          --fc-neutral-bg-color: #f9fafb;
          --fc-list-event-hover-bg-color: #f0fdf4;
          --fc-non-business-color: rgba(100, 116, 139, 0.18);
          font-size: 13px;
          color: #111827;
        }
        .fc .fc-timegrid-slot {
          height: 2.4em;
        }
        .fc .fc-col-header-cell-cushion {
          padding: 8px 4px;
          font-weight: 600;
          font-size: 13px;
          color: #111827;
        }
        .fc .fc-daygrid-day-number {
          color: #111827;
          font-size: 13px;
          font-weight: 500;
          padding: 6px;
        }
        .fc .fc-timegrid-axis-cushion,
        .fc .fc-timegrid-slot-label-cushion {
          color: #4b5563;
          font-size: 12px;
          font-weight: 500;
        }
        /* Current-time indicator — Bolt-style red dot + hairline across today */
        .fc {
          --fc-now-indicator-color: #ef4444;
        }
        .fc .fc-timegrid-now-indicator-arrow {
          display: none;
        }
        .fc .fc-timegrid-now-indicator-line {
          border: none;
          border-top: none;
          height: 1px;
          background: rgba(239, 68, 68, 0.7);
          z-index: 5;
        }
        .fc .fc-timegrid-now-indicator-line::before {
          content: '';
          position: absolute;
          left: -4px;
          top: -3.5px;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
        }
        .fc .fc-list-day-cushion {
          color: #111827;
          font-size: 13px;
        }
        .fc .fc-list-event-time,
        .fc .fc-list-event-title {
          color: #1f2937;
          font-size: 13px;
        }
        .fc .fc-event {
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 5px;
          border: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          transition: box-shadow 0.12s ease, outline 0.12s ease, filter 0.12s ease;
        }
        .fc .fc-event.fc-event-selected {
          outline: 2px solid #ffffff;
          outline-offset: 1px;
          box-shadow:
            0 0 0 3px #111827,
            0 4px 14px rgba(0, 0, 0, 0.28);
          z-index: 6 !important;
          filter: brightness(1.08) saturate(1.05);
        }
        .fc .fc-event.fc-draft-event {
          opacity: 0.92;
          box-shadow: none;
          outline: 2px dashed rgba(255, 255, 255, 0.95);
          outline-offset: 0;
          background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgba(255, 255, 255, 0.22) 4px,
            rgba(255, 255, 255, 0.22) 8px
          );
        }
        .fc .fc-event.fc-draft-event.fc-event-selected {
          box-shadow: 0 0 0 2px #111827;
          filter: none;
        }
        .fc .fc-list-event.fc-event-selected td {
          background: #f0fdf4 !important;
        }
        .fc .fc-list-event.fc-event-selected .fc-list-event-dot {
          box-shadow: 0 0 0 2px #111827;
        }
        .fc .fc-event .fc-event-main {
          color: #fff;
        }
        .fc .fc-event .fc-event-title,
        .fc .fc-event .fc-event-time {
          font-weight: 600;
        }
        .fc .fc-bg-event,
        .fc .fc-time-block.fc-bg-event {
          opacity: 1;
          background: repeating-linear-gradient(
            -45deg,
            rgba(100, 116, 139, 0.28),
            rgba(100, 116, 139, 0.28) 6px,
            rgba(148, 163, 184, 0.18) 6px,
            rgba(148, 163, 184, 0.18) 12px
          ) !important;
        }
        .fc .fc-daygrid-bg-harness .fc-time-block,
        .fc .fc-timegrid-bg-harness .fc-time-block {
          cursor: pointer;
        }
        .fc .fc-time-block.fc-time-block-selected {
          background: repeating-linear-gradient(
            -45deg,
            rgba(71, 85, 105, 0.4),
            rgba(71, 85, 105, 0.4) 6px,
            rgba(100, 116, 139, 0.28) 6px,
            rgba(100, 116, 139, 0.28) 12px
          ) !important;
          outline: 2px solid #475569;
          outline-offset: -2px;
        }
        .fc .fc-time-block.fc-event .fc-event-main {
          color: #1e293b;
        }
        /* Day AM/PM bands — tinted lanes + labels on the time axis */
        .fc-day-thirds .fc-timegrid-slot.fc-slot-band-morning,
        .fc-day-thirds .fc-timegrid-slot-lane.fc-slot-band-morning {
          background: rgba(251, 191, 36, 0.08);
        }
        .fc-day-thirds .fc-timegrid-slot.fc-slot-band-afternoon,
        .fc-day-thirds .fc-timegrid-slot-lane.fc-slot-band-afternoon {
          background: rgba(56, 189, 248, 0.08);
        }
        .fc-day-thirds .fc-timegrid-slot.fc-slot-band-evening,
        .fc-day-thirds .fc-timegrid-slot-lane.fc-slot-band-evening {
          background: rgba(129, 140, 248, 0.1);
        }
        .fc-day-thirds .fc-timegrid-slot.fc-slot-band-night,
        .fc-day-thirds .fc-timegrid-slot-lane.fc-slot-band-night {
          background: rgba(148, 163, 184, 0.06);
        }
        .fc-day-thirds .fc-slot-label-with-band {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          line-height: 1.15;
          padding-right: 4px;
        }
        .fc-day-thirds .fc-slot-band-name {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .fc-day-thirds .fc-slot-label-morning .fc-slot-band-name {
          color: #b45309;
        }
        .fc-day-thirds .fc-slot-label-afternoon .fc-slot-band-name {
          color: #0369a1;
        }
        .fc-day-thirds .fc-slot-label-evening .fc-slot-band-name {
          color: #4338ca;
        }
        .fc-day-thirds .fc-slot-time-text {
          color: #4b5563;
          font-size: 12px;
          font-weight: 500;
        }
        .fc-day-thirds .fc-timegrid-axis {
          width: 4.75rem;
        }
        .fc-day-thirds .fc-timegrid-slot-label {
          vertical-align: top;
        }
      `}</style>
    </div>
  )
}
