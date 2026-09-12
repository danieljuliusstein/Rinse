import { CalendarClock, Coffee, Clock, Gauge, Car, Plus, X } from 'lucide-react'
import { Card, CardHeader, CardBody, Field, Select, TextInput, Toggle, Divider } from '../primitives'
import type { DeskAppSettings } from '@/lib/settings-api'
import {
  ARRIVAL_WINDOW_OPTIONS,
  BUFFER_OPTIONS,
  DRIVE_TIME_PAD_OPTIONS,
  SLOT_INTERVALS,
  WEEKDAY_LABELS,
  lunchBreakEnabled,
} from '@/lib/booking-schedule'

function BufferMeter({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-200">
      <div
        className="h-full rounded-full bg-brand-400 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** Ensure current PB value appears in the select even if outside the usual list. */
function withCurrentOption(options: readonly number[], current: number, format: (n: number) => string) {
  const values = options.includes(current as (typeof options)[number])
    ? [...options]
    : [...options, current].sort((a, b) => a - b)
  return values.map((n) => (
    <option key={n} value={n}>
      {format(n)}
    </option>
  ))
}

export function ScheduleSection({
  settings,
  setSettings,
  patchSchedule,
  toggleWorkDay,
  addOpenDate,
  removeOpenDate,
}: {
  settings: DeskAppSettings
  setSettings: (patch: Partial<DeskAppSettings>) => void
  patchSchedule: (patch: Partial<DeskAppSettings['booking_schedule']>) => void
  toggleWorkDay: (day: number) => void
  addOpenDate: (date: string) => void
  removeOpenDate: (date: string) => void
}) {
  const schedule = settings.booking_schedule
  const lunchOn = lunchBreakEnabled(schedule)
  const travelDisplay =
    settings.travel_rate_per_mile > 0 ? String(settings.travel_rate_per_mile) : ''
  const maxJobsDisplay = schedule.max_jobs_per_day > 0 ? String(schedule.max_jobs_per_day) : ''

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Work days & hours"
          description="Days clients can book online, and your daily window."
          icon={<CalendarClock size={16} />}
          accent
        />
        <CardBody className="space-y-5">
          <Field label="Work days" hint="Synced to mobile via app_settings.booking_schedule.">
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((w) => {
                const active = schedule.work_days.includes(w.day)
                return (
                  <button
                    key={w.day}
                    type="button"
                    onClick={() => toggleWorkDay(w.day)}
                    title={w.label}
                    className={`min-w-[46px] rounded-xl border px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/15'
                        : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 hover:bg-ink-50/50'
                    }`}
                  >
                    {w.short}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Day start" htmlFor="day-start">
              <TextInput
                id="day-start"
                type="time"
                value={schedule.start_time}
                onChange={(v) => patchSchedule({ start_time: v })}
              />
            </Field>
            <Field label="Day end" htmlFor="day-end">
              <TextInput
                id="day-end"
                type="time"
                value={schedule.end_time}
                onChange={(v) => patchSchedule({ end_time: v })}
              />
            </Field>
          </div>

          <Divider />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Coffee size={15} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink-900">Lunch break</p>
                <p className="text-[12px] text-ink-500">
                  Block a daily lunch window from booking.
                </p>
              </div>
            </div>
            <Toggle
              checked={lunchOn}
              onChange={(v) =>
                patchSchedule(
                  v
                    ? {
                        lunch_start: schedule.lunch_start || '12:00',
                        lunch_end: schedule.lunch_end || '13:00',
                      }
                    : { lunch_start: '', lunch_end: '' },
                )
              }
            />
          </div>
          {lunchOn && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-settings-fade-rise">
              <Field label="Lunch start" htmlFor="lunch-start">
                <TextInput
                  id="lunch-start"
                  type="time"
                  value={schedule.lunch_start || '12:00'}
                  onChange={(v) => patchSchedule({ lunch_start: v })}
                />
              </Field>
              <Field label="Lunch end" htmlFor="lunch-end">
                <TextInput
                  id="lunch-end"
                  type="time"
                  value={schedule.lunch_end || '13:00'}
                  onChange={(v) => patchSchedule({ lunch_end: v })}
                />
              </Field>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Booking buffers"
          description="Arrival windows, slot starts, and travel padding — same options as mobile."
          icon={<Gauge size={16} />}
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Arrival window"
              hint="Customers book a window (e.g. 8–10 AM), not a fixed end time."
            >
              <Select
                value={schedule.arrival_window_minutes}
                onChange={(v) => patchSchedule({ arrival_window_minutes: Number(v) || 120 })}
              >
                {withCurrentOption(
                  ARRIVAL_WINDOW_OPTIONS,
                  schedule.arrival_window_minutes,
                  (n) => (n >= 60 && n % 60 === 0 ? `${n / 60}h` : `${n} min`),
                )}
              </Select>
            </Field>
            <Field label="Booking slot interval" hint="How often new windows start on the calendar.">
              <Select
                value={schedule.slot_interval_minutes}
                onChange={(v) => {
                  const slot_interval_minutes = Number(v) || 120
                  patchSchedule({
                    slot_interval_minutes,
                    // Keep window aligned when it still matched the previous interval (mobile behavior).
                    arrival_window_minutes:
                      schedule.arrival_window_minutes === schedule.slot_interval_minutes
                        ? slot_interval_minutes
                        : schedule.arrival_window_minutes,
                  })
                }}
              >
                {withCurrentOption(SLOT_INTERVALS, schedule.slot_interval_minutes, (n) => `${n} min`)}
              </Select>
            </Field>
            <Field
              label="Buffer between jobs"
              hint="Extra time blocked after each job so the next window cannot overbook."
            >
              <div>
                <Select
                  value={schedule.buffer_minutes}
                  onChange={(v) => patchSchedule({ buffer_minutes: Number(v) || 0 })}
                >
                  {withCurrentOption(BUFFER_OPTIONS, schedule.buffer_minutes, (n) =>
                    n === 0 ? 'None' : `${n} min`,
                  )}
                </Select>
                <BufferMeter value={schedule.buffer_minutes} max={60} />
              </div>
            </Field>
            <Field
              label="Drive-time pad"
              hint="Travel pad between jobs (static ETA). Added on top of the buffer."
            >
              <div>
                <Select
                  value={schedule.drive_time_pad_minutes}
                  onChange={(v) => patchSchedule({ drive_time_pad_minutes: Number(v) || 0 })}
                >
                  {withCurrentOption(DRIVE_TIME_PAD_OPTIONS, schedule.drive_time_pad_minutes, (n) =>
                    n === 0 ? 'None' : `${n} min`,
                  )}
                </Select>
                <BufferMeter value={schedule.drive_time_pad_minutes} max={90} />
              </div>
            </Field>
          </div>
          <Field
            label="Max jobs per day"
            hint="Optional. Leave blank for unlimited — days still auto-block when job time + buffers fill the day."
          >
            <div className="max-w-[160px]">
              <TextInput
                id="max-jobs"
                value={maxJobsDisplay}
                placeholder="Unlimited"
                onChange={(v) => {
                  const trimmed = v.trim()
                  if (!trimmed) {
                    patchSchedule({ max_jobs_per_day: 0 })
                    return
                  }
                  const n = Number(trimmed)
                  patchSchedule({
                    max_jobs_per_day: Number.isFinite(n) && n > 0 ? Math.floor(n) : 0,
                  })
                }}
                inputMode="numeric"
              />
            </div>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Travel rate"
          description="Charged for jobs outside your base zone — same field as mobile Schedule."
          icon={<Car size={16} />}
        />
        <CardBody>
          <Field label="Travel rate ($/mile)">
            <div className="max-w-[200px]">
              <TextInput
                id="travel-rate"
                value={travelDisplay}
                onChange={(v) => {
                  const trimmed = v.trim()
                  if (!trimmed) {
                    setSettings({ travel_rate_per_mile: 0 })
                    return
                  }
                  const n = Number(trimmed)
                  setSettings({
                    travel_rate_per_mile: Number.isFinite(n) && n > 0 ? n : 0,
                  })
                }}
                inputMode="decimal"
                placeholder="0"
                prefix={<span className="text-[14px] font-medium">$</span>}
                suffix={<span className="text-[12px]">/mi</span>}
              />
            </div>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Extra open dates"
          description="One-off dates you're open outside your normal week."
          icon={<Clock size={16} />}
        />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {schedule.open_dates.map((d) => (
              <span
                key={d}
                className="group inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[12.5px] font-medium text-brand-700"
              >
                {d}
                <button
                  type="button"
                  onClick={() => removeOpenDate(d)}
                  className="text-brand-500 opacity-0 transition group-hover:opacity-100 hover:text-brand-700"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-ink-300 px-3 py-1 text-[12.5px] font-medium text-ink-500 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600">
              <Plus size={12} />
              Add date
              <input
                type="date"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.value) {
                    addOpenDate(e.target.value)
                    e.target.value = ''
                  }
                }}
              />
            </label>
          </div>
          <p className="text-[12px] text-ink-500">
            Time-off blocks live in Calendar (same as mobile Schedule → time off). Extra open dates
            sync through booking_schedule.open_dates.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
