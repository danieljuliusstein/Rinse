import { useCallback, useMemo, useState } from 'react'
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CaretRight, FileText, Receipt } from 'phosphor-react-native'
import { Dimensions } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import { fmt } from '@rinse/core'
import type { Invoice, JobWithRelations } from '@rinse/core'
import { listJobs } from '@/src/lib/api'
import { ArSummaryCard } from '@/src/components/home/ArSummaryCard'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import { ArDonutChart } from '@/src/components/reports/ArDonutChart'
import { ReportComparisonChart } from '@/src/components/reports/ReportComparisonChart'
import { ReportRevenueByService } from '@/src/components/reports/ReportRevenueByService'
import { WaterfallChart } from '@/src/components/reports/WaterfallChart'
import { AppText, CurrencyAmount, ModuleHeaderActions, PillGroup, PrimaryButton, ScreenLoading, SearchField, SecondaryButton, type CurrencyVariant } from '@/src/components/ui'
import { computeArSummary, growthPct } from '@/src/lib/ar-metrics'
import { formatJobsReportCsv, shareReportPdf, shareTextExport } from '@/src/lib/data-export'
import { listInvoices } from '@/src/lib/invoices-api'
import { filterJobsByRange } from '@/src/lib/jobs-revenue'
import { useModuleSearch } from '@/src/hooks/useModuleSearch'
import {
  computePLReport,
  computePLReportForDates,
  getPLReportBundle,
  jobInRange,
  rangeFor,
  REPORT_FILTER_CHIPS,
  type DateRangeKey,
} from '@/src/lib/reports'
import { buildWaterfallData } from '@/src/lib/reports-metrics'
import { showError } from '@/src/lib/user-message'
import { colors, spacing } from '@/src/theme/colors'

const EXPENSE_LABELS: { key: keyof ReturnType<typeof computePLReport>['expenses']; labelKey: string }[] = [
  { key: 'supplies', labelKey: 'business.expense.supplies' },
  { key: 'travel', labelKey: 'business.expense.travel' },
  { key: 'equipment', labelKey: 'business.expense.equipment' },
  { key: 'marketing', labelKey: 'business.expense.marketing' },
  { key: 'labor', labelKey: 'business.expense.labor' },
  { key: 'overhead', labelKey: 'business.expense.overhead' },
  { key: 'business', labelKey: 'business.expense.business' },
  { key: 'other', labelKey: 'business.expense.other' },
]

function StatCard({
  label,
  value,
  variant = 'neutral',
  sub,
  unsigned,
  growth,
}: {
  label: string
  value: number
  variant?: CurrencyVariant
  sub?: string
  unsigned?: boolean
  growth?: number | null
}) {
  return (
    <View style={styles.statCard}>
      <AppText variant="sectionLabel">{label}</AppText>
      <View style={styles.statValueRow}>
        <CurrencyAmount value={value} variant={variant} size="stat" unsigned={unsigned} />
        {growth != null ? (
          <View style={[styles.growthPill, growth >= 0 ? styles.growthUp : styles.growthDown]}>
            <AppText variant="caption" style={styles.growthText}>
              {growth >= 0 ? '+' : ''}
              {growth}%
            </AppText>
          </View>
        ) : null}
      </View>
      {sub ? (
        <AppText variant="caption" style={styles.statSub}>
          {sub}
        </AppText>
      ) : null}
    </View>
  )
}

