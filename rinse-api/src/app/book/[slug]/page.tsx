'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CalendarBlank,
  CheckCircle,
  Circle,
  House,
  MapPin,
  Phone,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Controller } from 'react-hook-form'
import { FloatingField, FloatingPhoneField } from '@/components/forms'
import { RinseDayPicker } from '@/components/ui'
import { useRinseForm } from '@/hooks/useRinseForm'
import { brandCssVars } from '@/lib/brand-color'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { normalizeUSPhone } from '@/lib/phone-format'
import { bookingContactSchema, type BookingContactFormValues } from '@/lib/validation'
import type { VehicleType } from '@/lib/types'
import { VEHICLE_TYPE_OPTIONS } from '@/lib/vehicle-type-icons'

interface PublicPackage {
  id: string
  name: string
  base_price: number
  description?: string
}

interface AvailabilitySlot {
  time: string
  label: string
  available: boolean
}

interface PublicBusiness {
  name: string
  phone?: string
  email?: string
  address?: string
  logoUrl?: string
  accentColor?: string | null
}

function BookBrandMark({ business }: { business?: PublicBusiness | null }) {
  if (!business?.logoUrl) return null
  return (
    <div className="book-brand-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={business.logoUrl}
        alt=""
        className="book-brand-logo"
        onError={(e) => {
          if (!e.currentTarget.src.endsWith('/logo.png')) e.currentTarget.src = '/logo.png'
        }}
      />
    </div>
  )
}

function bookFooterContact(business?: PublicBusiness | null): string | undefined {
  if (!business) return undefined
  if (business.email?.trim()) return business.email.trim()
  if (business.address?.trim()) return business.address.trim()
  return undefined
}

