import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CaretLeft, CaretRight, Car } from 'phosphor-react-native'
import { fmt, type JobWithRelations } from '@rinse/core'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import { DayRouteBanner } from '@/src/components/jobs/DayRouteBanner'
import { RouteGarageCard } from '@/src/components/jobs/RouteGarageCard'
import {
  AppText,
  EmptyState,
  ListRow,
  ScreenLoading,
  SectionGroup,
} from '@/src/components/ui'
import { SettingsHeader } from '@/src/components/ui/BackHeaderButton'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { listJobs, updateJob } from '@/src/lib/api'
import { dayRouteHasUsableStops, openDayRouteInAppleMaps } from '@/src/lib/day-route'
import { jobsForDate } from '@/src/lib/home-dashboard'
import {
  jobListBadgeTone,
  jobListRightTime,
  jobListStatusLabel,
  normalizeJobDate,
} from '@/src/lib/jobs-list'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { loadSettings } from '@/src/lib/settings-store'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function pickDefaultRouteDate(jobDates: string[], today: string): string {
  const unique = [...new Set(jobDates.map(normalizeJobDate).filter(Boolean))].sort()
  if (unique.includes(today)) return today
  const upcoming = unique.find((d) => d >= today)
  if (upcoming) return upcoming
  return unique[unique.length - 1] ?? today
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function RoutesScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const goBack = useSafeBack()
  const dockPadding = useTabDockPadding()
  const { openJob } = useDetailNavigation()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [dateSeeded, setDateSeeded] = useState(false)
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [depotAddress, setDepotAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reordering, setReordering] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [rows, settings] = await Promise.all([listJobs(200), loadSettings()])
      setJobs(rows)
      setDepotAddress(settings.business_address?.trim() ?? '')
      if (!dateSeeded) {
        setDate(pickDefaultRouteDate(rows.map((j) => j.date), todayISO()))
        setDateSeeded(true)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateSeeded])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const dayJobs = useMemo(() => jobsForDate(jobs, date), [jobs, date])
  const canStartRoute = dayRouteHasUsableStops(dayJobs)
  const hasGarage = Boolean(depotAddress.trim())
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const isToday = date === today

  const moveRoute = async (jobId: string, direction: -1 | 1) => {
    if (reordering) return
    const ordered = dayJobs
    const idx = ordered.findIndex((j) => j.id === jobId)
    const swapIdx = idx + direction
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return
    const next = [...ordered]
    const tmp = next[idx]!
    next[idx] = next[swapIdx]!
    next[swapIdx] = tmp
    // Optimistic local order so the list doesn't flash back while PB writes.
    setJobs((prev) => {
      const orderById = new Map(next.map((j, i) => [j.id, i + 1]))
      return prev.map((j) => {
        const route_order = orderById.get(j.id)
        return route_order != null ? { ...j, route_order } : j
      })
    })
    setReordering(true)
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
      Alert.alert(t('routes.title'), e instanceof Error ? e.message : t('routes.reorderError'))
      void load(true)
    } finally {
      setReordering(false)
    }
  }

  return (
    <OperatorScreen
      customHeader={
        <SettingsHeader
          title={t('routes.title')}
          subtitle={t('routes.subtitle')}
          onBack={goBack}
        />
      }
    >
      <View style={styles.scrubber}>
        <Pressable
          onPress={() => setDate((d) => shiftDate(d, -1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('routes.prevDay')}
          style={styles.scrubBtn}
        >
          <CaretLeft size={18} color={colors.greenText} weight="bold" />
        </Pressable>
        <AppText variant="bodySemiBold" style={styles.scrubLabel}>
          {isToday ? t('routes.today', { date: dateLabel }) : dateLabel}
        </AppText>
        <Pressable
          onPress={() => setDate((d) => shiftDate(d, 1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('routes.nextDay')}
          style={styles.scrubBtn}
        >
          <CaretRight size={18} color={colors.greenText} weight="bold" />
        </Pressable>
      </View>

      {loading ? (
        <ScreenLoading variant="list" />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />
          }
          contentContainerStyle={[styles.list, { paddingBottom: dockPadding }]}
        >
          {dayJobs.length === 0 ? (
            <EmptyState
              illustration="jobs"
              title={t('routes.emptyTitle')}
              description={t('routes.emptyBody')}
            />
          ) : (
            <>
              <DayRouteBanner
                hint={
                  hasGarage
                    ? t('jobs.routeMapsHintFromGarage', {
                        defaultValue:
                          'Starts at your garage, then today’s stops in Apple Maps',
                      })
                    : t('jobs.routeMapsHint')
                }
                startLabel={t('jobs.startRoute')}
                onStartRoute={() => {
                  // #region agent log
                  if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
                    fetch(`${window.location.origin}/__agent-debug`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Debug-Session-Id': '89a058',
                      },
                      body: JSON.stringify({
                        sessionId: '89a058',
                        runId: 'post-fix',
                        hypothesisId: 'A',
                        location: 'routes.tsx:onStartRoute',
                        message: 'Routes screen Start route',
                        data: {
                          selectedDate: date,
                          dayJobCount: dayJobs.length,
                          allJobsCount: jobs.length,
                          dayNames: dayJobs.map((j) => j.client?.name ?? j.id),
                          depotSet: Boolean(depotAddress.trim()),
                        },
                        timestamp: Date.now(),
                      }),
                    }).catch(() => {})
                  }
                  // #endregion
                  void openDayRouteInAppleMaps(dayJobs, {
                    depotAddress,
                    noStopsTitle: t('jobs.routeNoStopsTitle'),
                    noStopsBody: t('jobs.routeNoStopsBody'),
                    truncatedTitle: t('jobs.routeTruncatedTitle'),
                    truncatedBody: (count) => t('jobs.routeTruncatedBody', { count }),
                  })
                }}
                startDisabled={!canStartRoute}
              />
              {hasGarage ? (
                <RouteGarageCard
                  title={t('routes.garageTitle', { defaultValue: 'Your garage' })}
                  address={depotAddress}
                  badgeLabel={t('routes.garageStartBadge', { defaultValue: 'Start' })}
                  pinnedHint={t('routes.garagePinnedHint', {
                    defaultValue: 'Always first — can’t be reordered',
                  })}
                  onPress={() => router.push('/settings/business' as never)}
                />
              ) : null}
              <SectionGroup title={t('routes.stops', { count: dayJobs.length })}>
                <View style={styles.groupCard}>
                  {dayJobs.map((job, index) => (
                    <ListRow
                      key={job.id}
                      grouped
                      isLast={index >= dayJobs.length - 1}
                      nestedInteractions
                      icon={<Car size={18} color={iconTonePalette.green.fg} weight="duotone" />}
                      iconTone="green"
                      title={`${index + 1}. ${job.client?.name ?? t('common.client')}`}
                      subtitle={`${job.package?.name ?? t('common.detail')} · ${capitalize(job.vehicle_type)}`}
                      badgeLabel={jobListStatusLabel(job)}
                      badgeTone={jobListBadgeTone(job)}
                      trailing={
                        <View style={styles.trailing}>
                          <View style={styles.routeBtns}>
                            <Pressable
                              onPress={() => void moveRoute(job.id, -1)}
                              hitSlop={8}
                              disabled={reordering || index === 0}
                              accessibilityRole="button"
                              accessibilityLabel={t('routes.moveUp')}
                            >
                              <AppText
                                variant="caption"
                                style={[
                                  styles.routeBtn,
                                  (reordering || index === 0) && styles.routeBtnDisabled,
                                ]}
                              >
                                ↑
                              </AppText>
                            </Pressable>
                            <Pressable
                              onPress={() => void moveRoute(job.id, 1)}
                              hitSlop={8}
                              disabled={reordering || index >= dayJobs.length - 1}
                              accessibilityRole="button"
                              accessibilityLabel={t('routes.moveDown')}
                            >
                              <AppText
                                variant="caption"
                                style={[
                                  styles.routeBtn,
                                  (reordering || index >= dayJobs.length - 1) && styles.routeBtnDisabled,
                                ]}
                              >
                                ↓
                              </AppText>
                            </Pressable>
                          </View>
                          <AppText variant="bodySemiBold">{fmt(job.revenue + job.tip)}</AppText>
                          <AppText variant="caption" style={styles.trailingTime}>
                            {jobListRightTime(job)}
                          </AppText>
                        </View>
                      }
                      onPress={() => openJob(job.id)}
                    />
                  ))}
                </View>
              </SectionGroup>
            </>
          )}
        </ScrollView>
      )}
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scrubber: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  scrubBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  scrubLabel: {
    color: colors.text,
  },
  list: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
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
  routeBtnDisabled: {
    opacity: 0.35,
  },
})
