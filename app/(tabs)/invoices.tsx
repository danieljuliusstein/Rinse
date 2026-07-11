import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Receipt } from 'phosphor-react-native'
import { fmt } from '@rinse/core'
import type { Client, Invoice } from '@rinse/core'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppFlashList,
  AppText,
  CurrencyAmount,
  EmptyState,
  ListRow,
  PillGroup,
  ScreenLoading,
  SearchField,
  StaggeredListItem,
} from '@/src/components/ui'
import { listClients } from '@/src/lib/api'
import { AGING_LABELS, summarizeAging, type AgingBucket } from '@/src/lib/invoice-aging'
import { listInvoices, markInvoicePaid, markInvoiceSent } from '@/src/lib/invoices-api'
import {
  AGING_FILTER_BUCKETS,
  filterInvoices,
  filterInvoicesByAging,
  flattenInvoiceList,
  formatSectionTotal,
  INVOICE_FILTERS,
  invoiceListSubtitle,
  invoiceStatusChip,
  searchInvoices,
  type InvoiceFilterKey,
  type InvoiceListRow,
} from '@/src/lib/invoices-list'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

export default function InvoicesScreen() {
  const router = useRouter()
  const goBack = useSafeBack()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filter, setFilter] = useState<InvoiceFilterKey>('all')
  const [agingFilter, setAgingFilter] = useState<AgingBucket | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dockPadding = useTabDockPadding()

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients])
  const aging = useMemo(() => summarizeAging(invoices), [invoices])

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [invoiceRows, clientRows] = await Promise.all([listInvoices(), listClients(500)])
      setInvoices(invoiceRows)
      setClients(clientRows)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load invoices'
      setError(message)
      if (!isRefresh) Alert.alert('Invoices unavailable', message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  const filtered = useMemo(() => {
    let list = filterInvoices(invoices, filter)
    list = searchInvoices(list, search, clientMap)
    list = filterInvoicesByAging(list, agingFilter)
    return list
  }, [invoices, filter, search, clientMap, agingFilter])

  const rows = useMemo(() => flattenInvoiceList(filtered), [filtered])

  const openTotal = useMemo(
    () => invoices.filter((i) => i.status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + i.balance_due, 0),
    [invoices]
  )

  const showInvoiceActions = (inv: Invoice) => {
    const actions: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = []
    if (inv.status === 'draft') {
      actions.push({
        text: 'Mark sent',
        onPress: () => {
          void markInvoiceSent(inv.id).then(() => void load(true))
        },
      })
    }
    if (inv.status !== 'paid' && inv.balance_due > 0) {
      actions.push({
        text: 'Mark paid',
        onPress: () => {
          void markInvoicePaid(inv.id, 'cash').then(() => void load(true))
        },
      })
    }
    actions.push({ text: 'Cancel', style: 'cancel' })
    Alert.alert(inv.invoice_number, 'Invoice actions', actions)
  }

  const renderRow = (row: InvoiceListRow, index: number) => {
    if (row.kind === 'section') {
      return (
        <View key={row.key} style={styles.sectionHead}>
          <AppText variant="sectionLabel">{row.label}</AppText>
          <AppText variant="caption" style={styles.sectionMeta}>
            {fmt(row.total)}
          </AppText>
        </View>
      )
    }
    if (row.kind === 'section-total') {
      return (
        <View key={row.key} style={styles.sectionTotal}>
          <AppText variant="caption" style={styles.sectionTotalLabel}>
            Month total
          </AppText>
          <AppText variant="bodySemiBold">{formatSectionTotal(row.total, row.balanceDue)}</AppText>
        </View>
      )
    }
    const inv = row.inv
    const clientName = clientMap.get(inv.client_id)
    const chip = invoiceStatusChip(inv.status)
    return (
      <StaggeredListItem key={inv.id} index={index}>
        <ListRow
          icon={<Receipt size={18} color={iconTonePalette.green.fg} weight="duotone" />}
          iconTone="green"
          title={clientName ?? 'Client'}
          subtitle={invoiceListSubtitle(inv, undefined)}
          badgeLabel={chip.label}
          badgeTone={chip.tone}
          trailing={
            <View style={styles.trailing}>
              <CurrencyAmount value={inv.total} variant="neutral" />
              {inv.balance_due > 0 && inv.status !== 'draft' ? (
                <View style={styles.dueRow}>
                  <AppText variant="caption" style={styles.due}>
                    Due{' '}
                  </AppText>
                  <CurrencyAmount value={inv.balance_due} variant="balance" precision="detailed" style={styles.due} />
                </View>
              ) : null}
            </View>
          }
          onPress={() => router.push(`/invoices/${inv.id}`)}
          onLongPress={() => showInvoiceActions(inv)}
        />
      </StaggeredListItem>
    )
  }

  const listHeader = (
    <>
      <View style={styles.summary}>
        <AppText variant="sectionLabel">Open balance</AppText>
        <CurrencyAmount value={openTotal} variant="balance" size="stat" />
      </View>
      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Search invoices…"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <PillGroup
          options={INVOICE_FILTERS.map((f) => ({ value: f.key, label: f.label }))}
          value={filter}
          onChange={setFilter}
        />
      </ScrollView>
      {filter === 'open' || filter === 'overdue' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.agingScroll}>
          <Pressable
            style={[styles.agingChip, agingFilter === null && styles.agingChipOn]}
            onPress={() => setAgingFilter(null)}
          >
            <AppText variant="caption" style={agingFilter === null ? styles.agingChipLabelOn : styles.agingChipLabel}>
              All ages
            </AppText>
          </Pressable>
          {AGING_FILTER_BUCKETS.map((bucket) => {
            const stat = aging[bucket]
            if (stat.count === 0) return null
            const on = agingFilter === bucket
            return (
              <Pressable
                key={bucket}
                style={[styles.agingChip, on && styles.agingChipOn]}
                onPress={() => setAgingFilter(on ? null : bucket)}
              >
                <AppText variant="caption" style={on ? styles.agingChipLabelOn : styles.agingChipLabel}>
                  {AGING_LABELS[bucket]} · {stat.count}
                </AppText>
              </Pressable>
            )
          })}
        </ScrollView>
      ) : null}
    </>
  )

  return (
    <OperatorScreen
      title="Invoices"
      subtitle={`${filtered.length} shown`}
      onBack={goBack}
    >
      {loading ? (
        <ScreenLoading variant="list" />
      ) : error && invoices.length === 0 ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : filtered.length === 0 ? (
        <>
          {listHeader}
          <EmptyState
            illustration="jobs"
            title="No invoices"
            description="Create an invoice from a completed job to track payments."
          />
        </>
      ) : (
        <AppFlashList
          data={rows}
          keyExtractor={(item) => (item.kind === 'invoice' ? item.inv.id : item.key)}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />
          }
          renderItem={({ item, index }) => renderRow(item, index)}
          contentContainerStyle={[styles.list, { paddingBottom: dockPadding }]}
        />
      )}
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  filterScroll: {
    marginBottom: spacing.sm,
    maxHeight: 56,
  },
  agingScroll: {
    marginBottom: spacing.sm,
    maxHeight: 44,
  },
  agingChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    backgroundColor: colors.surface,
  },
  agingChipOn: {
    backgroundColor: iconTonePalette.green.bg,
    borderColor: colors.green,
  },
  agingChipLabel: {
    color: colors.textSecondary,
  },
  agingChipLabelOn: {
    color: colors.greenText,
  },
  list: {},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionMeta: {
    color: colors.textMuted,
  },
  sectionTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionTotalLabel: {
    color: colors.textMuted,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 72,
  },
  due: {
    color: colors.textMuted,
    fontSize: 12,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
})
