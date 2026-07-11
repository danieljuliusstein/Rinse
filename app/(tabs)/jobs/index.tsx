import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Car, Plus } from 'phosphor-react-native'
import { deleteJob, listJobs } from '@/src/lib/api'
import type { JobWithRelations, Vehicle } from '@rinse/core'
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
  jobListStatusLabel,
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
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function JobsScreen() {
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
      setError(e instanceof Error ? e.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

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
    ? new Date(`${dateFilter}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null
  const subtitle =
    dateFilter
      ? `${filtered.length} on ${dateLabel}`
      : searching || chip !== 'all'
        ? `${filtered.length} shown`
        : `${jobCount} total · ${jobsPeriodLabel()}`

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
      { text: 'Edit job', onPress: () => router.push(`/jobs/edit/${job.id}`) },
    ]
    if (job.status === 'scheduled' || job.status === 'in_progress') {
      actions.push({
        text: 'Cancel appointment',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Cancel appointment?', 'This frees the slot and removes the job.', [
            { text: 'Keep', style: 'cancel' },
            {
              text: 'Cancel job',
              style: 'destructive',
              onPress: () => {
                void deleteJob(job.id).then((result) => {
                  if (result.ok) void load(true)
                  else Alert.alert('Cancel', result.error ?? 'Could not cancel job')
                })
              },
            },
          ])
        },
      })
    }
    actions.push({ text: 'Close', style: 'cancel' })
    Alert.alert(job.client?.name ?? 'Job', 'Job actions', actions)
  }

  const renderJobRow = (job: JobWithRelations, grouped: boolean, isLast: boolean) => {
    const iconTone = jobListIconTone(job)
    const row = (
      <ListRow
        grouped={grouped}
        isLast={isLast}
        icon={<Car size={18} color={iconTonePalette[iconTone].fg} weight="duotone" />}
        iconTone={iconTone}
        title={job.client?.name ?? 'Client'}
        subtitle={jobSubtitle(job)}
        badgeLabel={jobListStatusLabel(job)}
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
      Alert.alert('Cancel appointment?', 'This frees the slot and removes the job.', [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel job',
          style: 'destructive',
          onPress: () => {
            void deleteJob(job.id).then((result) => {
              if (result.ok) void load(true)
              else Alert.alert('Cancel', result.error ?? 'Could not cancel job')
            })
          },
        },
      ])
    }

    return (
      <SwipeableRow
        key={job.id}
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
    )
  }

  return (
    <OperatorScreen
      title="Jobs"
      subtitle={subtitle}
      headerRight={
        <ModuleHeaderActions onSearchPress={toggleSearch} searchActive={searchActive}>
          <GreenHeaderButton label="Add job" onPress={() => router.push('/jobs/new')}>
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
          placeholder="Search make, color, plate, client…"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <PillGroup
          options={JOB_FILTER_CHIPS.map((c) => ({ value: c.key, label: c.label }))}
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
            Showing {dateLabel} · Clear
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
          title="No jobs found"
          description={query || chip !== 'all' ? 'Try a different search or filter.' : 'Schedule your first job to start tracking revenue.'}
          actionLabel="Create job"
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

            return (
              <SectionGroup key={section.key} title={section.label}>
                <View style={styles.groupCard}>
                  {visible.map((job, index) =>
                    renderJobRow(job, true, index >= visible.length - 1 && hidden <= 0),
                  )}
                  {hidden > 0 ? (
                    <Pressable
                      style={({ pressed }) => [styles.morePill, pressed && styles.pressed]}
                      onPress={() => setExpanded((e) => ({ ...e, [section.key]: true }))}
                    >
                      <AppText variant="bodySemiBold" style={styles.moreLabel}>
                        + {hidden} more
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
