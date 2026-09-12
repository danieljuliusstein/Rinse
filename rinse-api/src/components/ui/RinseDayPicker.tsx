'use client'

import { useEffect, useMemo, useRef } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
  type DayPickerProps,
} from 'react-day-picker'
import { useReducedMotion } from 'motion/react'
import 'react-day-picker/style.css'

export interface RinseDayPickerProps {
  selected?: Date | undefined
  onSelect?: (date: Date | undefined) => void
  selectedIso?: string
  onSelectIso?: (iso: string) => void
  disabled?: DayPickerProps['disabled']
  fromDate?: Date
  toDate?: Date
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  modifiers?: DayPickerProps['modifiers']
  modifiersClassNames?: DayPickerProps['modifiersClassNames']
  variant?: 'operator' | 'client'
  /** Double-card shell + legend (home calendar). */
  framed?: boolean
  showLegend?: boolean
  className?: string
}

function isoToDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`)
}

function dateToIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function RinseDayButton({ day, modifiers, children, className, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const dotTone = modifiers.rainRisk ? 'rain' : modifiers.hasJobs ? 'job' : 'empty'

  return (
    <button ref={ref} type="button" className={className} {...props}>
      <span
        className={`rinse-day-picker__day-num${modifiers.selected ? ' rinse-day-picker__day-num--selected' : ''}`}
      >
        {children}
      </span>
      <span
        className={`rinse-day-picker__day-dot rinse-day-picker__day-dot--${dotTone}`}
        aria-hidden
      />
    </button>
  )
}

function RinseDayPickerLegend() {
  return (
    <div className="rinse-day-picker__legend">
      <span className="rinse-day-picker__legend-item">
        <i className="rinse-day-picker__legend-dot rinse-day-picker__legend-dot--job" aria-hidden />
        Job scheduled
      </span>
      <span className="rinse-day-picker__legend-item">
        <i className="rinse-day-picker__legend-dot rinse-day-picker__legend-dot--rain" aria-hidden />
        Rain risk
      </span>
    </div>
  )
}

export default function RinseDayPicker({
  selected,
  onSelect,
  selectedIso,
  onSelectIso,
  disabled,
  fromDate,
  toDate,
  defaultMonth,
  onMonthChange,
  modifiers,
  modifiersClassNames,
  variant = 'operator',
  framed = false,
  showLegend = false,
  className,
}: RinseDayPickerProps) {
  const reduceMotion = useReducedMotion()
  const defaults = getDefaultClassNames()

  const resolvedSelected = useMemo(() => {
    if (selected) return selected
    if (selectedIso) return isoToDate(selectedIso)
    return undefined
  }, [selected, selectedIso])

  const handleSelect = (date: Date | undefined) => {
    onSelect?.(date)
    if (date && onSelectIso) onSelectIso(dateToIso(date))
  }

  const classNames = {
    ...defaults,
    root: `${defaults.root} rinse-day-picker rinse-day-picker--${variant}${framed ? ' rinse-day-picker--framed' : ''}${className ? ` ${className}` : ''}`,
    months: `${defaults.months} rinse-day-picker__months`,
    month: `${defaults.month} rinse-day-picker__month`,
    month_caption: `${defaults.month_caption} rinse-day-picker__caption`,
    caption_label: `${defaults.caption_label} rinse-day-picker__caption-label`,
    nav: `${defaults.nav} rinse-day-picker__nav`,
    button_previous: `${defaults.button_previous} rinse-day-picker__nav-btn rinse-day-picker__nav-btn--prev`,
    button_next: `${defaults.button_next} rinse-day-picker__nav-btn rinse-day-picker__nav-btn--next`,
    month_grid: `${defaults.month_grid} rinse-day-picker__grid`,
    weekdays: `${defaults.weekdays} rinse-day-picker__weekdays`,
    weekday: `${defaults.weekday} rinse-day-picker__weekday`,
    week: `${defaults.week} rinse-day-picker__week`,
    day: `${defaults.day} rinse-day-picker__day`,
    day_button: `${defaults.day_button} rinse-day-picker__day-btn`,
    selected: `${defaults.selected} rinse-day-picker__day--selected`,
    today: `${defaults.today} rinse-day-picker__day--today`,
    disabled: `${defaults.disabled} rinse-day-picker__day--disabled`,
    outside: `${defaults.outside} rinse-day-picker__day--outside`,
  }

  const picker = (
    <DayPicker
      mode="single"
      selected={resolvedSelected}
      onSelect={handleSelect}
      disabled={disabled}
      startMonth={fromDate}
      endMonth={toDate}
      hidden={[
        ...(fromDate ? [{ before: fromDate }] : []),
        ...(toDate ? [{ after: toDate }] : []),
      ]}
      defaultMonth={defaultMonth ?? resolvedSelected ?? fromDate}
      onMonthChange={onMonthChange}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      classNames={classNames}
      animate={!reduceMotion}
      showOutsideDays
      navLayout="after"
      formatters={{
        formatCaption: (month) =>
          month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        formatWeekdayName: (weekday) =>
          weekday.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      }}
      components={{
        DayButton: RinseDayButton,
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === 'left' ? (
            <CaretLeft
              className={chevronClassName}
              size={16}
              weight="bold"
              aria-hidden
            />
          ) : (
            <CaretRight
              className={chevronClassName}
              size={16}
              weight="bold"
              aria-hidden
            />
          ),
      }}
    />
  )

  if (!framed) return picker

  return (
    <div className="rinse-day-picker__frame">
      <div className="rinse-day-picker__card">
        {picker}
        {showLegend ? <RinseDayPickerLegend /> : null}
      </div>
    </div>
  )
}

export { dateToIso as rinseDateToIso, isoToDate as rinseIsoToDate }