const BOOK_VEHICLE_TYPES = VEHICLE_TYPE_OPTIONS.filter((v) => v.id !== 'boat')

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function isValidBookDate(iso: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso)
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatDateBox(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeDisplay(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const dt = new Date()
  dt.setHours(h, m)
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDayChip(iso: string): { weekday: string; day: string; month: string } {
  const d = new Date(iso + 'T12:00:00')
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    day: d.toLocaleDateString('en-US', { day: 'numeric' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  }
}

function buildDayChipRange(startIso: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(startIso, i))
}

function BookDayChips({
  value,
  min,
  max,
  onChange,
}: {
  value: string
  min: string
  max: string
  onChange: (value: string) => void
}) {
  const moreDatesRef = useRef<HTMLInputElement>(null)
  const chipDays = useMemo(() => {
    if (!min) return []
    const range = buildDayChipRange(min, 14)
    return range.filter((d) => d <= max)
  }, [min, max])

  return (
    <div className="book-day-chips-wrap">
      <div className="book-day-chips" role="listbox" aria-label="Choose a date">
        {chipDays.map((iso) => {
          const chip = formatDayChip(iso)
          const selected = value === iso
          return (
            <button
              key={iso}
              type="button"
              role="option"
              aria-selected={selected}
              className={`book-day-chip${selected ? ' book-day-chip--active' : ''}`}
              onClick={() => onChange(iso)}
            >
              <span className="book-day-chip__weekday">{chip.weekday}</span>
              <span className="book-day-chip__day">{chip.day}</span>
              <span className="book-day-chip__month">{chip.month}</span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="book-day-more"
        onClick={() => moreDatesRef.current?.showPicker?.() ?? moreDatesRef.current?.click()}
      >
        More dates
      </button>
      <input
        ref={moreDatesRef}
        type="date"
        className="book-day-more-input"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}

function BookDateTimeSummary({
  date,
  startTime,
  onChange,
}: {
  date: string
  startTime: string
  onChange: () => void
}) {
  return (
    <div className="book-datetime-summary">
      <div className="book-datetime-summary__row">
        <CalendarBlank size={18} color="var(--book-muted)" aria-hidden="true" />
        <span>
          {formatDateBox(date)} · {formatTimeDisplay(startTime)}
        </span>
      </div>
      <button type="button" className="book-datetime-summary__change" onClick={onChange}>
        Change
      </button>
    </div>
  )
}

function BookStickySummary({ name, price }: { name: string; price: number }) {
  return (
    <div className="book-sticky-summary" aria-live="polite">
      <span className="book-sticky-summary__name">{name}</span>
      <span className="book-sticky-summary__price">{formatPrice(price)}</span>
    </div>
  )
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="book-progress" aria-hidden>
      {[1, 2, 3].map((n) => (
        <div key={n} className={`book-progress-dot${step >= n ? ' active' : ''}`} />
      ))}
    </div>
  )
}

function BookPageShell({
  header,
  children,
  footerContact,
  brandStyle,
}: {
  header: ReactNode
  children: ReactNode
  footerContact?: string
  brandStyle?: React.CSSProperties
}) {
  return (
    <div className="book-root client-light-root" style={brandStyle}>
      <header className="book-header">{header}</header>
      <main className="book-body">{children}</main>
      <footer className="book-footer">
        {footerContact ? <p className="book-footer-contact">{footerContact}</p> : null}
        <p className="book-legal">
          <Link href="/terms/customers">Customer Terms</Link>
          {' · '}
          <Link href="/privacy">Privacy policy</Link>
        </p>
      </footer>
    </div>
  )
}

function BookContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = String(params.slug ?? '')
  const initialDateParam = searchParams.get('date')?.trim() ?? ''
  const initialTimeParam = searchParams.get('time')?.trim() ?? ''

  const [business, setBusiness] = useState<PublicBusiness | null>(null)
  const [step, setStep] = useState(1)
  const [packages, setPackages] = useState<PublicPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [packageId, setPackageId] = useState('')
  const [date, setDate] = useState('')
  const [dateBounds, setDateBounds] = useState<{ min: string; max: string } | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [locationType, setLocationType] = useState<'mobile' | 'fixed'>('mobile')
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan')
  const [address, setAddress] = useState('')
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [continueShake, setContinueShake] = useState(false)
  const [prefillApplied, setPrefillApplied] = useState(false)
  const [confirmed, setConfirmed] = useState<{
    packageName: string
    date: string
    startTime?: string
    customerEmail?: string
  } | null>(null)
  const detailsFormRef = useRef<HTMLDivElement>(null)

  const { control, watch, submitWithToast } = useRinseForm<BookingContactFormValues>({
    schema: bookingContactSchema,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
    },
  })

  const contactName = watch('name')
  const contactPhone = watch('phone')
  const contactEmail = watch('email')
  const contactNotes = watch('notes')

  const apiBase = `/api/public/${encodeURIComponent(slug)}`
  const selectedPackage = useMemo(() => packages.find((p) => p.id === packageId), [packages, packageId])
  const minDate = dateBounds?.min ?? ''
  const maxDate = dateBounds?.max ?? ''

  const stepLabel = step === 1 ? 'Choose service' : step === 2 ? 'Date & time' : 'Your details'
  const brandStyle = brandCssVars(business?.accentColor)

  useEffect(() => {
    const today = todayIso()
    const max = addDays(today, 60)
    setDateBounds({ min: today, max })
    const fromUrl = isValidBookDate(initialDateParam) ? initialDateParam : ''
    const nextDate = fromUrl && fromUrl >= today && fromUrl <= max ? fromUrl : today
    setDate(nextDate)
  }, [initialDateParam])

  useEffect(() => {
    let cancelled = false
    setLoadingPackages(true)
    setNotFound(false)
    setError('')
    Promise.all([fetch(`${apiBase}/business`), fetch(`${apiBase}/packages`)])
      .then(async ([bizRes, pkgsRes]) => {
        if (cancelled) return
        if (bizRes.status === 404 || pkgsRes.status === 404) {
          setNotFound(true)
          return
        }
        const [biz, pkgs] = await Promise.all([bizRes.json(), pkgsRes.json()])
        if (!bizRes.ok || !pkgsRes.ok) {
          setError(biz.error ?? pkgs.error ?? 'Could not load booking page')
          return
        }
        if (biz.business) setBusiness(biz.business)
        const list = pkgs.packages ?? []
        setPackages(list)
        if (list.length === 1) {
          setPackageId(list[0].id)
          const today = todayIso()
          const max = addDays(today, 60)
          if (
            isValidBookDate(initialDateParam) &&
            initialDateParam >= today &&
            initialDateParam <= max
          ) {
            setStep(2)
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load booking page')
      })
      .finally(() => {
        if (!cancelled) setLoadingPackages(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiBase, initialDateParam])

  const loadSlots = useCallback(
    async (d: string) => {
      setLoadingSlots(true)
      setError('')
      try {
        const qs = new URLSearchParams({ date: d })
        if (packageId) qs.set('packageId', packageId)
        const res = await fetch(`${apiBase}/availability?${qs.toString()}`)
        const data = await res.json()
        setSlots(data.slots ?? [])
        setStartTime('')
      } catch {
        setSlots([])
        setError('Could not load availability')
      } finally {
        setLoadingSlots(false)
      }
    },
    [apiBase, packageId],
  )

  useEffect(() => {
    if (step >= 2 && date) void loadSlots(date)
  }, [step, date, loadSlots, packageId])

  useEffect(() => {
    if (prefillApplied || !initialTimeParam || loadingSlots || slots.length === 0) return
    const match = slots.find((s) => s.available && s.time === initialTimeParam)
    if (match) {
      setStartTime(initialTimeParam)
      setPrefillApplied(true)
    }
  }, [initialTimeParam, loadingSlots, slots, prefillApplied])

  useEffect(() => {
    syncPrefilledFloatingLabels(detailsFormRef.current)
  }, [contactName, contactPhone, contactEmail, contactNotes, address, step, showMoreOptions])

  useEffect(() => {
    setContinueShake(false)
  }, [step])

  function triggerContinueShake() {
    setContinueShake(true)
    window.setTimeout(() => setContinueShake(false), 200)
  }

  const handleSubmit = submitWithToast(async (values) => {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          date,
          startTime,
          locationType,
          vehicleType,
          name: values.name,
          phone: normalizeUSPhone(values.phone),
          email: values.email || undefined,
          address: address || undefined,
          notes: values.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')
      setConfirmed({
        packageName: data.booking.packageName,
        date: data.booking.date,
        startTime: data.booking.startTime,
        customerEmail: values.email?.trim() || undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  })

  if (notFound) {
    return (
      <BookPageShell
        header={
          <>
            <p className="book-eyebrow">Not found</p>
            <h1>Booking page not available</h1>
            <p className="book-lead">
              This link doesn&apos;t match an active detailing business. Check the URL or contact your detailer directly.
            </p>
          </>
        }
      >
        {null}
      </BookPageShell>
    )
  }

  if (confirmed) {
    return (
      <BookPageShell
        header={
          <>
            <BookBrandMark business={business} />
            <p className="book-eyebrow">Confirmed</p>
            <h1>You&apos;re booked</h1>
          </>
        }
        footerContact={bookFooterContact(business)}
      >
        <div className="book-success-banner">
          <CheckCircle size={32} weight="fill" className="book-success-icon" aria-hidden="true" />
          <p>
            <strong>{confirmed.packageName}</strong> on {formatDateBox(confirmed.date)}
            {confirmed.startTime ? ` at ${formatTimeDisplay(confirmed.startTime)}` : ''}.
          </p>
          {confirmed.customerEmail ? (
            <p>
              A confirmation will be sent to <strong>{confirmed.customerEmail}</strong> if email is enabled.
            </p>
          ) : (
            <p>{business?.name || 'Your detailer'} will confirm by phone or email if needed.</p>
          )}
          {business?.phone ? (
            <p>
              Questions? Call <a href={`tel:${business.phone.replace(/\D/g, '')}`}>{business.phone}</a>
            </p>
          ) : null}
        </div>
      </BookPageShell>
    )
  }

  return (
    <BookPageShell
      footerContact={bookFooterContact(business)}
      brandStyle={brandStyle}
      header={
        <>
          <BookBrandMark business={business} />
          <p className="book-eyebrow">Book online</p>
          <h1>{business?.name || 'Schedule a detail'}</h1>
          {business?.phone ? (
            <p className="book-phone">
              <Phone size={14} aria-hidden="true" />
              <a href={`tel:${business.phone.replace(/\D/g, '')}`}>{business.phone}</a>
            </p>
          ) : null}
          <p className="book-lead">
            Step {step} of 3 — {stepLabel}
          </p>
          <ProgressDots step={step} />
        </>
      }
    >
      {error ? (
        <div key={error} className="book-error-banner" role="alert" aria-live="assertive">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <section key={1} className="book-step-card">
          {loadingPackages ? (
            <p className="book-lead">Loading services…</p>
          ) : packages.length === 0 ? (
            <p className="book-lead">No services available right now. Please check back soon.</p>
          ) : (
            <div className="book-package-list">
              {packages.map((pkg) => {
                const selected = packageId === pkg.id
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`book-package-card${selected ? ' book-package-card--selected' : ''}`}
                    onClick={() => setPackageId(pkg.id)}
                  >
                    <span className="book-package-left">
                      <span className="book-package-name">{pkg.name}</span>
                      {pkg.description ? <span className="book-package-desc">{pkg.description}</span> : null}
                    </span>
                    <span className="book-package-right">
                      <span className="book-package-price">{formatPrice(pkg.base_price)}</span>
                      {selected ? (
                        <CheckCircle size={18} weight="fill" color="var(--book-green)" aria-hidden="true" />
                      ) : (
                        <Circle size={18} color="var(--book-border-hi)" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="book-step-actions book-step-actions--end">
            <button
              type="button"
              className={`book-btn book-btn-primary${continueShake ? ' cl-shake-once' : ''}`}
              onClick={() => {
                if (!packageId) {
                  triggerContinueShake()
                  return
                }
                setStep(2)
              }}
            >
              Continue →
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section key={2} className="book-step-card">
          {selectedPackage ? (
            <BookStickySummary name={selectedPackage.name} price={selectedPackage.base_price} />
          ) : null}

          <p className="book-label">Date</p>
          {dateBounds ? (
            <>
              <BookDayChips value={date} min={minDate} max={maxDate} onChange={setDate} />
              <div className="book-calendar-picker">
                <RinseDayPicker
                  variant="client"
                  selectedIso={date}
                  onSelectIso={setDate}
                  fromDate={new Date(`${minDate}T12:00:00`)}
                  toDate={new Date(`${maxDate}T12:00:00`)}
                />
              </div>
            </>
          ) : (
            <p className="book-lead">Loading dates…</p>
          )}

          <p className="book-label book-label--spaced">Pick a time</p>
          {loadingSlots ? (
            <p className="book-lead">Loading times…</p>
          ) : slots.length === 0 ? (
            <p className="book-slots-empty">No times available on this day. Try another date.</p>
          ) : slots.every((s) => !s.available) ? (
            <p className="book-slots-empty">All times are booked on this day. Try another date.</p>
          ) : (
            <div className="book-slots-grid">
              {slots.map((slot) => {
                const className = [
                  'book-slot',
                  !slot.available ? 'taken' : '',
                  startTime === slot.time ? ' active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                if (!slot.available) {
                  return (
                    <span key={slot.time} className={className}>
                      {slot.label}
                    </span>
                  )
                }
                return (
                  <button key={slot.time} type="button" className={className} onClick={() => setStartTime(slot.time)}>
                    {slot.label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="book-step-actions">
            <button type="button" className="book-btn book-btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className={`book-btn book-btn-primary${continueShake ? ' cl-shake-once' : ''}`}
              onClick={() => {
                if (!startTime) {
                  triggerContinueShake()
                  return
                }
                setStep(3)
              }}
            >
              Continue →
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section key={3} ref={detailsFormRef} className="book-step-card">
          {selectedPackage ? (
            <BookStickySummary name={selectedPackage.name} price={selectedPackage.base_price} />
          ) : null}

          {date && startTime ? (
            <BookDateTimeSummary date={date} startTime={startTime} onChange={() => setStep(2)} />
          ) : null}

          <p className="book-label">Contact</p>
          <div className="book-field">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <FloatingField
                  id="book-name"
                  label="Name"
                  filled={field.value.trim().length > 0}
                  error={fieldState.error?.message}
                >
                  <input
                    id="book-name"
                    className={`f-input${field.value.trim() ? ' hv' : ''}`}
                    placeholder=" "
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.error ? true : undefined}
                    aria-describedby={fieldState.error ? 'book-name-error' : undefined}
                  />
                </FloatingField>
              )}
            />
          </div>
          <div className="book-field">
            <FloatingPhoneField control={control} name="phone" id="book-phone" label="Phone" />
          </div>
          <div className="book-field">
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <FloatingField
                  id="book-email"
                  label="Email"
                  filled={Boolean(field.value?.trim())}
                  optional
                  error={fieldState.error?.message}
                >
                  <input
                    id="book-email"
                    type="email"
                    className={`f-input${field.value?.trim() ? ' hv' : ''}`}
                    placeholder=" "
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.error ? true : undefined}
                  />
                </FloatingField>
              )}
            />
          </div>
          <div className="book-field">
            <FloatingField id="book-address" label="Service address" filled={address.trim().length > 0}>
              <input
                id="book-address"
                className={`f-input${address.trim() ? ' hv' : ''}`}
                placeholder=" "
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FloatingField>
          </div>

          <button
            type="button"
            className="book-more-options-toggle"
            aria-expanded={showMoreOptions}
            onClick={() => setShowMoreOptions((open) => !open)}
          >
            {showMoreOptions ? 'Fewer options' : 'More options'}
            <span className="book-more-options-hint">vehicle, location, notes</span>
          </button>

          {showMoreOptions ? (
            <>
          <p className="book-label book-label--spaced">Vehicle type</p>
          <div className="book-vehicle-grid">
            {BOOK_VEHICLE_TYPES.map((v) => {
              const active = vehicleType === v.id
              const { Icon } = v
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`book-vehicle-btn${active ? ' book-vehicle-btn--selected' : ''}`}
                  onClick={() => setVehicleType(v.id)}
                >
                  <Icon size={22} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                  <span>{v.label}</span>
                </button>
              )
            })}
          </div>

          <p className="book-label book-label--spaced">Location</p>
          <div className="book-location-toggle">
            <button
              type="button"
              className={`book-location-opt${locationType === 'mobile' ? ' book-location-opt--selected' : ''}`}
              onClick={() => setLocationType('mobile')}
            >
              <MapPin size={15} aria-hidden="true" />
              We come to you
            </button>
            <button
              type="button"
              className={`book-location-opt${locationType === 'fixed' ? ' book-location-opt--selected' : ''}`}
              onClick={() => setLocationType('fixed')}
            >
              <House size={15} aria-hidden="true" />
              Drop-off location
            </button>
          </div>

          <div className="book-field book-field--notes">
            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <FloatingField
                  id="book-notes"
                  label="Notes"
                  filled={Boolean(field.value?.trim())}
                  optional
                  textarea
                  error={fieldState.error?.message}
                >
                  <textarea
                    id="book-notes"
                    className={`f-textarea${field.value?.trim() ? ' hv' : ''}`}
                    rows={3}
                    placeholder=" "
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </FloatingField>
              )}
            />
          </div>
            </>
          ) : null}

          <div className="book-step-actions">
            <button type="button" className="book-btn book-btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button
              type="button"
              className="book-btn book-btn-primary"
              disabled={submitting || !contactName.trim() || !contactPhone.trim() || !packageId}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Booking…' : 'Confirm booking →'}
            </button>
          </div>
          <p className="book-legal-disclaimer">
            Services are provided by <strong>{business?.name || 'the Business'}</strong>, an
            independent business. Rinse provides this booking page. By confirming, you agree to the{' '}
            <Link href="/terms/customers">Customer Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </section>
      ) : null}
    </BookPageShell>
  )
}

export default function PublicBookPage() {
  return (
    <Suspense
      fallback={
        <div className="book-root client-light-root">
          <header className="book-header">
            <p className="book-lead">Loading…</p>
          </header>
        </div>
      }
    >
      <BookContent />
    </Suspense>
  )
}
