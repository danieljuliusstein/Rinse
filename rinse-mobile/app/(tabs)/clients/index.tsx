import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { DownloadSimple, Plus, SortAscending, UploadSimple } from '@/src/icons'
import type { ClientWithStats } from '@rinse/core'
import { listClientsWithStats } from '@/src/lib/api'
import { ClientCard } from '@/src/components/clients/ClientCard'
import { FollowUpClearSheet } from '@/src/components/clients/FollowUpClearSheet'
import { FollowUpClientCard } from '@/src/components/clients/FollowUpClientCard'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppFlashList,
  AppText,
  EmptyState,
  IconHeaderButton,
  ModuleHeaderActions,
  PillGroup,
  ScreenLoading,
  SearchField,
  StaggeredListItem,
} from '@/src/components/ui'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { useModuleSearch } from '@/src/hooks/useModuleSearch'
import { useTabRefreshControl } from '@/src/hooks/useTabRefreshControl'
import { formatClientsCsv, shareTextExport } from '@/src/lib/data-export'
import {
  buildDerivedMap,
  CLIENT_SEGMENT_CHIPS,
  CLIENT_SORT_OPTIONS,
  filterClientsBySegment,
  overdueClients,
  searchClients,
  sortClients,
  topClientsByRevenue,
  type ClientSegment,
  type ClientSort,
} from '@/src/lib/client-relationship-logic'
import {
  DEFAULT_FOLLOW_UP_PREFS,
  dismissUntilNextJobInPrefs,
  isFollowUpSuppressed,
  loadFollowUpPrefs,
  pruneFollowUpPrefs,
  saveFollowUpPrefs,
  snoozeClientInPrefs,
  type FollowUpPrefs,
} from '@/src/lib/follow-up-prefs-store'
import { colors, spacing, webInlinePressableReset } from '@/src/theme/colors'

const CLIENTS_VISIBLE = 5

