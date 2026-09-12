import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Car, MapTrifold, Plus } from '@/src/icons'
import type { TechRosterEntry } from '@rinse/core'
import { deleteJob, listJobs, updateJob } from '@/src/lib/api'
import type { JobWithRelations, Vehicle } from '@rinse/core'
import { appIntlLocale } from '@/src/i18n'
import { trackProductEvent } from '@/src/lib/telemetry'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppText,
  Badge,
  CurrencyAmount,
  EmptyState,
  GreenHeaderButton,
  IconHeaderButton,
  ListRow,
  ModuleHeaderActions,
  PillGroup,
  ScreenLoading,
  SearchField,
  SectionGroup,
  StaggeredListItem,
  SwipeableRow,
} from '@/src/components/ui'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { useModuleSearch } from '@/src/hooks/useModuleSearch'
import { useTabRefreshControl } from '@/src/hooks/useTabRefreshControl'
import {
  groupVehiclesByClient,
  listAllVehicles,
  vehicleDisplayName,
} from '@/src/lib/damage-api'
import {
  jobListBadgeTone,
  jobListIconTone,
  jobListRightTime,
  jobListRowSubtitle,
  jobListStatusKey,
} from '@/src/lib/jobs-list'
import {
  filterJobsByDate,
  filterJobsList,
  groupJobsByPeriod,
  matchingVehicleForQuery,
} from '@/src/lib/jobs-list-logic'
import { depositBadgeLabel, depositBadgeTone } from '@/src/lib/deposits'
import { driveSubtitlesForDayJobs } from '@/src/lib/drive-time'
import { loadSettings } from '@/src/lib/settings-store'
import { normalizeTechRoster } from '@/src/lib/wave5-prefs'
import { noScrollbarScrollProps } from '@/src/theme/invoice-surface'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

const VISIBLE_PER_SECTION = 4

type TechFilter = 'all' | 'you' | string

function jobsPeriodLabel() {
  return new Date().toLocaleDateString(appIntlLocale(), { month: 'long', year: 'numeric' })
}

function assigneeLabel(job: JobWithRelations, roster: TechRosterEntry[]): string {
  if (!job.assignee_id) return 'You'
  return roster.find((t) => t.id === job.assignee_id)?.name ?? 'Tech'
}

function filterByTech(jobs: JobWithRelations[], techFilter: TechFilter): JobWithRelations[] {
  if (techFilter === 'all') return jobs
  if (techFilter === 'you') return jobs.filter((j) => !j.assignee_id)
  return jobs.filter((j) => j.assignee_id === techFilter)
}

