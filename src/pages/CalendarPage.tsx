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
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'
import { PanelEdgeToggle } from '@/components/automations/PanelEdgeToggle'
import RouteDayPanel from '@/components/calendar/RouteDayPanel'
import * as api from '@/lib/api'
import { loadAppSettings } from '@/lib/settings-api'
import type { DeskClient, DeskJob, DeskPackage, DeskTimeBlock, JobStatus } from '@/lib/types'
import { colors } from '@/theme/colors'
import { todayISO } from '@/lib/metrics'
import {
  type CalCategory,
  CATEGORY_COLOR_PRESETS,
  addCategory,
  assignEventCategory,
  assignEventColor,
  categoryForJob,
  clearEventMeta,
  colorForJob,
  loadCategories,
  removeCategory,
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

const PRIORITY_COLORS: Record<string, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }
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

/** Day AM/PM bands: Morning 6–12, Afternoon 12–17, Evening 17–24 */
function dayBandForHour(hour: number): 'night' | 'morning' | 'afternoon' | 'evening' {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17) return 'evening'
  return 'night'
}

function dayBandLabel(hour: number, minute: number): string | null {
  if (minute !== 0) return null
  if (hour === 6) return 'Morning'
  if (hour === 12) return 'Afternoon'
  if (hour === 17) return 'Evening'
  return null
}

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
    backgroundColor: 'rgba(100, 116, 139, 0.55)',
    borderColor: '#64748b',
    textColor: '#1e293b',
    display: 'auto' as const,
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

/** List/schedule views — same solid grey blocks. */
function blockToListEvent(block: DeskTimeBlock): EventInput {
  const bg = blockToFcEvent(block)
  return {
    ...bg,
    display: 'auto',
    backgroundColor: '#cbd5e1',
    borderColor: '#64748b',
    textColor: '#1e293b',
  }
}