export default function ReportsScreen() {
  const { t } = useTranslation()
  const dockPadding = useTabDockPadding()
  const router = useRouter()
  const [range, setRange] = useState<DateRangeKey | 'custom'>('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [chartView, setChartView] = useState<'compare' | 'waterfall'>('compare')
  const { query, setQuery, visible: searchVisible, active: searchActive, toggle: toggleSearch, inputRef } =
    useModuleSearch()

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [rows, inv] = await Promise.all([listJobs(500), listInvoices()])
      setJobs(rows)
      setInvoices(inv)
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

  const bundle = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) {
      const start = new Date(customStart + 'T00:00:00')
      const end = new Date(customEnd + 'T23:59:59')
      const current = computePLReportForDates(jobs, start, end)
      const span = end.getTime() - start.getTime()
      const priorEnd = new Date(start.getTime() - 1)
      const priorStart = new Date(priorEnd.getTime() - span)
      const prior = computePLReportForDates(jobs, priorStart, priorEnd)
      return { current, prior }
    }
    if (range === 'custom') return getPLReportBundle(jobs, 'this_month')
    return getPLReportBundle(jobs, range)
  }, [jobs, range, customStart, customEnd])

  const report = bundle.current
  const prior = bundle.prior

  const periodJobs = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) {
      const start = new Date(customStart + 'T00:00:00')
      const end = new Date(customEnd + 'T23:59:59')
      return jobs.filter((j) => jobInRange(j, start, end))
    }
    if (range === 'custom') return filterJobsByRange(jobs, 'this_month')
    const { start, end } = rangeFor(range)
    return jobs.filter((j) => jobInRange(j, start, end))
  }, [jobs, range, customStart, customEnd])

  const rangeLabel = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) return `${customStart} – ${customEnd}`
    if (range === 'custom') return t('business.custom')
    const chip = REPORT_FILTER_CHIPS.find((c) => c.key === range)
    return chip ? t(chip.labelKey) : t('business.ranges.this_month')
  }, [range, customStart, customEnd, t])

  const arSummary = useMemo(() => computeArSummary(invoices), [invoices])
  const revenueGrowth = useMemo(() => growthPct(report.revenue, prior.revenue), [report.revenue, prior.revenue])
  const loss = report.netProfit < 0
  const expenseCategories = Object.values(report.expenses).filter((v) => v > 0).length
  const maxExpense = Math.max(...Object.values(report.expenses), 1)
  const avgJob = report.jobCount > 0 ? Math.round(report.revenue / report.jobCount) : 0
  const waterfallData = useMemo(() => buildWaterfallData(report), [report])

  const searchQ = query.trim().toLowerCase()
  const matchedExpenseLabels = useMemo(() => {
    if (!searchQ) return EXPENSE_LABELS
    return EXPENSE_LABELS.filter(({ labelKey, key }) => t(labelKey).toLowerCase().includes(searchQ) || key.includes(searchQ))
  }, [searchQ, t])

  const matchedPeriodJobs = useMemo(() => {
    if (!searchQ) return periodJobs
    return periodJobs.filter((job) => {
      const hay = [
        job.client?.name,
        job.package?.name,
        job.vehicle_type,
        job.notes,
        job.location_type,
        ...(job.expenses ?? []).map((line) => `${line.description} ${line.category}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(searchQ)
    })
  }, [periodJobs, searchQ])

  const exportFilename = useMemo(() => {
    const slug =
      range === 'custom' && customStart && customEnd
        ? `${customStart}_to_${customEnd}`
        : String(range)
    return `rinse-report-${slug}`
  }, [range, customStart, customEnd])

  const handleCsv = async () => {
    const csv = formatJobsReportCsv(periodJobs, report, rangeLabel)
    if (Platform.OS === 'web') {
      try {
        await shareTextExport(`${exportFilename}.csv`, csv, 'text/csv')
      } catch (e) {
        showError('Export', e instanceof Error ? e.message : 'CSV export failed')
      }
      return
    }

    setExporting(true)
    try {
      await shareTextExport(`${exportFilename}.csv`, csv, 'text/csv')
    } catch (e) {
      showError('Export', e instanceof Error ? e.message : 'CSV export failed')
    } finally {
      setExporting(false)
    }
  }

  const handlePdf = async () => {
    if (range === 'custom') {
      showError('PDF export', 'Choose a preset range for PDF export, or use CSV for custom dates.')
      return
    }
    setExporting(true)
    try {
      await shareReportPdf(range)
    } catch (e) {
      showError('Export', e instanceof Error ? e.message : 'PDF export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <OperatorScreen
      title={t('business.title')}
      subtitle={`${rangeLabel} · ${report.jobCount} ${report.jobCount === 1 ? 'job' : 'jobs'}`}
      headerRight={
        <ModuleHeaderActions onSearchPress={toggleSearch} searchActive={searchActive} />
      }
    >
      {searchVisible ? (
        <SearchField
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={t('business.searchPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      ) : null}
      {loading ? (
        <ScreenLoading variant="home" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />
          }
          contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <PillGroup
              options={[
                ...REPORT_FILTER_CHIPS.map((c) => ({ value: c.key, label: t(c.labelKey) })),
                { value: 'custom' as const, label: t('business.custom') },
              ]}
              value={range}
              onChange={setRange}
            />
          </ScrollView>

          {range === 'custom' ? (
            <View style={styles.customRow}>
              <TextInput
                style={styles.dateInput}
                value={customStart}
                onChangeText={setCustomStart}
                placeholder={t('business.startDate')}
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={styles.dateInput}
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder={t('business.endDate')}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ) : null}

          <View style={[styles.hero, loss ? styles.heroLoss : styles.heroProfit]}>
            <AppText variant="sectionLabel" style={styles.heroLabel}>
              {loss ? t('business.netLoss') : t('business.netProfit')}
            </AppText>
            <CurrencyAmount value={report.netProfit} variant="profit" size="hero" />
            {loss && report.revenue > 0 ? (
              <AppText variant="caption" style={styles.heroSub}>
                Expenses exceeded revenue by {(report.totalExpenses / report.revenue).toFixed(1)}x
              </AppText>
            ) : null}
          </View>

          {arSummary.openCount > 0 ? <ArSummaryCard summary={arSummary} /> : null}

          <View style={styles.statGrid}>
            <StatCard
              label={t('business.revenue')}
              value={report.revenue}
              variant="revenue"
              sub={`${report.jobCount} jobs`}
              growth={revenueGrowth}
            />
            <StatCard
              label={t('business.expenses')}
              value={report.totalExpenses}
              variant="expense"
              unsigned
              sub={`${expenseCategories} categories`}
            />
            <StatCard label={t('business.netProfit')} value={report.netProfit} variant="profit" sub={t('business.fromJobs')} />
            <StatCard label={t('business.avgJobValue')} value={avgJob} variant="neutral" sub={t('business.perJob')} />
          </View>

          {report.revenue > 0 ? (
            <View style={styles.card}>
              <ArDonutChart report={report} />
            </View>
          ) : null}

          <View style={styles.contextLinks}>
            <Pressable style={styles.contextLink} onPress={() => router.push('/(tabs)/invoices')}>
              <Receipt size={18} color={colors.textSecondary} />
              <AppText variant="bodySemiBold">{t('business.invoices')}</AppText>
              <CaretRight size={16} color={colors.textMuted} style={styles.contextCaret} />
            </Pressable>
            <Pressable style={styles.contextLink} onPress={() => router.push('/(tabs)/quotes')}>
              <FileText size={18} color={colors.textSecondary} />
              <AppText variant="bodySemiBold">{t('business.quotes')}</AppText>
              <CaretRight size={16} color={colors.textMuted} style={styles.contextCaret} />
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText variant="sectionLabel">{t('business.revenueByService')}</AppText>
            <ReportRevenueByService jobs={matchedPeriodJobs} />
          </View>

          <View style={styles.card}>
            <AppText variant="sectionLabel">{t('business.expenseBreakdown')}</AppText>
            {matchedExpenseLabels.map(({ key, labelKey }) => {
              const amount = report.expenses[key]
              if (amount <= 0) return null
              const barWidth = ((Dimensions.get('window').width - 64) * amount) / maxExpense
              return (
                <View key={key} style={styles.expenseRow}>
                  <View style={styles.expenseMeta}>
                    <AppText variant="caption">{t(labelKey)}</AppText>
                    <AppText variant="bodySemiBold">{fmt(amount)}</AppText>
                  </View>
                  <Svg width="100%" height={8}>
                    <Rect x={0} y={0} width={Math.max(8, barWidth)} height={8} fill={colors.green} rx={4} />
                  </Svg>
                </View>
              )
            })}
            {searchQ && matchedExpenseLabels.every(({ key }) => report.expenses[key] <= 0) ? (
              <AppText variant="caption" style={styles.searchEmpty}>
                {t('home.noMatch', { query: query.trim() })}
              </AppText>
            ) : null}
          </View>

          <View style={styles.card}>
            <AppText variant="sectionLabel">Revenue vs expenses</AppText>
            <View style={styles.chartToggle}>
              <Pressable
                style={[styles.chartChip, chartView === 'compare' && styles.chartChipOn]}
                onPress={() => setChartView('compare')}
              >
                <AppText variant="bodySemiBold" style={chartView === 'compare' ? styles.chartChipLabelOn : styles.chartChipLabel}>
                  Compare
                </AppText>
              </Pressable>
              <Pressable
                style={[styles.chartChip, chartView === 'waterfall' && styles.chartChipOn]}
                onPress={() => setChartView('waterfall')}
              >
                <AppText variant="bodySemiBold" style={chartView === 'waterfall' ? styles.chartChipLabelOn : styles.chartChipLabel}>
                  Waterfall
                </AppText>
              </Pressable>
            </View>
            {chartView === 'compare' ? (
              <ReportComparisonChart report={report} />
            ) : (
              <WaterfallChart data={waterfallData} />
            )}
          </View>

          <View style={styles.exportRow}>
            <PrimaryButton label={t('business.exportCsv')} loading={exporting} onPress={() => void handleCsv()} style={styles.exportBtn} />
            <SecondaryButton label={t('business.exportPdf')} loading={exporting} onPress={() => void handlePdf()} style={styles.exportBtn} />
          </View>
        </ScrollView>
      )}
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  filterScroll: {
    marginBottom: spacing.sm,
    maxHeight: 56,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  hero: {
    borderRadius: 16,
    padding: spacing.lg,
    gap: 4,
  },
  heroProfit: {
    backgroundColor: '#ecfdf5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#bbf7d0',
  },
  heroLoss: {
    backgroundColor: '#fef2f2',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fecaca',
  },
  heroLabel: {
    color: colors.textMuted,
  },
  heroValue: {
    fontSize: 36,
    lineHeight: 42,
  },
  heroSub: {
    color: colors.textMuted,
    marginTop: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
  },
  statSub: {
    color: colors.textMuted,
  },
  growthPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  growthUp: {
    backgroundColor: '#dcfce7',
  },
  growthDown: {
    backgroundColor: '#fee2e2',
  },
  growthText: {
    fontWeight: '700',
    fontSize: 11,
  },
  contextLinks: {
    gap: spacing.sm,
  },
  contextLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  contextCaret: {
    marginLeft: 'auto',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  expenseRow: {
    gap: 6,
  },
  searchEmpty: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  expenseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  exportBtn: {
    flex: 1,
  },
  chartToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chartChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartChipOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chartChipLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  chartChipLabelOn: {
    color: '#fff',
    fontSize: 14,
  },
})
