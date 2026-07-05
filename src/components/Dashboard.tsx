'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, ChatCircle, Funnel, Gear, Trophy } from '@phosphor-icons/react'
import ArSummaryCard from '@/components/business/ArSummaryCard'
import HomeCtaRow from '@/components/home/HomeCtaRow'
import HomeMonthCalendar from '@/components/home/HomeMonthCalendar'
import HomeDayJobsPanel from '@/components/home/HomeDayJobsPanel'
import InventoryAlertCard from '@/components/home/InventoryAlertCard'
import ProfileCompleteCard from '@/components/home/ProfileCompleteCard'
import TodayJobCard from '@/components/home/TodayJobCard'
import WeatherReadinessCard from '@/components/home/WeatherReadinessCard'
import { Badge, ListRow, MonthCarousel, SectionGroup } from '@/components/ui'
import TrialExpiryBanner from '@/components/TrialExpiryBanner'
import { useOrgSubscription } from '@/hooks/useOrgSubscription'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'
import { dismissTrialBanner, isTrialBannerDismissed } from '@/lib/subscription-gates'
import { computeArSummary } from '@/lib/ar-metrics'
import { DEFAULT_BOOKING_SCHEDULE, weekdayFromIsoDate } from '@/lib/booking-availability'
import { getTimeBlocks } from '@/lib/api'
import {
  buildTodayJobCard,
  formatStartTimeLabel,
  type ComingUpJobData,
  type InventoryAlertData,
} from '@/lib/home-dashboard'
import { buildInvoiceMonthCarouselItems } from '@/lib/invoice-month-revenue'
import HomeRevenueChart from '@/components/home/HomeRevenueChart'
import { isHomeModuleEnabled, type HomeModulePrefs } from '@/lib/home-modules'
import { openMapsDirections } from '@/lib/maps-url'
import { loadSentMessagesAsync } from '@/lib/messages'
import { loadSettingsAsync } from '@/lib/settings'
import { fetchWeatherReadiness } from '@/lib/weather-readiness-client'
import {
  peekWeatherReadinessCache,
  setWeatherReadinessCache,
} from '@/lib/weather-readiness-cache'
import {
  isWeatherReadinessActiveJob,
  isWeatherSensitiveJob,
  isoDate,
  nextThreeDayDates,
  type WeatherReadinessResult,
} from '@/lib/weather-risk'
import type { Invoice, JobWithRelations, LeadWithRelations, RecentJobRow, WeekDay } from '@/lib/types'

