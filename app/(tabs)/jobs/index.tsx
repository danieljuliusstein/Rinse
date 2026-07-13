import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Car, Plus } from 'phosphor-react-native'
import { deleteJob, listJobs } from '@/src/lib/api'
import type { JobWithRelations, Vehicle } from '@rinse/core'
import { appIntlLocale } from '@/src/i18n'
import { trackProductEvent } from '@/src/lib/telemetry'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppText,
  CurrencyAmount,
  EmptyState,
  GreenHeaderButton,
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
  JOB_FILTER_CHIPS,
  matchingVehicleForQuery,
  type JobsListFilter,
} from '@/src/lib/jobs-list-logic'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

const VISIBLE_PER_SECTION = 4

function jobsPeriodLabel() {
  return new Date().toLocaleDateString(appIntlLocale(), { month: 'long', year: 'numeric' })
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
  const [chip, setChip] = useState<JobsListFilter>('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [rows, vehicles] = await Promise.all([listJobs(200), listAllVehicles()])
      setJobs(rows)
      setVehiclesByClient(groupVehiclesByClient(vehicles))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('jobs.loadFailed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load, tick])
  )

  const filtered = useMemo(() => {
    const base = filterJobsList(jobs, query, chip, vehiclesByClient)
    return dateFilter ? filterJobsByDate(base, dateFilter) : base
  }, [jobs, query, chip, dateFilter, vehiclesByClient])
  const sections = useMemo(() => groupJobsByPeriod(filtered), [filtered])
  const searching = query.trim().length > 0
  const jobCount = searching || chip !== 'all' || dateFilter ? filtered.length : jobs.length
  const dateLabel = dateFilter
    ? new Date(`${dateFilter}T12:00:00`).toLocaleDateString(appIntlLocale(), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null
  const subtitle =
    dateFilter
      ? t('jobs.onDate', { count: filtered.length, date: dateLabel })
      : searching || chip !== 'all'
        ? t('jobs.shown', { count: filtered.length })
        : t('jobs.totalPeriod', { count: jobCount, period: jobsPeriodLabel() })

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

  const renderJobRow = (job: JobWithRelations, grouped: boolean, isLast: boolean, staggerIndex: number) => {
    const iconTone = jobListIconTone(job)
    const row = (
      <ListRow
        grouped={grouped}
        isLast={isLast}
        icon={<Car size={18} color={iconTonePalette[iconTone].fg} weight="duotone" />}
        iconTone={iconTone}
        title={job.client?.name ?? t('common.client')}
        subtitle={jobSubtitle(job)}
        badgeLabel={t(`jobs.status.${jobListStatusKey(job)}`)}
        badgeTone={jobListBadgeTone(job)}
        showChevron={false}
        trailing={
          <View style={styles.trailing}>
            <CurrencyAmount value={job.revenue + job.tip} variant="revenue" />
            <AppText variant="caption" style={styles.trailingTime}>
              {jobListRightTime(job)}
            </AppText>
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
      headerRight={
        <ModuleHeaderActions onSearchPress={toggleSearch} searchActive={searchActive}>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <PillGroup
          options={JOB_FILTER_CHIPS.map((c) => ({ value: c.key, label: t(c.labelKey) }))}
          value={chip}
          onChange={setChip}
        />
      </ScrollView>

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
          description={query || chip !== 'all' ? t('jobs.emptyFiltered') : t('jobs.emptyDefault')}
          actionLabel={t('jobs.create')}
          onAction={() => router.push('/jobs/new')}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />
          }
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
  chips: {
    maxHeight: 56,
    marginBottom: spacing.sm,
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
  trailingTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
})
