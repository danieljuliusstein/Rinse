import { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Invoice, JobWithRelations, Package, Supply } from '@rinse/core'
import { ArSummaryCard } from '@/src/components/home/ArSummaryCard'
import { HomeCtaRow } from '@/src/components/home/HomeCtaRow'
import { HomeGreetingHeader } from '@/src/components/home/HomeGreetingHeader'
import { HomeMonthCalendar } from '@/src/components/home/HomeMonthCalendar'
import { HomeRevenueChart } from '@/src/components/home/HomeRevenueChart'
import { HomeSection } from '@/src/components/home/HomeSection'
import { TodayJobCard } from '@/src/components/home/TodayJobCard'
import { MonthCarousel } from '@/src/components/ui/MonthCarousel'
import { buildInvoiceMonthCarouselItems } from '@/src/lib/invoice-month-revenue'
import { InventoryAlertCard } from '@/src/components/home/InventoryAlertCard'
import { ProfileCompleteCard } from '@/src/components/home/ProfileCompleteCard'
import { WeatherReadinessCard } from '@/src/components/home/WeatherReadinessCard'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppText,
  Badge,
  BlockStagger,
  ListRow,
  ScreenLoading,
  SearchField,
  SectionGroup,
} from '@/src/components/ui'
import { computeArSummary } from '@/src/lib/ar-metrics'
import { listJobs, listPackages, openMaps } from '@/src/lib/api'
import {
  buildComingUpJobs,
  buildInventoryAlert,
  buildMoreTodayJobs,
  buildTodayJobCard,
  searchHomeJobs,
  todayJobDetailsLine,
} from '@/src/lib/home-dashboard'
import { listInvoices } from '@/src/lib/invoices-api'
import { listLeads, pipelineOpenCount } from '@/src/lib/leads-api'
import { normalizeJobDate } from '@/src/lib/jobs-list'
import { isScreenshotMode } from '@/src/lib/screenshot-mode'
import { computeProfileCompletion } from '@/src/lib/profile-completion'
import { isHomeModuleEnabled, loadSettings, type HomeModulePrefs } from '@/src/lib/settings-store'
import { listSupplies } from '@/src/lib/supplies-api'
import { fetchWeatherReadiness, type WeatherReadinessResult } from '@/src/lib/weather-readiness'
import {
  computeBlockedDates,
  datesInMonth,
  DEFAULT_BOOKING_SCHEDULE,
  monthDateRange,
} from '@/src/lib/booking-calendar'
import { getTimeBlocks } from '@/src/lib/time-blocks-api'
import { useOffline } from '@/src/providers/OfflineProvider'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { useModuleSearch } from '@/src/hooks/useModuleSearch'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { useAuth } from '@/src/providers/AuthProvider'
import { colors, spacing } from '@/src/theme/colors'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function compactDateLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function displayNameFromUser(name: unknown): string | null {
  if (typeof name !== 'string') return null
  const first = name.trim().split(/\s+/)[0]
  return first || null
}

