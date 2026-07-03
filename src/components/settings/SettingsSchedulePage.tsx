'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import SwipeableRow from '@/components/SwipeableRow'
import { FloatingAffixField, FloatingField, SheetFooter } from '@/components/forms'
import { createTimeBlock, deleteTimeBlock, getTimeBlocks } from '@/lib/api'
import { DEFAULT_BOOKING_SCHEDULE, type BookingSchedule } from '@/lib/booking-availability'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import type { TimeBlock } from '@/lib/types'
import SettingsDetailShell from './SettingsDetailShell'
import SettingsToggle from './SettingsToggle'
import { useSettingsDraft } from './SettingsDraftProvider'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SLOT_INTERVALS = [60, 90, 120] as const

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function formatBlockTime(block: TimeBlock) {
  if (block.all_day) return 'All day'
  if (block.start_time && block.end_time) return `${block.start_time} – ${block.end_time}`
  return 'Blocked'
}

function formatBlockDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <SettingsToggle on={on} onChange={onChange} label={label} />
}

export default function SettingsSchedulePage() {
  const { settings, ready, update } = useSettingsDraft()
  const formRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<HTMLSelectElement>(null)
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(true)
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [blockDate, setBlockDate] = useState('')
  const [blockAllDay, setBlockAllDay] = useState(true)
  const [blockStart, setBlockStart] = useState('09:00')
  const [blockEnd, setBlockEnd] = useState('12:00')
  const [blockLabel, setBlockLabel] = useState('')
  const [savingBlock, setSavingBlock] = useState(false)

  const schedule = useMemo(
    () => settings?.booking_schedule ?? { ...DEFAULT_BOOKING_SCHEDULE },
    [settings?.booking_schedule],
  )

  const lunchEnabled = Boolean(schedule.lunch_start && schedule.lunch_end)

  const loadBlocks = useCallback(async () => {
    setBlocksLoading(true)
    try {
      const from = todayIso()
      const to = addDays(from, 30)
      const rows = await getTimeBlocks(from, to)
      setBlocks(rows)
    } catch {
      setBlocks([])
    } finally {
      setBlocksLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    void loadBlocks()
  }, [ready, loadBlocks])

  useEffect(() => {
    if (!ready || !settings || settings.booking_schedule) return
    update('booking_schedule', { ...DEFAULT_BOOKING_SCHEDULE })
  }, [ready, settings, update])

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(intervalRef.current)
  }, [schedule, settings?.travel_rate_per_mile, addOpen, blockDate, blockLabel, blockAllDay])

  const patchSchedule = (patch: Partial<BookingSchedule>) => {
    update('booking_schedule', { ...schedule, ...patch })
  }

  const toggleWorkDay = (day: number) => {
    const next = schedule.work_days.includes(day)
      ? schedule.work_days.filter((d) => d !== day)
      : [...schedule.work_days, day].sort((a, b) => a - b)
    patchSchedule({ work_days: next })
  }

  const handleAddBlock = async () => {
    if (!blockDate) return
    setSavingBlock(true)
    try {
      await createTimeBlock({
        date: blockDate,
        all_day: blockAllDay,
        start_time: blockAllDay ? undefined : blockStart,
        end_time: blockAllDay ? undefined : blockEnd,
        label: blockLabel.trim() || undefined,
      })
      setAddOpen(false)
      setBlockDate('')
      setBlockLabel('')
      setBlockAllDay(true)
      await loadBlocks()
    } finally {
      setSavingBlock(false)
    }
  }

  const handleDeleteBlock = async (id: string) => {
    await deleteTimeBlock(id)
    setOpenRowId(null)
    await loadBlocks()
  }

  if (!ready || !settings) {
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
  }

  return (
    <SettingsDetailShell title="Schedule & time off">
      <div ref={formRef} className="settings-panel">
        <div className="settings-field">
          <h2 className="settings-section-head">Work days</h2>
          <p className="settings-section-desc">Days clients can book online.</p>
          <div className="form-pill-block schedule-work-days">
            {DAY_LABELS.map((label, day) => (
              <button
                key={label}
                type="button"
                className={`form-pill${schedule.work_days.includes(day) ? ' form-pill--on' : ''}`}
                onClick={() => toggleWorkDay(day)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="settings-field-hint">
            <Link href="/demo/booking" className="new-job-link">
              Preview booking calendar →
            </Link>
          </p>
        </div>

        <div className="settings-field">
          <h2 className="settings-section-head">Business hours</h2>
          <div className="schedule-time-grid">
            <FloatingField id="sched-start" label="Start" filled showCheck={false}>
              <input
                id="sched-start"
                type="time"
                className="f-input hv"
                value={schedule.start_time}
                onChange={(e) => patchSchedule({ start_time: e.target.value })}
              />
            </FloatingField>
            <FloatingField id="sched-end" label="End" filled showCheck={false}>
              <input
                id="sched-end"
                type="time"
                className="f-input hv"
                value={schedule.end_time}
                onChange={(e) => patchSchedule({ end_time: e.target.value })}
              />
            </FloatingField>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-row__label">Lunch break</div>
            <div className="settings-toggle-row__hint">Block a daily lunch window from booking.</div>
          </div>
          <Toggle
            label="Lunch break"
            on={lunchEnabled}
            onChange={(on) =>
              patchSchedule(
                on
                  ? { lunch_start: '12:00', lunch_end: '13:00' }
                  : { lunch_start: '', lunch_end: '' },
              )
            }
          />
        </div>

        {lunchEnabled && (
          <div className="schedule-time-grid job-form-section">
            <FloatingField id="sched-lunch-start" label="Lunch start" filled showCheck={false}>
              <input
                id="sched-lunch-start"
                type="time"
                className="f-input hv"
                value={schedule.lunch_start ?? ''}
                onChange={(e) => patchSchedule({ lunch_start: e.target.value })}
              />
            </FloatingField>
            <FloatingField id="sched-lunch-end" label="Lunch end" filled showCheck={false}>
              <input
                id="sched-lunch-end"
                type="time"
                className="f-input hv"
                value={schedule.lunch_end ?? ''}
                onChange={(e) => patchSchedule({ lunch_end: e.target.value })}
              />
            </FloatingField>
          </div>
        )}

        <div className="settings-field">
          <FloatingField id="sched-interval" label="Booking slot interval" filled>
            <select
              ref={intervalRef}
              id="sched-interval"
              className="f-select hv"
              value={schedule.slot_interval_minutes}
              onChange={(e) => {
                patchSchedule({ slot_interval_minutes: Number(e.target.value) })
                syncSelectFloatingLabel(intervalRef.current)
              }}
            >
              {SLOT_INTERVALS.map((mins) => (
                <option key={mins} value={mins}>
                  {mins} minutes
                </option>
              ))}
            </select>
          </FloatingField>
        </div>

        <div className="settings-field">
          <FloatingAffixField
            id="sched-travel-rate"
            label="Travel rate ($/mile)"
            type="number"
            inputMode="decimal"
            step={0.01}
            min={0}
            filled={Boolean(settings.travel_rate_per_mile)}
            value={settings.travel_rate_per_mile ?? ''}
            onChange={(e) => {
              const v = e.target.value
              update('travel_rate_per_mile', v ? Number(v) : undefined)
            }}
          />
          <p className="settings-field-hint">
            Optional. Used to auto-calculate travel costs from miles on job expenses.
          </p>
        </div>

        <div className="settings-divider" />

        <div className="settings-field settings-field-header">
          <div>
            <h2 className="settings-section-head">Time off</h2>
            <p className="settings-section-desc">Next 30 days — blocks online booking.</p>
          </div>
          <button
            type="button"
            className="page-header__action"
            aria-label="Add time off"
            onClick={() => {
              setBlockDate(todayIso())
              setAddOpen(true)
            }}
          >
            <Plus size={20} color="var(--green)" aria-hidden="true" />
          </button>
        </div>

        {blocksLoading ? (
          <p className="settings-field-hint">Loading…</p>
        ) : blocks.length === 0 ? (
          <p className="settings-field-hint">No upcoming time off.</p>
        ) : (
          blocks.map((block) => (
            <SwipeableRow
              key={block.id}
              rowId={block.id}
              openRowId={openRowId}
              onOpenChange={setOpenRowId}
              onEdit={() => {}}
              onDelete={() => void handleDeleteBlock(block.id)}
              deleteConfirmMessage={`Remove time off on ${formatBlockDate(block.date)}?`}
              showDivider
            >
              <div className="schedule-time-off-row">
                <div className="schedule-time-off-row__title">{formatBlockDate(block.date)}</div>
                <div className="schedule-time-off-row__sub">
                  {formatBlockTime(block)}
                  {block.label ? ` · ${block.label}` : ''}
                </div>
              </div>
            </SwipeableRow>
          ))
        )}
      </div>

      {addOpen && (
        <BottomSheet
          variant="light"
          title="Add time off"
          subtitle="Block your calendar for appointments or personal time"
          ariaLabel="Add time off"
          onClose={() => setAddOpen(false)}
          footer={
            <SheetFooter
              saveLabel={savingBlock ? 'Saving…' : 'Add block'}
              ready={Boolean(blockDate) && !savingBlock}
              layout="split"
              onSave={() => void handleAddBlock()}
              onCancel={() => setAddOpen(false)}
            />
          }
        >
          <div className="premium-sheet__form">
            <FloatingField id="block-date" label="Date" filled={Boolean(blockDate)}>
              <input
                id="block-date"
                type="date"
                className={`f-input${blockDate ? ' hv' : ''}`}
                value={blockDate}
                min={todayIso()}
                onChange={(e) => setBlockDate(e.target.value)}
                placeholder=" "
              />
            </FloatingField>

            <div className="settings-toggle-row job-form-section">
              <span className="settings-toggle-row__label">All day</span>
              <Toggle label="All day" on={blockAllDay} onChange={setBlockAllDay} />
            </div>

            {!blockAllDay && (
              <div className="schedule-time-grid">
                <FloatingField id="block-start" label="Start" filled showCheck={false}>
                  <input
                    id="block-start"
                    type="time"
                    className="f-input hv"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                  />
                </FloatingField>
                <FloatingField id="block-end" label="End" filled showCheck={false}>
                  <input
                    id="block-end"
                    type="time"
                    className="f-input hv"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                  />
                </FloatingField>
              </div>
            )}

            <FloatingField id="block-label" label="Label" filled={blockLabel.trim().length > 0} optional>
              <input
                id="block-label"
                className={`f-input${blockLabel.trim() ? ' hv' : ''}`}
                value={blockLabel}
                onChange={(e) => setBlockLabel(e.target.value)}
                placeholder=" "
              />
            </FloatingField>
          </div>
        </BottomSheet>
      )}
    </SettingsDetailShell>
  )
}
