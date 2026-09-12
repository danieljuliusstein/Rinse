'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import BookingCalendarWidget from '@/components/booking/BookingCalendarWidget'
import { Button } from '@/components/ui'
import { loadOrganizationSlug } from '@/lib/tenant'

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function DemoBookingPage() {
  const [slug, setSlug] = useState('atlas-detailing')
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const nextSunday = useMemo(() => {
    const d = new Date(today + 'T12:00:00')
    const day = d.getDay()
    const delta = day === 0 ? 0 : 7 - day
    d.setDate(d.getDate() + delta)
    return d.toISOString().slice(0, 10)
  }, [today])

  useEffect(() => {
    void loadOrganizationSlug().then((s) => {
      if (s) setSlug(s)
    })
  }, [])

  const apiBase = `/api/public/${slug}`
  const bookUrl = `/book/${slug}`

  return (
    <div className="screen page-content body demo-booking">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => window.history.back()} />
        <div className="page-header__title-block">
          <h1>Booking preview</h1>
          <p>Live calendar using your schedule, packages, and blocked times</p>
        </div>
      </header>

      <div className="card demo-booking-intro">
        <p>
          This preview uses your real operator settings: work days, lunch block, time off, package
          durations, and booked jobs.
        </p>
        <ul>
          <li>Sundays should show no available slots (Mon–Sat schedule)</li>
          <li>12:00 lunch window blocked</li>
          <li>All-day time off on {nextSunday} if seeded</li>
          <li>Today&apos;s 10:00 Full Detail job blocks overlapping slots</li>
        </ul>
        <p className="demo-booking-intro__hint">
          Need sample data? Open Settings → Access and data → Load sample data (local mode), or run{' '}
          <code>npm run seed:schedule-demo</code> with PocketBase.
        </p>
      </div>

      <div className="demo-booking-actions">
        <Link href={bookUrl} className="btn-primary">
          Open full booking page
        </Link>
        <Link href="/settings/schedule" className="btn-ghost">
          Edit schedule
        </Link>
      </div>

      <p className="sec">Calendar preview</p>
      <div className="client-light-root demo-booking-preview">
        <BookingCalendarWidget slug={slug} apiBase={apiBase} linkTarget="_self" />
      </div>

      <p className="sec">Test dates</p>
      <div className="demo-booking-dates">
        <div>Today: {today}</div>
        <div>Next Sunday (closed / day off): {nextSunday}</div>
        <div>Partial block sample: {addDays(today, 4)}</div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Button variant="ghost" onClick={() => window.history.back()}>
          Done
        </Button>
      </div>
    </div>
  )
}
