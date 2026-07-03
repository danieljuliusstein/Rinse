'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { bookingPageUrl } from '@/lib/booking-embed'

export interface AvailabilitySlot {
  time: string
  label: string
  available: boolean
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type BookingCalendarWidgetProps = {
  slug: string
  /** API base path, e.g. `/api/public/my-slug` */
  apiBase: string
  /** App origin for booking links (defaults to `window.location.origin`) */
  appOrigin?: string
  /** Break out of iframe when booking */
  linkTarget?: '_top' | '_self'
  className?: string
}

export default function BookingCalendarWidget({
  slug,
  apiBase,
  appOrigin,
  linkTarget = '_self',
  className,
}: BookingCalendarWidgetProps) {
  const today = todayIso()
  const initial = new Date()
  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [shake, setShake] = useState(false)

  const monthLabel = useMemo(
    () => new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [year, month],
  )

  const calendarCells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: { key: string; day?: number; date?: string; state: 'empty' | 'taken' | 'available' }[] = []

    for (let i = 0; i < firstDow; i++) {
      cells.push({ key: `e-${i}`, state: 'empty' })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = isoDate(year, month, d)
      const state = date < today ? 'taken' : 'available'
      cells.push({ key: date, day: d, date, state })
    }
    return cells
  }, [year, month, today])

  const loadSlots = useCallback(
    async (date: string) => {
      setLoadingSlots(true)
      setSelectedTime('')
      try {
        const res = await fetch(`${apiBase}/availability?date=${encodeURIComponent(date)}`)
        const data = await res.json()
        setSlots(data.slots ?? [])
      } catch {
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    },
    [apiBase],
  )

  useEffect(() => {
    if (selectedDate) void loadSlots(selectedDate)
  }, [selectedDate, loadSlots])

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  function formatSlotLabel(date: string) {
    const dt = new Date(date + 'T12:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function handleBookSlot() {
    if (!selectedDate || !selectedTime) {
      setShake(true)
      window.setTimeout(() => setShake(false), 200)
      return
    }
    const origin = appOrigin ?? (typeof window !== 'undefined' ? window.location.origin : '')
    const href = bookingPageUrl(origin, slug, { date: selectedDate, time: selectedTime })
    if (linkTarget === '_top' && window.top) {
      window.top.location.href = href
      return
    }
    window.location.href = href
  }

  return (
    <div className={['detail-cal-widget', className].filter(Boolean).join(' ')}>
      <div className="detail-cal-header">
        <button type="button" className="detail-cal-arrow" onClick={prevMonth} aria-label="Previous month">
          ‹
        </button>
        <span className="detail-cal-title">{monthLabel}</span>
        <button type="button" className="detail-cal-arrow" onClick={nextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="detail-cal-grid">
        {DAY_LABELS.map((label) => (
          <span key={label} className="detail-cal-day-label">
            {label}
          </span>
        ))}
        {calendarCells.map((cell) => {
          if (cell.state === 'empty' || !cell.day || !cell.date) {
            return <span key={cell.key} className="detail-cal-day empty" />
          }
          const isSelected = cell.date === selectedDate
          const className = ['detail-cal-day', cell.state, isSelected ? 'selected' : ''].filter(Boolean).join(' ')
          if (cell.state === 'taken') {
            return (
              <span key={cell.key} className={className}>
                {cell.day}
              </span>
            )
          }
          return (
            <button key={cell.key} type="button" className={className} onClick={() => setSelectedDate(cell.date!)}>
              {cell.day}
            </button>
          )
        })}
      </div>

      <p className="detail-cal-section-label">
        {loadingSlots ? 'Loading times…' : `Available times · ${formatSlotLabel(selectedDate)}`}
      </p>
      <div className="detail-cal-slots">
        {slots.length === 0 && !loadingSlots ? (
          <span className="detail-cal-slot taken" style={{ gridColumn: '1 / -1' }}>
            No slots available
          </span>
        ) : (
          slots.map((slot) => {
            const slotClass = [
              'detail-cal-slot',
              !slot.available ? 'taken' : '',
              selectedTime === slot.time ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')
            if (!slot.available) {
              return (
                <span key={slot.time} className={slotClass}>
                  {slot.label} · taken
                </span>
              )
            }
            return (
              <button key={slot.time} type="button" className={slotClass} onClick={() => setSelectedTime(slot.time)}>
                {slot.label}
              </button>
            )
          })
        )}
      </div>

      <button
        type="button"
        className={`detail-cal-book-btn${shake ? ' cl-shake-once' : ''}`}
        onClick={handleBookSlot}
      >
        Book this slot →
      </button>
    </div>
  )
}