function avatarInitial(name: string | null): string {
  if (!name) return 'R'
  return name.charAt(0).toUpperCase()
}

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { openJob } = useDetailNavigation()
  const { pendingCount } = useOffline()
  const { tick } = useDataRefresh()
  const dockPadding = useTabDockPadding()
  const { query, setQuery, visible: searchVisible, active: searchActive, toggle: toggleSearch, inputRef } =
    useModuleSearch()
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [pipelineCount, setPipelineCount] = useState(0)
  const [weather, setWeather] = useState<WeatherReadinessResult | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [profilePercent, setProfilePercent] = useState<ReturnType<typeof computeProfileCompletion> | null>(null)
  const [homeModules, setHomeModules] = useState<HomeModulePrefs>({})
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = useMemo(() => displayNameFromUser(user?.name), [user?.name])

  useEffect(() => {
    let cancelled = false
    setWeatherLoading(true)
    void Promise.all([
      listJobs(200),
      listInvoices(),
      listLeads(),
      listPackages(),
      listSupplies(),
      loadSettings(),
      fetchWeatherReadiness(),
    ])
      .then(([jobRows, invoiceRows, leads, packageRows, supplyRows, settings, weatherResult]) => {
        if (cancelled) return
        setJobs(jobRows)
        setInvoices(invoiceRows)
        setPackages(packageRows)
        setSupplies(supplyRows)
        setPipelineCount(pipelineOpenCount(leads))
        setProfilePercent(computeProfileCompletion(settings))
        setHomeModules(settings.home_modules ?? {})
        setWeather(weatherResult)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setWeatherLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const loadBlockedDates = useCallback(async (year: number, month: number) => {
    const settings = await loadSettings()
    const schedule = settings.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE
    const { from, to } = monthDateRange(year, month)
    const blocks = await getTimeBlocks(from, to)
    const allDay = blocks.filter((b) => b.all_day).map((b) => b.date)
    setBlockedDates(computeBlockedDates(datesInMonth(year, month), schedule, allDay))
  }, [])

  const handleViewMonthChange = useCallback((year: number, month: number) => {
    setCalendarMonth((prev) => (prev.year === year && prev.month === month ? prev : { year, month }))
  }, [])

  useEffect(() => {
    void loadBlockedDates(calendarMonth.year, calendarMonth.month)
  }, [calendarMonth.year, calendarMonth.month, loadBlockedDates, tick])

  const arSummary = useMemo(() => computeArSummary(invoices), [invoices])
  const invoiceMonthCarousel = useMemo(() => buildInvoiceMonthCarouselItems(invoices), [invoices])
  const upcomingJobs = useMemo(() => buildComingUpJobs(jobs, 3), [jobs])
  const todayJob = useMemo(() => buildTodayJobCard(jobs), [jobs])
  const moreTodayJobs = useMemo(() => buildMoreTodayJobs(jobs), [jobs])
  const searching = query.trim().length > 0
  const searchResults = useMemo(() => (searching ? searchHomeJobs(jobs, query) : []), [jobs, query, searching])

  const inventoryAlert = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayJobRow = jobs.find(
      (j) => normalizeJobDate(j.date) === today && j.status === 'scheduled'
    )
    return buildInventoryAlert(todayJobRow?.package_id, supplies, packages)
  }, [jobs, supplies, packages])

  const greetingHeader = (
    <HomeGreetingHeader
      greeting={greeting()}
      displayName={displayName}
      dateLabel={compactDateLabel()}
      avatarInitial={avatarInitial(displayName)}
      pipelineBadge={pipelineCount}
      settingsDot={Boolean(profilePercent && !profilePercent.isComplete)}
      onSearchPress={toggleSearch}
      searchActive={searchActive}
    />
  )

  return (
    <OperatorScreen customHeader={greetingHeader}>
      {loading ? (
        <ScreenLoading variant="home" />
      ) : error ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {searchVisible ? (
            <SearchField
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search jobs, clients, packages…"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          ) : null}

          {searching ? (
            <View style={styles.headerBlock}>
              {searchResults.length === 0 ? (
                <AppText variant="caption" style={styles.syncHint}>
                  No jobs match “{query.trim()}”.
                </AppText>
              ) : (
                <SectionGroup title={`${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}>
                  {searchResults.map((job) => (
                    <ListRow
                      key={job.id}
                      title={job.client?.name ?? 'Client'}
                      subtitle={`${job.package?.name ?? 'Detail'} · ${normalizeJobDate(job.date)}`}
                      meta={job.start_time || undefined}
                      showChevron={false}
                      onPress={() => openJob(job.id)}
                    />
                  ))}
                </SectionGroup>
              )}
            </View>
          ) : (
          <View style={styles.headerBlock}>
            {pendingCount > 0 ? (
              <BlockStagger index={0}>
                <AppText variant="caption" style={styles.syncHint}>
                  {pendingCount} change{pendingCount === 1 ? '' : 's'} waiting to sync
                </AppText>
              </BlockStagger>
            ) : null}

            {profilePercent && !profilePercent.isComplete && !isScreenshotMode() ? (
              <BlockStagger index={1}>
                <ProfileCompleteCard completion={profilePercent} />
              </BlockStagger>
            ) : null}

            {isHomeModuleEnabled(homeModules, 'cta_row') ? (
              <BlockStagger index={2}>
                <HomeCtaRow />
              </BlockStagger>
            ) : null}

            {isHomeModuleEnabled(homeModules, 'ar_alert') ? (
              <BlockStagger index={3}>
                <ArSummaryCard summary={arSummary} />
              </BlockStagger>
            ) : null}

            {isHomeModuleEnabled(homeModules, 'job_readiness') ? (
              <BlockStagger index={4}>
                <HomeSection label="Job readiness">
                  <WeatherReadinessCard result={weather} loading={weatherLoading} compact />
                </HomeSection>
              </BlockStagger>
            ) : null}

            {isHomeModuleEnabled(homeModules, 'invoice_month_carousel') && invoiceMonthCarousel.length > 0 ? (
              <BlockStagger index={5}>
                <HomeSection label="Collected">
                  <MonthCarousel items={invoiceMonthCarousel} />
                </HomeSection>
              </BlockStagger>
            ) : null}

            {isHomeModuleEnabled(homeModules, 'revenue_chart') ? (
              <BlockStagger index={6}>
                <HomeRevenueChart jobs={jobs} />
              </BlockStagger>
            ) : null}

            {inventoryAlert && isHomeModuleEnabled(homeModules, 'inventory_alert') ? (
              <BlockStagger index={7}>
                <InventoryAlertCard alert={inventoryAlert} onPress={() => router.push('/(tabs)/inventory')} />
              </BlockStagger>
            ) : null}

            {isHomeModuleEnabled(homeModules, 'month_calendar') ? (
              <BlockStagger index={8}>
                <HomeSection label="Calendar">
                  <HomeMonthCalendar
                    jobs={jobs}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    weatherReadiness={weather}
                    blockedDates={blockedDates}
                    onViewMonthChange={handleViewMonthChange}
                  />
                </HomeSection>
              </BlockStagger>
            ) : null}

            {isHomeModuleEnabled(homeModules, 'today_jobs') ? (
              <BlockStagger index={9}>
                <HomeSection label="Today's jobs">
                  <TodayJobCard
                    job={todayJob}
                    onDirections={(address) => void Linking.openURL(openMaps(address))}
                    onOpenJob={(jobId) => openJob(jobId)}
                    onSchedule={() => router.push('/jobs/new')}
                  />
                </HomeSection>
              </BlockStagger>
            ) : null}

            {moreTodayJobs.length > 0 && isHomeModuleEnabled(homeModules, 'today_jobs') ? (
              <BlockStagger index={10}>
                <SectionGroup title="Also today">
                  {moreTodayJobs.map((job) => (
                    <ListRow
                      key={job.id}
                      title={job.clientName}
                      subtitle={todayJobDetailsLine(job)}
                      meta={job.startTimeLabel ?? undefined}
                      showChevron={false}
                      onPress={() => openJob(job.id)}
                    />
                  ))}
                </SectionGroup>
              </BlockStagger>
            ) : null}

            {upcomingJobs.length > 0 && isHomeModuleEnabled(homeModules, 'upcoming') ? (
              <BlockStagger index={11}>
                <SectionGroup title="Upcoming">
                  {upcomingJobs.map((job) => (
                    <ListRow
                      key={job.id}
                      title={job.clientName}
                      subtitle={`${job.packageName} · ${job.datetimeLabel.split('·').pop()?.trim() ?? job.locationLabel}`}
                      trailing={
                        <Badge
                          tone={job.statusLabel === 'Pending' ? 'amber' : 'blue'}
                          label={job.statusLabel}
                        />
                      }
                      showChevron={false}
                      onPress={() => openJob(job.id)}
                    />
                  ))}
                </SectionGroup>
              </BlockStagger>
            ) : null}
          </View>
          )}
        </ScrollView>
      )}
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: 12,
  },
  syncHint: {
    color: colors.textMuted,
  },
  scroll: {},
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
})