export default function JobsScreen() {
  const { t } = useTranslation()
  const dockPadding = useTabDockPadding()
  const router = useRouter()
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>()
  const dateFilter = typeof dateParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null
  const { openJob } = useDetailNavigation()
  const { tick } = useDataRefresh()
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [vehiclesByClient, setVehiclesByClient] = useState<Map<string, Vehicle[]>>(new Map())
  const { query, setQuery, visible: searchVisible, active: searchActive, toggle: toggleSearch, inputRef } =
    useModuleSearch()
  const [techFilter, setTechFilter] = useState<TechFilter>('all')
  const [techRoster, setTechRoster] = useState<TechRosterEntry[]>([])
  const [driveByJobId, setDriveByJobId] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routeMode, setRouteMode] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [rows, vehicles, settings] = await Promise.all([
        listJobs(200),
        listAllVehicles(),
        loadSettings(),
      ])
      setJobs(rows)
      setVehiclesByClient(groupVehiclesByClient(vehicles))
      setTechRoster(normalizeTechRoster(settings.tech_roster))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('jobs.loadFailed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  const refreshControl = useTabRefreshControl(refreshing, () => {
    void load(true)
  })

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load, tick]),
  )

  const filtered = useMemo(() => {
    const base = filterJobsList(jobs, query, 'all', vehiclesByClient)
    const dated = dateFilter ? filterJobsByDate(base, dateFilter) : base
    return filterByTech(dated, techFilter)
  }, [jobs, query, dateFilter, vehiclesByClient, techFilter])

  useFocusEffect(
    useCallback(() => {
      if (!dateFilter || filtered.length === 0) {
        setDriveByJobId({})
        return
      }
      let cancelled = false
      void driveSubtitlesForDayJobs(filtered).then((map) => {
        if (!cancelled) setDriveByJobId(map)
      })
      return () => {
        cancelled = true
      }
    }, [dateFilter, filtered]),
  )

  const sections = useMemo(() => groupJobsByPeriod(filtered), [filtered])
  const searching = query.trim().length > 0
  const jobCount =
    searching || dateFilter || techFilter !== 'all' ? filtered.length : jobs.length
  const dateLabel = dateFilter
    ? new Date(`${dateFilter}T12:00:00`).toLocaleDateString(appIntlLocale(), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null
  const subtitle = dateFilter
    ? t('jobs.onDate', { count: filtered.length, date: dateLabel })
    : searching || techFilter !== 'all'
      ? t('jobs.shown', { count: filtered.length })
      : t('jobs.totalPeriod', { count: jobCount, period: jobsPeriodLabel() })

  // Tech filter chips — All / You / roster.
  // TODO(team-filter): restore multi-tech assignment filters when jobs list supports them.
  // - "You" → jobs with no assignee_id (operator’s own unassigned/solo jobs)
  // - roster chips → filter by job.assignee_id matching that tech
  // - "Team" CTA below → Settings → Team to add techs (UserPlus), not a filter itself
  const techChipOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'All' },
      // { value: 'you', label: 'You' },
      // ...techRoster.map((tech) => ({ value: tech.id, label: tech.name })),
    ],
    // techRoster intentionally kept in deps for when chips are restored
    [techRoster],
  )

  const showTechFilterChips = false // was: techChipOptions.length > 1 once You/roster return

  const jobSubtitle = (job: JobWithRelations) => {
    if (!searching) return jobListRowSubtitle(job)
    const match = matchingVehicleForQuery(vehiclesByClient.get(job.client_id) ?? [], query)
    if (match) {
      const name = vehicleDisplayName(match)
      const extras = [match.color, match.plate].filter(Boolean).join(' · ')
      return extras ? `${name} · ${extras}` : name
    }
    return jobListRowSubtitle(job)
  }

  const handleRoutePress = () => {
    if (dateFilter) {
      setRouteMode((v) => !v)
      return
    }
    router.push('/(tabs)/routes' as never)
  }

  const showJobActions = (job: JobWithRelations) => {
    const actions: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = [
      { text: t('jobs.editJob'), onPress: () => router.push(`/jobs/edit/${job.id}`) },
    ]
    if (job.status === 'scheduled' || job.status === 'in_progress') {
      actions.push({
        text: t('jobs.cancelAppointment'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('jobs.cancelAppointmentConfirm'), t('jobs.cancelAppointmentBody'), [
            { text: t('common.keep'), style: 'cancel' },
            {
              text: t('jobs.cancelJob'),
              style: 'destructive',
              onPress: () => {
                void deleteJob(job.id).then((result) => {
                  if (result.ok) {
                    trackProductEvent('job_cancelled', { job_id: job.id, status: job.status })
                    void load(true)
                  } else {
                    Alert.alert(t('common.cancel'), result.error ?? 'Could not cancel job')
                  }
                })
              },
            },
          ])
        },
      })
    }
    actions.push({ text: t('common.close'), style: 'cancel' })
    Alert.alert(job.client?.name ?? t('jobs.title'), t('jobs.jobActions'), actions)
  }

  const moveRoute = async (jobId: string, direction: -1 | 1) => {
    const ordered = dateFilter ? filtered : []
    const idx = ordered.findIndex((j) => j.id === jobId)
    const swapIdx = idx + direction
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return
    const next = [...ordered]
    const tmp = next[idx]!
    next[idx] = next[swapIdx]!
    next[swapIdx] = tmp
    try {
      await Promise.all(
        next.map((job, i) =>
          updateJob(job.id, {
            date: job.date,
            packageId: job.package_id,
            vehicleType: job.vehicle_type,
            locationType: job.location_type,
            revenue: job.revenue,
            tip: job.tip,
            hours_worked: job.hours_worked,
            start_time: job.start_time,
            status: job.status,
            notes: job.notes,
            route_order: i + 1,
          }),
        ),
      )
      void load(true)
    } catch (e) {
      Alert.alert('Route', e instanceof Error ? e.message : 'Could not reorder')
    }
  }

  const renderJobRow = (job: JobWithRelations, grouped: boolean, isLast: boolean, staggerIndex: number) => {
    const iconTone = jobListIconTone(job)
    const routeIndex = dateFilter && routeMode ? filtered.findIndex((j) => j.id === job.id) + 1 : 0
    const depositTone = depositBadgeTone(job.deposit_status)
    const depositLabel = depositBadgeLabel(job.deposit_status)
    const drive = driveByJobId[job.id]
    const metaBits = [
      assigneeLabel(job, techRoster),
      depositLabel,
      drive,
      job.weather_hold ? 'Weather hold' : null,
    ].filter(Boolean)

    const row = (
      <ListRow
        grouped={grouped}
        isLast={isLast}
        icon={<Car size={18} color={iconTonePalette[iconTone].fg} weight="duotone" />}
        iconTone={iconTone}
        title={
          routeIndex > 0
            ? `${routeIndex}. ${job.client?.name ?? t('common.client')}`
            : (job.client?.name ?? t('common.client'))
        }
        subtitle={[jobSubtitle(job), metaBits.length ? metaBits.join(' · ') : null]
          .filter(Boolean)
          .join('\n')}
        badgeLabel={t(`jobs.status.${jobListStatusKey(job)}`)}
        badgeTone={jobListBadgeTone(job)}
        showChevron={false}
        trailing={
          <View style={styles.trailing}>
            {routeMode && dateFilter ? (
              <View style={styles.routeBtns}>
                <Pressable onPress={() => void moveRoute(job.id, -1)} hitSlop={8}>
                  <AppText variant="caption" style={styles.routeBtn}>
                    ↑
                  </AppText>
                </Pressable>
                <Pressable onPress={() => void moveRoute(job.id, 1)} hitSlop={8}>
                  <AppText variant="caption" style={styles.routeBtn}>
                    ↓
                  </AppText>
                </Pressable>
              </View>
            ) : null}
            <CurrencyAmount value={job.revenue + job.tip} variant="revenue" />
            <AppText variant="caption" style={styles.trailingTime}>
              {jobListRightTime(job)}
            </AppText>
            {depositTone && depositLabel ? <Badge tone={depositTone} label={depositLabel} /> : null}
          </View>
        }
        onPress={() => openJob(job.id)}
        onLongPress={() => showJobActions(job)}
      />
    )

    const cancelJob = () => {
      Alert.alert(t('jobs.cancelAppointmentConfirm'), t('jobs.cancelAppointmentBody'), [
        { text: t('common.keep'), style: 'cancel' },
        {
          text: t('jobs.cancelJob'),
          style: 'destructive',
          onPress: () => {
            void deleteJob(job.id).then((result) => {
              if (result.ok) {
                trackProductEvent('job_cancelled', { job_id: job.id, status: job.status })
                void load(true)
              } else {
                Alert.alert(t('common.cancel'), result.error ?? 'Could not cancel job')
              }
            })
          },
        },
      ])
    }

    return (
      <StaggeredListItem key={job.id} index={staggerIndex}>
        <SwipeableRow
          rowId={job.id}
          openRowId={openSwipeId}
          onOpenChange={setOpenSwipeId}
          onEdit={() => router.push(`/jobs/edit/${job.id}`)}
          onDelete={
            job.status === 'scheduled' || job.status === 'in_progress' ? cancelJob : () => showJobActions(job)
          }
        >
          {row}
        </SwipeableRow>
      </StaggeredListItem>
    )
  }

  return (
    <OperatorScreen
      title={t('jobs.title')}
      subtitle={subtitle}
      hideScrollbars
      headerRight={
        <ModuleHeaderActions
          onSearchPress={toggleSearch}
          searchActive={searchActive}
          onSettingsPress={() => router.push('/(tabs)/settings')}
          settingsLabel={t('home.settings')}
        >
          <IconHeaderButton label={t('home.routes')} onPress={handleRoutePress} active={routeMode}>
            <MapTrifold
              size={18}
              color={routeMode ? colors.greenText : colors.textSecondary}
              weight="duotone"
            />
          </IconHeaderButton>
          <GreenHeaderButton label={t('jobs.add')} onPress={() => router.push('/jobs/new')}>
            <Plus size={18} color="#fff" weight="bold" />
          </GreenHeaderButton>
        </ModuleHeaderActions>
      }
    >
      {searchVisible ? (
        <SearchField
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={t('jobs.searchPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      ) : null}

      {showTechFilterChips ? (
        <View style={styles.techRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.techChipsScroll}
            contentContainerStyle={styles.techChips}
          >
            <PillGroup inline options={techChipOptions} value={techFilter} onChange={setTechFilter} />
          </ScrollView>
        </View>
      ) : null}

      {dateFilter && routeMode ? (
        <View style={styles.routeBanner}>
          <AppText variant="caption" style={styles.routeBannerText}>
            Reorder stop sequence
          </AppText>
        </View>
      ) : null}

      {dateFilter ? (
        <Pressable
          onPress={() => router.setParams({ date: undefined })}
          style={styles.dateBanner}
          accessibilityRole="button"
        >
          <AppText variant="caption" style={styles.dateBannerText}>
            {t('jobs.showingDate', { date: dateLabel })}
          </AppText>
        </Pressable>
      ) : null}

      {loading ? (
        <ScreenLoading variant="list" />
      ) : error ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : sections.length === 0 ? (
        <EmptyState
          illustration="jobs"
          title={t('jobs.emptyTitle')}
          description={
            query || techFilter !== 'all' ? t('jobs.emptyFiltered') : t('jobs.emptyDefault')
          }
          actionLabel={t('jobs.create')}
          onAction={() => router.push('/jobs/new')}
        />
      ) : (
        <ScrollView
          {...noScrollbarScrollProps}
          refreshControl={refreshControl}
          contentContainerStyle={[styles.list, { paddingBottom: dockPadding }]}
        >
          {sections.map((section) => {
            const isExpanded = expanded[section.key]
            const visible = isExpanded ? section.jobs : section.jobs.slice(0, VISIBLE_PER_SECTION)
            const hidden = section.jobs.length - visible.length
            const sectionTitle =
              section.key === 'today'
                ? t('jobs.sections.today', { date: section.dateHint })
                : section.key === 'week'
                  ? t('jobs.sections.week')
                  : section.key === 'month'
                    ? t('jobs.sections.month')
                    : t('jobs.sections.older')

            return (
              <SectionGroup key={section.key} title={sectionTitle}>
                <View style={styles.groupCard}>
                  {visible.map((job, index) =>
                    renderJobRow(job, true, index >= visible.length - 1 && hidden <= 0, index),
                  )}
                  {hidden > 0 ? (
                    <Pressable
                      style={({ pressed }) => [styles.morePill, pressed && styles.pressed]}
                      onPress={() => setExpanded((e) => ({ ...e, [section.key]: true }))}
                    >
                      <AppText variant="bodySemiBold" style={styles.moreLabel}>
                        {t('jobs.moreJobs', { count: hidden })}
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              </SectionGroup>
            )
          })}
        </ScrollView>
      )}
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  techChipsScroll: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 44,
  },
  techChips: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingRight: spacing.sm,
  },
  dateBanner: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: iconTonePalette.green.bg,
  },
  dateBannerText: {
    color: colors.greenText,
  },
  routeBanner: {
    marginBottom: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: iconTonePalette.blue.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: iconTonePalette.blue.fg,
  },
  routeBannerText: {
    color: iconTonePalette.blue.fg,
    fontWeight: '600',
  },
  list: {
    paddingBottom: spacing.lg,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  morePill: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  moreLabel: {
    color: colors.greenText,
  },
  pressed: {
    opacity: 0.85,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 72,
  },
  routeBtns: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  routeBtn: {
    color: colors.greenText,
    fontWeight: '700',
    fontSize: 16,
  },
  trailingTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
})
