import { useCallback, useEffect, useMemo, useState } from 'react'
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { BusinessExpense, Invoice, JobWithRelations, OverheadExpense, QuoteWithRelations } from '@rinse/core'
import { listJobs } from '@/src/lib/api'
import { getOrganizationId } from '@/src/lib/org'
import { getPbUrl } from '@/src/lib/pocketbase'
import { loadSettings } from '@/src/lib/settings-store'
import {
  BusinessArStrip,
  BusinessDatePills,
  BusinessExportRow,
  BusinessNavRows,
  BusinessStatGrid,
  CashFlowCard,
  type CashFlowMode,
  ExpenseBreakdownCard,
  ProfitDonutCard,
  ProfitHero,
  RevenueByServiceCard,
} from '@/src/components/business'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import { ModuleHeaderActions, ScreenLoading, SearchField } from '@/src/components/ui'
import { computeArSummary, growthPct } from '@/src/lib/ar-metrics'
import {
  buildBusinessDaySeries,
  buildWeeklyCompareSeries,
  seriesValues,
  sparklineValues,
} from '@/src/lib/business-series'
import { listBusinessExpenses } from '@/src/lib/business-expenses-api'
import { formatJobsReportCsv, shareReportPdf, shareTextExport } from '@/src/lib/data-export'
import { overheadForDateRange, sumBusinessExpensesInRange } from '@/src/lib/expense-totals'
import { listInvoices } from '@/src/lib/invoices-api'
import { filterJobsByRange } from '@/src/lib/jobs-revenue'
import { listOverheadExpenses } from '@/src/lib/packages-api'
import { listQuotes } from '@/src/lib/quotes-api'
import { useModuleSearch } from '@/src/hooks/useModuleSearch'
import { useTabRefreshControl } from '@/src/hooks/useTabRefreshControl'
import {
  computePLReport,
  computePLReportForDates,
  getPLReportBundle,
  jobInRange,
  priorRangeFor,
  rangeFor,
  reportBoundsFor,
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

function openQuoteCount(quotes: QuoteWithRelations[]): number {
  return quotes.filter((q) => q.status === 'draft' || q.status === 'sent' || q.status === 'accepted').length
}

export default function ReportsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const dockPadding = useTabDockPadding()
  const [range, setRange] = useState<DateRangeKey | 'custom'>('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpense[]>([])
  const [overheadItems, setOverheadItems] = useState<OverheadExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const refreshControl = useTabRefreshControl(refreshing, () => {
    void load(true)
  })
  const [exporting, setExporting] = useState(false)
  const [chartView, setChartView] = useState<CashFlowMode>('compare')
  const { query, setQuery, visible: searchVisible, active: searchActive, toggle: toggleSearch, inputRef } =
    useModuleSearch()

  // #region agent log
  fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'pl-check',hypothesisId:'PL2',location:'reports.tsx:ReportsScreen',message:'Business reports render',data:{range,chartView,loading},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [rows, inv, quoteRows, biz, overhead] = await Promise.all([
        listJobs(500),
        listInvoices(),
        listQuotes(),
        listBusinessExpenses(),
        listOverheadExpenses(),
      ])
      setJobs(rows)
      setInvoices(inv)
      setQuotes(quoteRows)
      setBusinessExpenses(biz)
      setOverheadItems(overhead)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const activeRange = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) {
      return {
        start: new Date(customStart + 'T00:00:00'),
        end: new Date(customEnd + 'T23:59:59'),
      }
    }
    if (range === 'custom') return rangeFor('this_month')
    return reportBoundsFor(range, jobs, businessExpenses)
  }, [range, customStart, customEnd, jobs, businessExpenses])

  const bundle = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) {
      const { start, end } = activeRange
      const overhead = overheadForDateRange(overheadItems, start, end)
      const business = sumBusinessExpensesInRange(businessExpenses, start, end)
      const current = computePLReportForDates(jobs, start, end, overhead, business)
      const span = end.getTime() - start.getTime()
      const priorEnd = new Date(start.getTime() - 1)
      const priorStart = new Date(priorEnd.getTime() - span)
      const priorOverhead = overheadForDateRange(overheadItems, priorStart, priorEnd)
      const priorBusiness = sumBusinessExpensesInRange(businessExpenses, priorStart, priorEnd)
      const prior = computePLReportForDates(jobs, priorStart, priorEnd, priorOverhead, priorBusiness)
      return { current, prior }
    }
    if (range === 'custom') {
      const { start, end } = rangeFor('this_month')
      const prior = priorRangeFor('this_month')
      return getPLReportBundle(
        jobs,
        'this_month',
        overheadForDateRange(overheadItems, start, end),
        sumBusinessExpensesInRange(businessExpenses, start, end),
        overheadForDateRange(overheadItems, prior.start, prior.end),
        sumBusinessExpensesInRange(businessExpenses, prior.start, prior.end),
      )
    }
    const { start, end } = reportBoundsFor(range, jobs, businessExpenses)
    const prior = priorRangeFor(range)
    // Lifetime: use activity-clamped bounds so overhead matches job window.
    if (range === 'lifetime') {
      const overhead = overheadForDateRange(overheadItems, start, end)
      const business = sumBusinessExpensesInRange(businessExpenses, start, end)
      const current = computePLReportForDates(jobs, start, end, overhead, business)
      const priorOverhead = overheadForDateRange(overheadItems, prior.start, prior.end)
      const priorBusiness = sumBusinessExpensesInRange(businessExpenses, prior.start, prior.end)
      const priorReport = computePLReportForDates(
        jobs,
        prior.start,
        prior.end,
        priorOverhead,
        priorBusiness,
      )
      return { current, prior: priorReport }
    }
    return getPLReportBundle(
      jobs,
      range,
      overheadForDateRange(overheadItems, start, end),
      sumBusinessExpensesInRange(businessExpenses, start, end),
      overheadForDateRange(overheadItems, prior.start, prior.end),
      sumBusinessExpensesInRange(businessExpenses, prior.start, prior.end),
    )
  }, [jobs, range, customStart, customEnd, businessExpenses, overheadItems, activeRange])

  const report = bundle.current
  const prior = bundle.prior

  // #region agent log
  useMemo(() => {
    if (loading || jobs.length === 0 && overheadItems.length === 0) {
      fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'pb-compare',hypothesisId:'DATA1',location:'reports.tsx:jobAudit',message:'jobs empty or still loading',data:{loading,jobCount:jobs.length,overheadCount:overheadItems.length,bizExpCount:businessExpenses.length},timestamp:Date.now()})}).catch(()=>{});
      return null
    }
    const dates = jobs.map((j) => j.date).sort()
    const ranges: Array<'this_month' | 'last_month' | 'this_year' | 'lifetime'> = [
      'this_month',
      'last_month',
      'this_year',
      'lifetime',
    ]
    const byRange = ranges.map((key) => {
      const { start, end } = reportBoundsFor(key, jobs, businessExpenses)
      const oh = overheadForDateRange(overheadItems, start, end)
      const biz = sumBusinessExpensesInRange(businessExpenses, start, end)
      const withOh = computePLReportForDates(jobs, start, end, oh, biz)
      const jobsOnly = computePLReportForDates(jobs, start, end, 0, 0)
      return {
        key,
        jobsInRange: withOh.jobCount,
        revenue: withOh.revenue,
        netWithOverhead: withOh.netProfit,
        netJobsOnly: jobsOnly.netProfit,
        overhead: oh,
        business: biz,
        startIso: start.toISOString(),
      }
    })
    fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'post-fix',hypothesisId:'DATA1',location:'reports.tsx:jobAudit',message:'PL across ranges after date+lifetime fix',data:{loadedJobs:jobs.length,dateMin:dates[0]??null,dateMax:dates[dates.length-1]??null,sampleDates:dates.slice(0,8),byRange,uiRange:range,uiNet:report.netProfit,uiRevenue:report.revenue,uiJobs:report.jobCount},timestamp:Date.now()})}).catch(()=>{});
    return null
  }, [loading, jobs, overheadItems, businessExpenses, range, report.netProfit, report.revenue, report.jobCount])
  // #endregion

  const periodJobs = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) {
      return jobs.filter((j) => jobInRange(j, activeRange.start, activeRange.end))
    }
    if (range === 'custom') return filterJobsByRange(jobs, 'this_month')
    return jobs.filter((j) => jobInRange(j, activeRange.start, activeRange.end))
  }, [jobs, range, customStart, customEnd, activeRange])

  const rangeLabel = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) return `${customStart} – ${customEnd}`
    if (range === 'custom') return t('business.custom')
    const chip = REPORT_FILTER_CHIPS.find((c) => c.key === range)
    return chip ? t(chip.labelKey) : t('business.ranges.this_month')
  }, [range, customStart, customEnd, t])

  const daySeries = useMemo(
    () =>
      buildBusinessDaySeries(
        periodJobs,
        businessExpenses,
        overheadItems,
        activeRange.start,
        activeRange.end,
      ),
    [periodJobs, businessExpenses, overheadItems, activeRange],
  )

  const compareSeries = useMemo(() => buildWeeklyCompareSeries(daySeries), [daySeries])
  const netSpark = useMemo(() => sparklineValues(seriesValues(daySeries, 'net')), [daySeries])

  const arSummary = useMemo(() => computeArSummary(invoices), [invoices])
  const revenueGrowth = useMemo(() => growthPct(report.revenue, prior.revenue), [report.revenue, prior.revenue])
  const netGrowth = useMemo(() => growthPct(report.netProfit, prior.netProfit), [report.netProfit, prior.netProfit])
  const avgJob = report.jobCount > 0 ? Math.round(report.revenue / report.jobCount) : 0
  const waterfallData = useMemo(() => buildWaterfallData(report), [report])
  const quotesOpen = useMemo(() => openQuoteCount(quotes), [quotes])

  // #region agent log
  useEffect(() => {
    if (loading) return
    const deskLikeUnpaid = invoices
      .filter(
        (i) =>
          i.status === 'sent' ||
          i.status === 'overdue' ||
          (i.balance_due > 0 && i.status !== 'paid'),
      )
      .reduce((s, i) => s + Math.max(i.balance_due, i.total - (i.amount_paid ?? 0)), 0)
    void loadSettings().then((settings) => {
      const origin =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : 'http://127.0.0.1:8081'
      fetch(`${origin}/__agent-debug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
        body: JSON.stringify({
          sessionId: '89a058',
          runId: 'money-parity-1',
          hypothesisId: 'A_B_F',
          location: 'reports.tsx:Business tab',
          message: 'Mobile Business tab money snapshot',
          data: {
            surface: 'mobile_business',
            pbHost: getPbUrl().replace(/^https?:\/\//, '').split('/')[0] ?? '',
            orgIdSuffix: (getOrganizationId() ?? '').slice(-6),
            range,
            jobCountLoaded: jobs.length,
            invoiceCountLoaded: invoices.length,
            expenseCountLoaded: businessExpenses.length,
            plRevenue: report.revenue,
            plExpenses: report.totalExpenses,
            plNet: report.netProfit,
            plJobCount: report.jobCount,
            arUnpaidMobile: arSummary.unpaid,
            arCollectedThisMonth: arSummary.collectedThisMonth,
            arOpenCount: arSummary.openCount,
            deskLikeUnpaidAr: deskLikeUnpaid,
            businessAddressLen: settings.business_address?.trim()?.length ?? 0,
            businessName: settings.business_name?.trim()?.slice(0, 40) ?? '',
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
    })
  }, [
    loading,
    range,
    jobs.length,
    invoices,
    businessExpenses.length,
    report.revenue,
    report.totalExpenses,
    report.netProfit,
    report.jobCount,
    arSummary,
  ])
  // #endregion

  const searchQ = query.trim().toLowerCase()
  const matchedExpenseLabels = useMemo(() => {
    if (!searchQ) return EXPENSE_LABELS
    return EXPENSE_LABELS.filter(
      ({ labelKey, key }) => t(labelKey).toLowerCase().includes(searchQ) || key.includes(searchQ),
    )
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

  const expenseItems = useMemo(
    () =>
      matchedExpenseLabels.map(({ key, labelKey }) => ({
        id: key,
        label: t(labelKey),
        value: report.expenses[key],
      })),
    [matchedExpenseLabels, report.expenses, t],
  )

  const stats = useMemo(
    () => [
      {
        id: 'revenue',
        label: t('business.revenue'),
        value: report.revenue,
        growth: revenueGrowth,
        trend: sparklineValues(seriesValues(daySeries, 'revenue')),
      },
      {
        id: 'expenses',
        label: t('business.expenses'),
        value: report.totalExpenses,
        unsigned: true,
        trend: sparklineValues(seriesValues(daySeries, 'expenses')),
      },
      {
        id: 'net',
        label: t('business.netProfit'),
        value: report.netProfit,
        trend: sparklineValues(seriesValues(daySeries, 'net')),
      },
      {
        id: 'avg',
        label: t('business.avgJobValue'),
        value: avgJob,
        trend: sparklineValues(seriesValues(daySeries, 'avg')),
      },
    ],
    [t, report.revenue, report.totalExpenses, report.netProfit, avgJob, revenueGrowth, daySeries],
  )

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

  const heroCaption =
    report.jobCount > 0
      ? `Job revenue minus expenses · ${rangeLabel.toLowerCase()}`
      : `No jobs in ${rangeLabel.toLowerCase()}`

  // #region agent log
  fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'pl-check',hypothesisId:'PL2',location:'reports.tsx:beforeHero',message:'PL bundle numbers for hero',data:{range,rangeLabel,jobCount:report.jobCount,revenue:report.revenue,totalExpenses:report.totalExpenses,netProfit:report.netProfit,marginPct:report.marginPct,priorNet:prior.netProfit,netGrowth,overhead:report.expenses.overhead,businessExp:report.expenses.business,arUnpaid:arSummary.unpaid,arOpen:arSummary.openCount,invoicesTotal:invoices.length,loading},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <OperatorScreen
      title={t('business.title')}
      subtitle={`${rangeLabel} · ${report.jobCount} ${report.jobCount === 1 ? 'job' : 'jobs'}`}
      headerRight={
        <ModuleHeaderActions
          onSearchPress={toggleSearch}
          searchActive={searchActive}
          onSettingsPress={() => router.push('/(tabs)/settings')}
          settingsLabel={t('home.settings')}
        />
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
          refreshControl={refreshControl}
          contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
        >
          <BusinessDatePills
            options={[
              ...REPORT_FILTER_CHIPS.map((c) => ({ value: c.key as DateRangeKey | 'custom', label: t(c.labelKey) })),
              { value: 'custom' as const, label: t('business.custom') },
            ]}
            value={range}
            onChange={setRange}
          />

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

          <ProfitHero
            netProfit={report.netProfit}
            growthPct={netGrowth}
            sparkline={netSpark}
            caption={heroCaption}
          />

          <BusinessArStrip openCount={arSummary.openCount} unpaid={arSummary.unpaid} />

          <BusinessStatGrid stats={stats} />

          <ProfitDonutCard
            revenue={report.revenue}
            expenses={report.totalExpenses}
            marginPct={report.marginPct}
          />

          <BusinessNavRows
            invoicesIssued={invoices.length}
            unpaidCount={arSummary.openCount}
            invoicesSubtitle={`${invoices.length} issued`}
            openQuotes={quotesOpen}
            quotesSubtitle={`${quotesOpen} open`}
          />

          <RevenueByServiceCard jobs={matchedPeriodJobs} />

          <ExpenseBreakdownCard
            items={expenseItems}
            emptySearch={Boolean(searchQ)}
            searchQuery={query.trim()}
          />

          <CashFlowCard
            mode={chartView}
            onModeChange={setChartView}
            compareSeries={compareSeries}
            waterfall={waterfallData}
          />

          <BusinessExportRow
            exporting={exporting}
            onExportCsv={() => void handleCsv()}
            onExportPdf={() => void handlePdf()}
          />
        </ScrollView>
      )}
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.sm + 4,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
})