export default function ClientsScreen() {
  const { t } = useTranslation()
  const dockPadding = useTabDockPadding()
  const router = useRouter()
  const { tick } = useDataRefresh()
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const { query, setQuery, visible: searchVisible, active: searchActive, toggle: toggleSearch, inputRef } =
    useModuleSearch()
  const [segment, setSegment] = useState<ClientSegment>('all')
  const [sort, setSort] = useState<ClientSort>('revenue')
  const [sortOpen, setSortOpen] = useState(false)
  const [showAllRest, setShowAllRest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const refreshControl = useTabRefreshControl(refreshing, () => {
    void load(true)
  })
  const [error, setError] = useState<string | null>(null)
  const [followUpPrefs, setFollowUpPrefs] = useState<FollowUpPrefs>({
    ...DEFAULT_FOLLOW_UP_PREFS,
    suppressions: {},
  })
  const [clearTarget, setClearTarget] = useState<ClientWithStats | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [rows, prefs] = await Promise.all([listClientsWithStats(), loadFollowUpPrefs()])
      const pruned = pruneFollowUpPrefs(prefs, rows)
      if (pruned !== prefs) {
        void saveFollowUpPrefs(pruned)
      }
      setClients(rows)
      setFollowUpPrefs(pruned)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('clients.loadFailed'))
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

  const derivedMap = useMemo(() => buildDerivedMap(clients), [clients])
  const showFollowUpSection = followUpPrefs.showFollowUpSection
  const overdue = useMemo(() => {
    if (!showFollowUpSection) return []
    return overdueClients(clients).filter((c) => !isFollowUpSuppressed(c, followUpPrefs))
  }, [clients, followUpPrefs, showFollowUpSection])
  const topClients = useMemo(() => topClientsByRevenue(clients, 3), [clients])

  const segmentChips = useMemo(
    () =>
      showFollowUpSection
        ? CLIENT_SEGMENT_CHIPS
        : CLIENT_SEGMENT_CHIPS.filter((c) => c.key !== 'followup'),
    [showFollowUpSection],
  )

  const filtered = useMemo(() => {
    const searched = searchClients(clients, query)
    let segmented = filterClientsBySegment(searched, segment)
    if (segment === 'followup') {
      segmented = segmented.filter((c) => !isFollowUpSuppressed(c, followUpPrefs))
    }
    return sortClients(segmented, sort)
  }, [clients, query, segment, sort, followUpPrefs])

  const allRest = useMemo(() => {
    const topIds = new Set(topClients.map((c) => c.id))
    // When follow-up section is hidden, overdue clients stay in the main list
    const overdueIds = showFollowUpSection ? new Set(overdue.map((c) => c.id)) : new Set<string>()
    return clients
      .filter((c) => !topIds.has(c.id) && !overdueIds.has(c.id))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [clients, topClients, overdue, showFollowUpSection])

  const visibleRest = showAllRest ? allRest : allRest.slice(0, CLIENTS_VISIBLE)
  const hiddenRest = allRest.length - visibleRest.length
  const searching = query.trim().length > 0

  const persistFollowUpPrefs = useCallback(async (next: FollowUpPrefs) => {
    setFollowUpPrefs(next)
    await saveFollowUpPrefs(next)
  }, [])

  const handleSheetSnooze = useCallback(
    (days: number) => {
      if (!clearTarget) return
      const next = snoozeClientInPrefs(followUpPrefs, clearTarget.id, days)
      setClearTarget(null)
      void persistFollowUpPrefs(next)
    },
    [clearTarget, followUpPrefs, persistFollowUpPrefs],
  )

  const handleSheetDismissUntilNextJob = useCallback(() => {
    if (!clearTarget) return
    const next = dismissUntilNextJobInPrefs(followUpPrefs, clearTarget)
    setClearTarget(null)
    void persistFollowUpPrefs(next)
  }, [clearTarget, followUpPrefs, persistFollowUpPrefs])

  useEffect(() => {
    if (!showFollowUpSection && segment === 'followup') {
      setSegment('all')
    }
  }, [showFollowUpSection, segment])

  const handleExport = async () => {
    try {
      const csv = formatClientsCsv(clients)
      await shareTextExport(`clients-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv')
    } catch (e) {
      Alert.alert(t('common.export'), e instanceof Error ? e.message : 'Export failed')
    }
  }

  return (
    <OperatorScreen
      customHeader={
        <View
          style={styles.pageHeader}
          children={[
            <View
              key="left"
              style={styles.headerLeft}
              children={[
                <IconHeaderButton
                  key="import"
                  label={t('clients.import')}
                  onPress={() => router.push('/clients/import')}
                >
                  <UploadSimple size={18} color={colors.textSecondary} weight="bold" />
                </IconHeaderButton>,
                <IconHeaderButton
                  key="export"
                  label={t('clients.export')}
                  onPress={() => void handleExport()}
                >
                  <DownloadSimple size={18} color={colors.textSecondary} weight="bold" />
                </IconHeaderButton>,
                <AppText key="title" variant="h1" style={styles.pageTitle}>
                  {t('clients.title')}
                </AppText>,
              ]}
            />,
            <ModuleHeaderActions
              key="right"
              onSearchPress={toggleSearch}
              searchActive={searchActive}
              onSettingsPress={() => router.push('/(tabs)/settings')}
              settingsLabel={t('home.settings')}
            >
              <IconHeaderButton label={t('clients.add')} onPress={() => router.push('/clients/new')}>
                <Plus size={18} color={colors.textSecondary} weight="bold" />
              </IconHeaderButton>
            </ModuleHeaderActions>,
          ]}
        />
      }
    >
      {searchVisible ? (
        <SearchField
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={t('clients.searchPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        <PillGroup
          inline
          options={segmentChips.map((c) => ({ value: c.key, label: t(c.labelKey) }))}
          value={segment}
          onChange={setSegment}
        />
        <Pressable
          style={[styles.sortChip, webInlinePressableReset]}
          onPress={() => setSortOpen(true)}
          accessibilityRole="button"
        >
          <View style={styles.sortChipInner}>
            <SortAscending size={14} color={colors.textSecondary} />
            <AppText variant="caption" style={styles.sortChipLabel}>
              {(() => {
                const opt = CLIENT_SORT_OPTIONS.find((o) => o.key === sort)
                return opt ? t(opt.labelKey) : ''
              })()}
            </AppText>
          </View>
        </Pressable>
      </ScrollView>

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.sortBackdrop} onPress={() => setSortOpen(false)}>
          <View style={styles.sortSheet}>
            <AppText variant="bodySemiBold" style={styles.sortTitle}>
              {t('clients.sortBy')}
            </AppText>
            {CLIENT_SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={styles.sortOption}
                onPress={() => {
                  setSort(opt.key)
                  setSortOpen(false)
                }}
              >
                <View>
                  <AppText variant="body" style={sort === opt.key ? styles.sortActive : undefined}>
                    {t(opt.labelKey)}
                    {sort === opt.key ? ' ✓' : ''}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {loading ? (
        <ScreenLoading variant="list" />
      ) : error ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : clients.length === 0 || ((searching || segment !== 'all') && filtered.length === 0) ? (
        <EmptyState
          illustration="clients"
          title={clients.length === 0 ? t('clients.emptyTitle') : t('clients.emptyFiltered')}
          description={clients.length === 0 ? t('clients.emptyDefault') : t('clients.emptySearch')}
          actionLabel={t('clients.add')}
          onAction={() => router.push('/clients/new')}
        />
      ) : searching || segment !== 'all' ? (
        <AppFlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={refreshControl}
          renderItem={({ item, index }) => (
            <StaggeredListItem index={index}>
              <ClientCard client={item} derived={derivedMap.get(item.id)!} />
            </StaggeredListItem>
          )}
          contentContainerStyle={[styles.list, { paddingBottom: dockPadding }]}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          contentContainerStyle={[styles.list, { paddingBottom: dockPadding }]}
        >
          {showFollowUpSection && overdue.length > 0 ? (
            <View style={styles.block}>
              <AppText variant="sectionLabel">{t('clients.followUp')}</AppText>
              <View style={styles.followUpList}>
                {overdue.map((client) => (
                  <FollowUpClientCard
                    key={client.id}
                    client={client}
                    onClearPress={setClearTarget}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {topClients.length > 0 ? (
            <View style={styles.block}>
              <AppText variant="sectionLabel">{t('clients.topClients')}</AppText>
              {topClients.map((client, index) => (
                <StaggeredListItem key={client.id} index={index}>
                  <ClientCard client={client} derived={derivedMap.get(client.id)!} />
                </StaggeredListItem>
              ))}
            </View>
          ) : null}

          {allRest.length > 0 ? (
            <View style={styles.block}>
              <AppText variant="sectionLabel">{t('clients.allClients')}</AppText>
              {visibleRest.map((client, index) => (
                <StaggeredListItem key={client.id} index={index}>
                  <ClientCard client={client} derived={derivedMap.get(client.id)!} />
                </StaggeredListItem>
              ))}
              {hiddenRest > 0 ? (
                <Pressable style={styles.morePill} onPress={() => setShowAllRest(true)}>
                  <View>
                    <AppText variant="bodySemiBold" style={styles.moreLabel}>
                      {t('clients.moreClients', { count: hiddenRest })}
                    </AppText>
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      )}
      <FollowUpClearSheet
        target={clearTarget ? { id: clearTarget.id, name: clearTarget.name } : null}
        onClose={() => setClearTarget(null)}
        onSnooze={handleSheetSnooze}
        onDismissUntilNextJob={handleSheetDismissUntilNextJob}
      />
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  chipsScroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  chipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.lg,
    paddingVertical: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexShrink: 0,
    marginVertical: 2,
  },
  sortChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortChipLabel: {
    color: colors.textSecondary,
  },
  sortBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sortTitle: {
    marginBottom: spacing.xs,
  },
  sortOption: {
    paddingVertical: spacing.sm,
  },
  sortActive: {
    color: colors.greenText,
  },
  list: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  pageHeader: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    flexShrink: 1,
    minWidth: 0,
  },
  pageTitle: {
    marginLeft: spacing.xs,
    flexShrink: 1,
  },
  block: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  followUpList: {
    gap: spacing.sm,
  },
  morePill: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  moreLabel: {
    color: colors.greenText,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
})