function formatHeaderCount(n: number): string {
  if (n > 99) return '99+'
  return String(n)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function pipelineOpenCount(leads: LeadWithRelations[]): number {
  return leads.filter((l) => l.stage !== 'booked').length
}

export interface DashboardProps {
  weekDays: WeekDay[]
  todayJobRows: RecentJobRow[]
  upcomingJobs: ComingUpJobData[]
  jobs: JobWithRelations[]
  leads: LeadWithRelations[]
  invoices: Invoice[]
  inventoryAlert: InventoryAlertData | null
  hasUnviewedMilestone?: boolean
}

export default function Dashboard({
  weekDays,
  todayJobRows,
  upcomingJobs,
  jobs,
  leads,
  invoices,
  inventoryAlert,
  hasUnviewedMilestone = false,
}: DashboardProps) {
  const router = useRouter()
  const { isLoggedOut } = useAuthEmptyState()
  const { showTrialBanner, daysLeft } = useOrgSubscription()
  const [trialDismissed, setTrialDismissed] = useState(() => isTrialBannerDismissed())
  const [homeModules, setHomeModules] = useState<HomeModulePrefs>({})
  const [weatherReadiness, setWeatherReadiness] = useState<WeatherReadinessResult | null>(null)
  const [weatherFromCache, setWeatherFromCache] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const profileCompletion = useProfileCompletion()
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const todayJob = useMemo(() => buildTodayJobCard(todayJobRows), [todayJobRows])
  const moreTodayJobs = useMemo(
    () => (todayJob ? todayJobRows.filter((j) => j.id !== todayJob.id) : todayJobRows),
    [todayJobRows, todayJob],
  )
  const arSummary = useMemo(() => computeArSummary(invoices), [invoices])
  const weatherFetchKey = useMemo(() => {
    const today = isoDate(new Date())
    const window = new Set(nextThreeDayDates())
    const jobKey = jobs
      .filter(
        (j) =>
          isWeatherReadinessActiveJob(j) &&
          isWeatherSensitiveJob(j) &&
          window.has(j.date),
      )
      .map((j) => `${j.id}:${j.date}`)
      .sort()
      .join('|')
    return `${today}|${jobKey}`
  }, [jobs])
  const invoiceMonthCarousel = useMemo(
    () => (isLoggedOut ? [] : buildInvoiceMonthCarouselItems(invoices)),
    [invoices, isLoggedOut],
  )
  const pipelineCount = useMemo(() => pipelineOpenCount(leads), [leads])

  useEffect(() => {
    if (weekDays.length === 0) return
    const from = weekDays[0].date
    const to = weekDays[weekDays.length - 1].date
    let cancelled = false
    void Promise.all([loadSettingsAsync(), getTimeBlocks(from, to)]).then(([settings, blocks]) => {
      if (cancelled) return
      setHomeModules(settings.home_modules ?? {})
      const schedule = settings.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE
      const blocked = new Set<string>()
      for (const day of weekDays) {
        const weekday = weekdayFromIsoDate(day.date)
        if (!schedule.work_days.includes(weekday)) blocked.add(day.date)
      }
      for (const block of blocks) {
        if (block.all_day) blocked.add(block.date)
      }
      setBlockedDates(blocked)
    })
    return () => {
      cancelled = true
    }
  }, [weekDays])

  useEffect(() => {
    const refreshModules = () => {
      void loadSettingsAsync().then((settings) => setHomeModules(settings.home_modules ?? {}))
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshModules()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useLayoutEffect(() => {
    if (isLoggedOut || !isHomeModuleEnabled(homeModules, 'job_readiness')) return
    const cached = peekWeatherReadinessCache(weatherFetchKey)
    if (cached) {
      setWeatherReadiness(cached)
      setWeatherFromCache(true)
    }
  }, [isLoggedOut, homeModules, weatherFetchKey])

  useEffect(() => {
    if (isLoggedOut || !isHomeModuleEnabled(homeModules, 'job_readiness')) {
      return
    }
    let alive = true
    void fetchWeatherReadiness()
      .then((result) => {
        if (!alive) return
        setWeatherReadinessCache(weatherFetchKey, result)
        setWeatherReadiness(result)
        setWeatherFromCache(false)
      })
      .catch(() => {
        if (!alive) return
        if (!peekWeatherReadinessCache(weatherFetchKey)) {
          setWeatherReadiness({ status: 'unresolved', rows: [] })
          setWeatherFromCache(false)
        }
      })
    return () => {
      alive = false
    }
  }, [isLoggedOut, homeModules, weatherFetchKey])

  useEffect(() => {
    if (isLoggedOut) {
      setMessageCount(0)
      return
    }
    let alive = true
    void loadSentMessagesAsync().then((messages) => {
      if (alive) setMessageCount(messages.length)
    })
    return () => {
      alive = false
    }
  }, [isLoggedOut])

  return (
    <div className="screen page-content body home-dashboard">
      <header className="page-header">
        <div>
          <h1 className="lg">{greeting()}</h1>
          <p>{todayLabel()}</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className={`icon-btn${hasUnviewedMilestone ? ' icon-btn--milestone' : ''}`}
            aria-label={hasUnviewedMilestone ? 'New milestone — view progress' : 'Your progress'}
            onClick={() => router.push('/settings/progress')}
          >
            <Trophy size={18} weight="regular" aria-hidden="true" />
            {hasUnviewedMilestone ? <span className="milestone-dot" aria-hidden="true" /> : null}
          </button>
          <button
            type="button"
            className={`icon-btn${pipelineCount > 0 ? ' icon-btn--count' : ''}`}
            aria-label={
              pipelineCount > 0 ? `Lead pipeline, ${pipelineCount} open` : 'Lead pipeline'
            }
            data-tour="header-pipeline"
            onClick={() => router.push('/pipeline')}
          >
            <Funnel size={18} weight="regular" aria-hidden="true" />
            {pipelineCount > 0 ? (
              <span className="icon-btn__count">{formatHeaderCount(pipelineCount)}</span>
            ) : null}
          </button>
          <button
            type="button"
            className={`icon-btn${messageCount > 0 ? ' icon-btn--count' : ''}`}
            aria-label={messageCount > 0 ? `Messages, ${messageCount}` : 'Messages'}
            onClick={() => router.push('/messages')}
          >
            <ChatCircle size={18} weight="regular" aria-hidden="true" />
            {messageCount > 0 ? (
              <span className="icon-btn__count">{formatHeaderCount(messageCount)}</span>
            ) : null}
          </button>
          <button
            type="button"
            className={`icon-btn${profileCompletion && !profileCompletion.isComplete ? ' icon-btn--profile-incomplete' : ''}`}
            aria-label={
              profileCompletion && !profileCompletion.isComplete
                ? 'Complete your profile — open settings'
                : 'Settings'
            }
            data-tour="settings"
            onClick={() => router.push('/settings')}
          >
            <Gear size={18} weight="regular" aria-hidden="true" />
            {profileCompletion && !profileCompletion.isComplete ? (
              <span className="profile-dot" aria-hidden="true" />
            ) : null}
          </button>
        </div>
      </header>

      {showTrialBanner && daysLeft != null && !trialDismissed ? (
        <TrialExpiryBanner
          daysLeft={daysLeft}
          onDismiss={() => {
            dismissTrialBanner()
            setTrialDismissed(true)
          }}
        />
      ) : null}

      {profileCompletion && !profileCompletion.isComplete && !isLoggedOut ? (
        <ProfileCompleteCard completion={profileCompletion} />
      ) : null}

      {!isLoggedOut && isHomeModuleEnabled(homeModules, 'cta_row') ? (
        <HomeCtaRow invoices={invoices} jobs={jobs} />
      ) : null}

      {!isLoggedOut && isHomeModuleEnabled(homeModules, 'ar_alert') ? (
        <ArSummaryCard summary={arSummary} />
      ) : null}

      {isHomeModuleEnabled(homeModules, 'job_readiness') && weatherReadiness ? (
        <WeatherReadinessCard result={weatherReadiness} skipEnterAnimation={weatherFromCache} />
      ) : null}

      {!isLoggedOut &&
      isHomeModuleEnabled(homeModules, 'invoice_month_carousel') &&
      invoiceMonthCarousel.length > 0 ? (
        <>
          <p className="sec">Collected</p>
          <MonthCarousel items={invoiceMonthCarousel} />
        </>
      ) : null}

      {!isLoggedOut && isHomeModuleEnabled(homeModules, 'revenue_chart') ? (
        <HomeRevenueChart jobs={jobs} />
      ) : null}

      <div data-tour="week-strip">
        {inventoryAlert && isHomeModuleEnabled(homeModules, 'inventory_alert') ? (
          <InventoryAlertCard alert={inventoryAlert} onPress={() => router.push('/inventory')} />
        ) : null}

        {!isLoggedOut && isHomeModuleEnabled(homeModules, 'month_calendar') ? (
          <>
            <p className="sec">Calendar</p>
            <HomeMonthCalendar
              jobs={jobs}
              selectedDate={selectedCalendarDate}
              onSelectDate={(iso) => setSelectedCalendarDate(iso)}
              weatherReadiness={weatherReadiness}
            />
            {selectedCalendarDate ? (
              <HomeDayJobsPanel
                date={selectedCalendarDate}
                jobs={jobs}
                onClear={() => setSelectedCalendarDate(null)}
              />
            ) : null}
          </>
        ) : isLoggedOut ? (
          <>
            <p className="sec">This week</p>
            <div className="week-strip">
              {weekDays.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  className={`day${day.isToday ? ' today' : ''}${blockedDates.has(day.date) ? ' day--blocked' : ''}`}
                  onClick={() => router.push(`/jobs?date=${day.date}`)}
                >
                  <div className="day-name">{day.label}</div>
                  <div className="day-num">{day.dayNum}</div>
                  <div className={`day-dot${day.jobCount > 0 ? '' : ' hidden'}`} />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {(isLoggedOut || isHomeModuleEnabled(homeModules, 'today_jobs')) && (
      <div data-tour="today-jobs">
        <p className="sec">Today&apos;s jobs</p>
        <TodayJobCard
          job={todayJob}
          isLoggedOut={isLoggedOut}
          onDirections={openMapsDirections}
          onStart={(jobId) => router.push(`/jobs/${jobId}`)}
          onAddJob={() => {
            if (isLoggedOut) router.push('/auth')
            else router.push('/jobs/new')
          }}
        />
        {!isLoggedOut && moreTodayJobs.length > 0 ? (
          <SectionGroup title="Also today">
            {moreTodayJobs.map((job) => (
              <ListRow
                key={job.id}
                icon={<Car size={18} weight="duotone" />}
                iconTone="green"
                title={job.clientName}
                subtitle={`${job.package} · ${capitalize(job.locationType)}`}
                badgeStatus={job.jobStatus ?? job.status}
                trailing={
                  formatStartTimeLabel(job.startTime) ? (
                    <span className="ui-list-row__amount">{formatStartTimeLabel(job.startTime)}</span>
                  ) : undefined
                }
                onClick={() => router.push(`/jobs/${job.id}`)}
              />
            ))}
          </SectionGroup>
        ) : null}
      </div>
      )}

      {upcomingJobs.length > 0 && isHomeModuleEnabled(homeModules, 'upcoming') && (
        <SectionGroup title="Upcoming">
          {upcomingJobs.map((job) => (
            <ListRow
              key={job.id}
              title={job.clientName}
              subtitle={`${job.packageName} · ${job.datetimeLabel.split('·').pop()?.trim() ?? job.locationLabel}`}
              trailing={<Badge tone={job.statusLabel === 'Pending' ? 'amber' : 'blue'}>{job.statusLabel}</Badge>}
              onClick={() => router.push(`/jobs/${job.id}`)}
            />
          ))}
        </SectionGroup>
      )}

    </div>
  )
}
