'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import BookingCalendarWidget from '@/components/booking/BookingCalendarWidget'

export default function EmbedBookPage() {
  const params = useParams()
  const slug = String(params.slug ?? '')
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const apiBase = `/api/public/${encodeURIComponent(slug)}`
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${apiBase}/business`)
      .then((res) => {
        if (cancelled) return
        if (res.status === 404) setNotFound(true)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiBase])

  if (loading) {
    return (
      <div className="embed-page">
        <p className="embed-loading">Loading calendar…</p>
      </div>
    )
  }

  if (notFound || !slug) {
    return (
      <div className="embed-page">
        <p className="embed-error">Booking is not available.</p>
      </div>
    )
  }

  return (
    <div className="embed-page">
      <BookingCalendarWidget slug={slug} apiBase={apiBase} appOrigin={appOrigin} linkTarget="_top" />
    </div>
  )
}