export default function CalendarPage() {
  const now = new Date()
  const { jobs, setJobs, clients, setClients, packages } = useData()
  const { alert, toast, promptForm } = useUi()
  const { calendarDraft, clearCalendarDraft } = useDeskNav()
  const calendarRef = useRef<FullCalendar | null>(null)
  const panelHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const blocksRangeRef = useRef<{ from: Date; to: Date } | null>(null)

  const [view, setView] = useState<ViewMode>('week')
  const [dayLayout, setDayLayout] = useState<DayLayout>('grid')
  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<DeskTimeBlock | null>(null)
  const [routeMode, setRouteMode] = useState(false)
  const [businessAddress, setBusinessAddress] = useState('')
  const [depotCoords, setDepotCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [blockSaving, setBlockSaving] = useState(false)
  const [anchorDate, setAnchorDate] = useState(todayISO())
  const [categories, setCategories] = useState<CalCategory[]>(() => loadCategories())
  const [colorTick, setColorTick] = useState(0)
  const [timeBlocks, setTimeBlocks] = useState<DeskTimeBlock[]>([])
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLOR_PRESETS[0]!)

  const isDraft = Boolean(selected && isDraftEventId(selected.id))
  const panelOpen = !routeMode && (selected !== null || selectedBlock !== null)

  useEffect(() => {
    setCategories(loadCategories())
  }, [])

  useEffect(() => {
    void loadAppSettings()
      .then((s) => setBusinessAddress(s.business_address ?? ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (view !== 'day') setRouteMode(false)
  }, [view])

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
      alert('Add a package first to schedule a meeting.', 'Calendar')
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
    () => jobs.map((j) => jobToFcEvent(j, categories)),
    [jobs, categories, colorTick],
  )

  const fcView =
    view === 'day' && dayLayout === 'agenda'
      ? 'listDay'
      : VIEW_MAP[view]

  const isListView = fcView === 'listWeek' || fcView === 'listDay'

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
      const mapped = isListView ? blockToListEvent(b) : blockToFcEvent(b)
      if (selectedBlock?.id === b.id) {
        const base = Array.isArray(mapped.classNames)
          ? mapped.classNames
          : mapped.classNames
            ? [mapped.classNames]
            : []
        return {
          ...mapped,
          classNames: [...base, 'fc-event-selected'],
          backgroundColor: '#94a3b8',
        }
      }
      return mapped
    })
    const draftEv =
      selected && isDraftEventId(selected.id) ? [draftToFcEvent(selected)] : []
    return [...jobsMapped, ...blocks, ...draftEv]
  }, [jobFcEvents, timeBlocks, isListView, selected, selectedBlock])

  async function loadBlocksForRange(from: Date, to: Date) {
    blocksRangeRef.current = { from, to }
    const fromISO = formatDateLocal(from)
    // FullCalendar `end` is exclusive — subtract one day for inclusive PB filter
    const toInclusive = new Date(to.getTime() - 24 * 60 * 60 * 1000)
    const toISO = formatDateLocal(toInclusive > from ? toInclusive : to)
    const blocks = await api.listTimeBlocks(fromISO, toISO)
    setTimeBlocks(blocks)
  }

  async function reloadBlocks() {
    if (blocksRangeRef.current) {
      await loadBlocksForRange(blocksRangeRef.current.from, blocksRangeRef.current.to)
    }
  }

  const changeView = useCallback(
    (mode: ViewMode) => {
      setView(mode)
      const api = calendarRef.current?.getApi()
      if (!api) return
      if (mode === 'day' && dayLayout === 'agenda') {
        api.changeView('listDay')
      } else if (mode === 'day' && dayLayout === 'thirds') {
        api.changeView('timeGridDay')
      } else {
        api.changeView(VIEW_MAP[mode])
      }
    },
    [dayLayout],
  )

  const applyDayLayout = useCallback(
    (layout: DayLayout) => {
      setDayLayout(layout)
      if (view !== 'day') return
      const api = calendarRef.current?.getApi()
      if (!api) return
      if (layout === 'agenda') api.changeView('listDay')
      else {
        api.changeView('timeGridDay')
        if (layout === 'thirds') api.scrollToTime('06:00:00')
      }
    },
    [view],
  )

  const showDayBands = view === 'day' && dayLayout === 'thirds'

  const slotLaneClassNames = useCallback(
    (arg: SlotLaneContentArg) => {
      if (!showDayBands || !arg.date) return []
      return [`fc-slot-band-${dayBandForHour(arg.date.getHours())}`]
    },
    [showDayBands],
  )

  const slotLabelContent = useCallback(
    (arg: SlotLabelContentArg) => {
      const timeText = arg.text
      if (!showDayBands || !arg.date) return timeText
      const band = dayBandLabel(arg.date.getHours(), arg.date.getMinutes())
      if (!band) return timeText
      const bandKey = dayBandForHour(arg.date.getHours())
      return (
        <div className={`fc-slot-label-with-band fc-slot-label-${bandKey}`}>
          <span className="fc-slot-band-name">{band}</span>
          <span className="fc-slot-time-text">{timeText}</span>
        </div>
      )
    },
    [showDayBands],
  )

  function select(ev: CalEvent) {
    setRouteMode(false)
    setSelectedBlock(null)
    setSelected(ev)
  }

  function dismissPanel() {
    setSelected(null)
    setSelectedBlock(null)
    setAddingCat(false)
    calendarRef.current?.getApi().unselect()
  }

  function openRouteMode() {
    dismissPanel()
    setRouteMode(true)
  }

  function closeRouteMode() {
    setRouteMode(false)
  }

  function openDraft(ev: CalEvent) {
    setRouteMode(false)
    setSelectedBlock(null)
    setSelected(ev)
    calendarRef.current?.getApi().unselect()
  }

  async function openCreateTimeBlock(defaults?: {
    date?: string
    startTime?: string
    endTime?: string
    allDay?: boolean
  }) {
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
          defaultValue: defaults?.date ?? todayISO(),
        },
        {
          name: 'all_day',
          label: 'All day',
          type: 'select',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          defaultValue: defaults?.allDay === false ? 'no' : 'yes',
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
    const allDay = values.all_day !== 'no'
    setBlockSaving(true)
    try {
      const created = await api.createTimeBlock({
        date: values.date,
        all_day: allDay,
        start_time: allDay ? undefined : values.start_time || '09:00',
        end_time: allDay ? undefined : values.end_time || '17:00',
        label: values.label?.trim() || 'Time off',
      })
      await reloadBlocks()
      setSelected(null)
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
    }>,
  ) {
    setSelected((prev) => {
      if (!prev || !isDraftEventId(prev.id)) return prev
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

  function onAddCategory() {
    const created = addCategory(newCatName || 'New category', newCatColor)
    setCategories(loadCategories())
    setNewCatName('')
    setAddingCat(false)
    if (selected && !isEphemeralEventId(selected.id)) {
      setEventCategory(selected.id, created.id)
    } else if (selected && isDraftEventId(selected.id)) {
      patchDraft({ categoryId: created.id, color: created.color })
    }
  }

  async function deleteSelected() {
    if (!selected || isEphemeralEventId(selected.id)) return
    const id = selected.id
    setSaving(true)
    try {
      await api.deleteJob(id)
      clearEventMeta(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
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
      if (e.key === 'Escape' && selected) {
        e.preventDefault()
        dismissPanel()
        return
      }
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const el = e.target as HTMLElement | null
      if (el?.closest?.('input, textarea, select, [contenteditable="true"]')) return
      if (!selected || isEphemeralEventId(selected.id) || saving) return
      e.preventDefault()
      void deleteSelected()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, saving])

  useEffect(() => {
    if (!selected) return
    const t = window.setTimeout(() => {
      titleInputRef.current?.focus()
      if (!titleInputRef.current) panelHeadingRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [selected?.id])

  async function saveSelected(patch: {
    notes?: string
    date?: string
    status?: JobStatus
    start_time?: string
    hours_worked?: number
  }) {
    if (!selected || isEphemeralEventId(selected.id)) return
    setSaving(true)
    try {
      const updated = await api.updateJob(selected.id, patch)
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
      refreshSelected(updated)
      toast('Event saved')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save', 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveDraft() {
    if (!selected || !isDraftEventId(selected.id)) return
    if (!clients.length || !packages.length) {
      alert('Add a client and package first.', 'Cannot create event')
      return
    }
    const client = clients[0]!
    const pkg = packages[0]!
    const draft = selected
    const allDay = draft.allDay
    const start_time = allDay ? undefined : draft.time || draft.job.start_time || '09:00'
    const hours_worked = allDay
      ? 0
      : draft.job.hours_worked && draft.job.hours_worked > 0
        ? draft.job.hours_worked
        : 1
    const notes = draft.title.trim() || 'New event'
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create event', 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  async function persistEventTimes(jobId: string, start: Date, end: Date | null, allDay: boolean) {
    if (isEphemeralEventId(jobId)) return
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not move event', 'Update failed')
      calendarRef.current?.getApi().refetchEvents()
      // Force remount data from jobs state
      setJobs((prev) => [...prev])
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
    void persistEventTimes(info.event.id, start, info.event.end, info.event.allDay)
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
    void persistEventTimes(info.event.id, start, end, false)
  }

  function onEventClick(info: EventClickArg) {
    const props = info.event.extendedProps as {
      kind?: string
      job?: DeskJob
      block?: DeskTimeBlock
    }
    if (props.kind === 'block') {
      if (props.block) {
        setRouteMode(false)
        setSelected(null)
        setSelectedBlock(props.block)
      }
      return
    }
    if (props.kind === 'draft') {
      // Already selected draft preview
      return
    }
    const job = props.job
    if (job && !isDraftEventId(job.id)) select(jobToEvent(job, categories))
  }

  function onDateSelect(arg: DateSelectArg) {
    const date = formatDateLocal(arg.start)
    const allDay = arg.allDay
    let startTime: string | undefined
    let hoursWorked = 1
    if (!allDay) {
      startTime = formatTimeLocal(arg.start)
      if (arg.end) {
        hoursWorked = durationHours(arg.start, arg.end)
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

  const slotLabelFormat = { hour: 'numeric' as const, minute: '2-digit' as const, omitZeroMinute: false, meridiem: 'short' as const }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Calendar"
        subtitle="Jobs & time off (shared with mobile)"
        actions={
          <button
            type="button"
            disabled={blockSaving}
            onClick={() => void openCreateTimeBlock({ date: anchorDate.slice(0, 10), allDay: true })}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Block time
          </button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 flex-wrap">
            <div className="flex items-center gap-1" role="group" aria-label="Navigate calendar">
              <button
                type="button"
                aria-label="Previous period"
                onClick={() => calendarRef.current?.getApi().prev()}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next period"
                onClick={() => calendarRef.current?.getApi().next()}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                ›
              </button>
            </div>
            <button
              type="button"
              onClick={() => calendarRef.current?.getApi().today()}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              Today
            </button>
            <h2 className="text-lg font-semibold text-gray-900 ml-1">{title || `${MONTHS[now.getMonth()]} ${now.getFullYear()}`}</h2>

            <button
              type="button"
              onClick={() => {
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
              }}
              className="ml-3 px-3 py-1.5 text-sm font-semibold text-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-green-600"
              style={{ background: colors.green }}
            >
              + New event
            </button>

            {view === 'day' && (
              <div className="flex items-center gap-1 ml-2" role="group" aria-label="Day layout">
                <span className="text-xs text-gray-600 mr-1">Day layout</span>
                {(
                  [
                    { id: 'grid' as const, label: 'Grid' },
                    { id: 'agenda' as const, label: 'Agenda' },
                    { id: 'thirds' as const, label: 'AM/PM' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={dayLayout === opt.id}
                    onClick={() => applyDayLayout(opt.id)}
                    className={`px-2.5 py-1.5 text-xs rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                      dayLayout === opt.id
                        ? 'border-green-500 bg-green-50 text-green-900 font-semibold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    title={
                      opt.id === 'grid'
                        ? 'Hour grid from 12 AM to 12 AM'
                        : opt.id === 'agenda'
                          ? 'Chronological list for the day'
                          : 'Morning / afternoon / evening bands'
                    }
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={routeMode}
                  onClick={() => (routeMode ? closeRouteMode() : openRouteMode())}
                  className={`ml-1 px-2.5 py-1.5 text-xs rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                    routeMode
                      ? 'border-green-500 bg-green-50 text-green-900 font-semibold'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Plan stop order on a map"
                >
                  Route
                </button>
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
            className={`flex-1 overflow-hidden px-2 pb-2 relative ${
              showDayBands ? 'fc-day-thirds' : ''
            }`}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={fcView}
              headerToolbar={false}
              height="100%"
              events={fcEvents}
              editable
              selectable
              selectMirror
              eventStartEditable
              eventDurationEditable
              eventResizableFromStart
              dragScroll
              nowIndicator
              allDaySlot
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              slotDuration="00:30:00"
              snapDuration="00:15:00"
              scrollTime={showDayBands ? '06:00:00' : '07:00:00'}
              expandRows
              weekends
              dayMaxEvents={3}
              slotLabelFormat={slotLabelFormat}
              slotLaneClassNames={slotLaneClassNames}
              slotLabelContent={slotLabelContent}
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              datesSet={(arg) => {
                setTitle(arg.view.title)
                setAnchorDate(formatDateLocal(arg.view.currentStart))
                void loadBlocksForRange(arg.start, arg.end)
              }}
              eventClick={onEventClick}
              eventDrop={onEventDrop}
              eventResize={onEventResize}
              select={onDateSelect}
              eventClassNames={(arg) => {
                const kind = (arg.event.extendedProps as { kind?: string }).kind
                if (kind === 'block') return ['fc-time-block']
                const classes = ['cursor-pointer', 'fc-job-event']
                if (selected?.id && arg.event.id === selected.id) {
                  classes.push('fc-event-selected')
                }
                return classes
              }}
              eventDidMount={(info) => {
                const kind = (info.event.extendedProps as { kind?: string }).kind
                if (kind === 'block') return
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
                return kind !== 'block' && kind !== 'draft'
              }}
            />
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
        <aside
          className="relative w-72 bg-white border-l border-gray-100 flex flex-col overflow-hidden flex-shrink-0"
          aria-label={isDraft ? 'New event draft' : 'Task details'}
        >
          <PanelEdgeToggle side="right" expanded onToggle={dismissPanel} label="details" />
          <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3
                ref={panelHeadingRef}
                tabIndex={-1}
                className="text-base font-semibold text-gray-900 outline-none"
              >
                {isDraft ? 'New event' : 'Task Details'}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {isDraft
                  ? 'Unsaved — Save to add to calendar'
                  : 'Drag or resize to reschedule. Press Delete to remove an event.'}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissPanel}
              aria-label="Close event panel"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="cal-event-title">
                  Title
                </label>
                <input
                  id="cal-event-title"
                  ref={titleInputRef}
                  type="text"
                  defaultValue={selected.title}
                  key={selected.id + '-title'}
                  onBlur={(e) => {
                    const next = e.target.value.trim() || 'New event'
                    if (isDraft) {
                      if (next !== selected.title) patchDraft({ title: next })
                      return
                    }
                    if (next !== (selected.job.notes || '').trim()) void saveSelected({ notes: next })
                  }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status note</label>
                <p className="text-sm text-gray-700 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
                  {isDraft
                    ? 'Draft — not saved yet'
                    : `${selected.job.status.replace('_', ' ')}${
                        selected.job.client?.name ? ` · ${selected.job.client.name}` : ''
                      }${selected.job.packageName ? ` · ${selected.job.packageName}` : ''}`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Activity Date</label>
                <input
                  type="date"
                  defaultValue={selected.date}
                  key={selected.id + '-date'}
                  onChange={(e) => {
                    if (isDraft) patchDraft({ date: e.target.value })
                    else void saveSelected({ date: e.target.value })
                  }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Start time</label>
                <input
                  type="time"
                  defaultValue={selected.time || ''}
                  key={selected.id + '-time'}
                  onChange={(e) => {
                    if (isDraft) {
                      patchDraft({
                        time: e.target.value,
                        hours_worked: e.target.value ? selected.job.hours_worked || 1 : 0,
                      })
                      return
                    }
                    void saveSelected({
                      start_time: e.target.value || '',
                      hours_worked: e.target.value ? selected.job.hours_worked || 1 : 0,
                    })
                  }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (hours)</label>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  defaultValue={selected.job.hours_worked || (selected.time ? 1 : 0)}
                  key={selected.id + '-dur'}
                  onChange={(e) => {
                    const hours = Number(e.target.value) || 1
                    if (isDraft) patchDraft({ hours_worked: hours })
                    else void saveSelected({ hours_worked: hours })
                  }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                <div className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[selected.priority] }} />
                  <span className="text-gray-900">{selected.priority}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => {
                    const active = selected.categoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        disabled={saving || (isEphemeralEventId(selected.id) && !isDraft)}
                        onClick={() => setEventCategory(selected.id, cat.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all"
                        style={
                          active
                            ? { borderColor: cat.color, background: cat.color + '22', color: cat.color }
                            : { borderColor: '#e5e7eb', color: '#9ca3af' }
                        }
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                        {cat.name}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setAddingCat((v) => !v)}
                    className="text-xs px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-700"
                  >
                    + Add
                  </button>
                </div>

                {selected.categoryId && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1.5" id="cal-color-label">
                      Color
                    </p>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="cal-color-label">
                      {CATEGORY_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`Set event color ${c}`}
                          aria-pressed={selected.color.toLowerCase() === c.toLowerCase()}
                          title={c}
                          onClick={() => onRecolorEvent(selected.id, c)}
                          className={`w-6 h-6 rounded-full border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-800 ${
                            selected.color.toLowerCase() === c.toLowerCase()
                              ? 'border-gray-900 scale-110'
                              : 'border-white shadow ring-1 ring-gray-300'
                          }`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {categories.length > 1 && selected.categoryId && !isDraft && (
                  <button
                    type="button"
                    className="mt-2 w-full py-2 text-sm font-medium rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    onClick={() => {
                      setCategories(removeCategory(selected.categoryId))
                      setColorTick((t) => t + 1)
                      const job = jobs.find((j) => j.id === selected.id)
                      if (job) refreshSelected(job)
                    }}
                  >
                    Delete category
                  </button>
                )}

                {addingCat && (
                  <div className="mt-2 p-2 rounded-lg border border-gray-100 bg-gray-50 space-y-2">
                    <input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Category name"
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCatColor(c)}
                          className={`w-5 h-5 rounded-full border-2 ${
                            newCatColor === c ? 'border-gray-800' : 'border-white ring-1 ring-gray-200'
                          }`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={onAddCategory}
                        className="flex-1 text-xs py-1.5 rounded-lg text-white font-medium"
                        style={{ background: colors.green }}
                      >
                        Add category
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingCat(false)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {isDraft ? (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveDraft()}
                    className="w-full py-2 text-xs font-medium text-white rounded-lg mt-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: colors.green }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={dismissPanel}
                    className="w-full py-2 text-xs font-medium rounded-lg mt-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={saving || isEphemeralEventId(selected.id)}
                    onClick={() => void saveSelected({ notes: selected.title })}
                    className="w-full py-2 text-xs font-medium text-white rounded-lg mt-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: colors.blue }}
                  >
                    {saving ? 'Saving…' : 'Save Task'}
                  </button>
                  <button
                    type="button"
                    disabled={saving || isEphemeralEventId(selected.id)}
                    onClick={() => void deleteSelected()}
                    className="w-full py-2 text-xs font-medium rounded-lg mt-1.5 border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    Delete event
                  </button>
                </>
              )}
            </div>
        </aside>
        )}

        {routeMode && view === 'day' && (
          <RouteDayPanel
            date={anchorDate}
            jobs={jobs}
            setJobs={setJobs}
            setClients={setClients}
            businessAddress={businessAddress}
            depotCoords={depotCoords}
            onDepotCoords={setDepotCoords}
            onClose={closeRouteMode}
            toast={(msg) => toast(msg)}
          />
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
        .fc .fc-bg-event {
          opacity: 1;
          background: repeating-linear-gradient(
            -45deg,
            rgba(100, 116, 139, 0.22),
            rgba(100, 116, 139, 0.22) 6px,
            rgba(100, 116, 139, 0.12) 6px,
            rgba(100, 116, 139, 0.12) 12px
          ) !important;
        }
        .fc .fc-time-block.fc-event .fc-event-main {
          color: #1e293b;
        }
        .fc .fc-timegrid-now-indicator-line {
          border-color: ${colors.green};
        }
        .fc .fc-timegrid-now-indicator-arrow {
          border-top-color: ${colors.green};
          border-bottom-color: ${colors.green};
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
