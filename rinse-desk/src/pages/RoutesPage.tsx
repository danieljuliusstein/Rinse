import { useEffect, useMemo, useState } from 'react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useUi } from '@/providers/UiProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import { loadAppSettings } from '@/lib/settings-api'
import { todayISO } from '@/lib/metrics'
import { geocodeAddress, isRouteApiConfigured } from '@/lib/route-api'
import RoutePlanner from '@/components/calendar/RoutePlanner'
import { DayScrubber } from '@/components/routes/DayScrubber'
import { useOptionalTour } from '@/components/tour/tour-provider'

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Prefer today if it has jobs; else nearest job date (soonest upcoming, else most recent). */
function pickDefaultRouteDate(jobDates: string[], today: string): string {
  const unique = [...new Set(jobDates.filter(Boolean))].sort()
  if (unique.includes(today)) return today
  const upcoming = unique.find((d) => d >= today)
  if (upcoming) return upcoming
  return unique[unique.length - 1] ?? today
}

export default function RoutesPage() {
  const { jobs, setJobs, setClients, clients } = useData()
  const { toast } = useUi()
  const { createEvent } = useCreateActions()
  const tour = useOptionalTour()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [dateSeeded, setDateSeeded] = useState(false)
  const [businessAddress, setBusinessAddress] = useState('')
  const [depotCoords, setDepotCoords] = useState<{ lat: number; lng: number } | null>(null)

  const jobDates = useMemo(() => jobs.map((j) => j.date), [jobs])

  useEffect(() => {
    void loadAppSettings()
      .then((s) => setBusinessAddress(s.business_address ?? ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (dateSeeded || jobs.length === 0) return
    setDate(pickDefaultRouteDate(jobDates, today))
    setDateSeeded(true)
  }, [jobs.length, jobDates, today, dateSeeded])

  useEffect(() => {
    const addr = businessAddress.trim()
    if (!addr || depotCoords || !isRouteApiConfigured()) return
    let cancelled = false
    void geocodeAddress(addr)
      .then((c) => {
        if (!cancelled) setDepotCoords(c)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [businessAddress, depotCoords])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-atmosphere">
      <Header
        title="Routes"
        subtitle="Plan today’s stop order — shared with mobile"
        actions={
          <DayScrubber
            isoDate={date}
            isToday={date === today}
            onPrev={() => {
              setDateSeeded(true)
              setDate((d) => shiftDate(d, -1))
              if (tour?.active && tour.stop.id === 'routes') {
                toast('Route date updated')
                tour.completeStop('routes')
              }
            }}
            onNext={() => {
              setDateSeeded(true)
              setDate((d) => shiftDate(d, 1))
              if (tour?.active && tour.stop.id === 'routes') {
                toast('Route date updated')
                tour.completeStop('routes')
              }
            }}
            onToday={() => {
              setDateSeeded(true)
              setDate(today)
              if (tour?.active && tour.stop.id === 'routes') {
                toast('Today’s route loaded')
                tour.completeStop('routes')
              }
            }}
            onPickDate={(iso) => {
              setDateSeeded(true)
              setDate(iso)
              if (tour?.active && tour.stop.id === 'routes') {
                toast('Route date updated')
                tour.completeStop('routes')
              }
            }}
          />
        }
      />

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
          tour?.isArmed('routes-panel') ? 'tour-armed relative z-[55] pointer-events-auto' : ''
        }`}
        data-tour-target="routes-panel"
      >
        <RoutePlanner
          date={date}
          jobs={jobs}
          clients={clients}
          setJobs={setJobs}
          setClients={setClients}
          businessAddress={businessAddress}
          depotCoords={depotCoords}
          onDepotCoords={setDepotCoords}
          toast={(msg) => toast(msg)}
          onSelectStop={() => {
            if (tour?.active && tour.stop.id === 'routes') {
              toast('Stop selected')
              tour.notifyCreated('route')
            }
          }}
          onSchedule={() => {
            void createEvent({
              navigate: false,
              defaultDate: date,
              formTitle: 'Schedule stop',
              submitLabel: 'Add to route',
            })
          }}
        />
      </div>
    </div>
  )
}
