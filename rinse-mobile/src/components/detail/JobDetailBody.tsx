import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ClipboardText,
  Calendar,
  Clock,
  FileText,
  GearSix,
  Image as ImageIcon,
  MapPin,
  NavigationArrow,
  PaperPlaneTilt,
  Wallet,
} from '@/src/icons'
import {
  countJobPhotosByType,
  jobExpensesForDisplay,
  jobHasBeforeAndAfter,
  jobHasPreJobInspection,
  jobPhotoCompletenessMessage,
  mapJobStatusForDisplay,
  marginPct,
  netProfit,
  requiresPreJobInspection,
} from '@rinse/core'
import type { Invoice, JobPhoto, JobWithRelations } from '@rinse/core'
import { completeJob, deleteJob, getJob, openMaps, openSms, updateJob } from '@/src/lib/api'
import { formatStartTimeLabel } from '@/src/lib/home-dashboard'
import { composeSmsFromTemplate, sendSmsTemplate } from '@/src/lib/messages-api'
import { loadSettings } from '@/src/lib/settings-store'
import { resolveSuppliesUsed } from '@/src/lib/supplies-logic'
import { checkRecordConflict, refreshRecordFromServer } from '@/src/lib/conflict'
import { createInvoiceForJob, getInvoiceByJobId, getJobPhotos } from '@/src/lib/invoices-api'
import { invoiceStatusChip } from '@/src/lib/invoices-list'
import { formatJobDate } from '@/src/lib/format-dates'
import { formatNextServiceLabel, suggestNextServiceDate } from '@/src/lib/next-service'
import { requireOrganizationId } from '@/src/lib/org'
import { checkPremiumGate } from '@/src/lib/subscription'
import { createPortalLink, shareInvoicePdf, shareTransformationPdf } from '@/src/lib/share'
import { ShareLinkActions } from '@/src/components/portal/ShareLinkActions'
import { JobTimer } from '@/src/components/jobs/JobTimer'
import { ConflictBanner } from '@/src/components/ConflictBanner'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { AppText } from '@/src/components/ui/AppText'
import { useTabDockPadding } from '@/src/hooks/useTabDockPadding'
import { Badge } from '@/src/components/ui/Badge'
import { CurrencyAmount } from '@/src/components/ui/CurrencyAmount'
import { AccordionSection } from '@/src/components/ui/AccordionSection'
import { DetailRow } from '@/src/components/ui/DetailRow'
import { TextActionRow } from '@/src/components/ui/TextActionRow'
import { JobStatusPanel } from '@/src/components/detail/JobStatusPanel'
import { useJobTimer } from '@/src/hooks/useJobTimer'
import {
  jobDetailPriority,
  paymentsAccordionHint,
  photosAccordionHint,
  type JobDetailSection,
} from '@/src/lib/job-detail-priority'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui/Button'
import { SharePayLinkSheet } from '@/src/components/invoice/SharePayLinkSheet'
import { CollectDepositSheet } from '@/src/components/jobs/CollectDepositSheet'
import { CancelJobPolicySheet } from '@/src/components/jobs/CancelJobPolicySheet'
import { depositBadgeLabel, depositBadgeTone, computeDepositDue } from '@/src/lib/deposits'
import {
  DEFAULT_BUSINESS_POLICIES,
  DEFAULT_TIP_PREFS,
  normalizeBusinessPolicies,
  normalizeTipPrefs,
  normalizeTechRoster,
} from '@/src/lib/wave5-prefs'
import type { BusinessPolicies, TipPrefs, TechRosterEntry } from '@rinse/core'
import { colors, spacing } from '@/src/theme/colors'
import { listEntityEvents, type EntityEvent } from '@/src/lib/entity-events'
import { navigateAfterClose } from '@/src/lib/navigate-after-close'

function JobHistorySection({ jobId }: { jobId: string }) {
  const [events, setEvents] = useState<EntityEvent[]>([])
  useEffect(() => {
    void listEntityEvents('job', jobId).then(setEvents)
  }, [jobId])
  if (events.length === 0) return null
  return (
    <View style={styles.section}>
      <AppText variant="sectionLabel">History</AppText>
      {events.slice(0, 8).map((event) => (
        <AppText key={event.id} variant="caption" style={styles.muted}>
          {event.action} · {new Date(event.occurred_at).toLocaleString()}
        </AppText>
      ))}
    </View>
  )
}

interface JobDetailBodyProps {
  jobId: string
  onClose?: () => void
  variant?: 'screen' | 'overlay'
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function statusBadgeTone(status: string): 'green' | 'blue' | 'amber' | 'red' | 'gray' {
  if (status === 'overdue') return 'red'
  if (status === 'paid' || status === 'completed') return 'green'
  if (status === 'invoiced') return 'amber'
  if (status === 'scheduled' || status === 'in_progress') return 'blue'
  return 'gray'
}

export function JobDetailBody({ jobId, onClose, variant = 'screen' }: JobDetailBodyProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const dockPadding = useTabDockPadding(variant === 'screen')
  const [job, setJob] = useState<JobWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasConflict, setHasConflict] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [trackSupplies, setTrackSupplies] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [policies, setPolicies] = useState<BusinessPolicies>(DEFAULT_BUSINESS_POLICIES)
  const [tipPrefs, setTipPrefs] = useState<TipPrefs>({
    ...DEFAULT_TIP_PREFS,
    presets: [...DEFAULT_TIP_PREFS.presets],
  })
  const [techRoster, setTechRoster] = useState<TechRosterEntry[]>([])
  const [depositOpen, setDepositOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [depositBusy, setDepositBusy] = useState(false)
  const [sharePayOpen, setSharePayOpen] = useState(false)
  const [openSection, setOpenSection] = useState<JobDetailSection | null>(null)
  const jobRef = useRef<JobWithRelations | null>(null)

  const navigateAway = useCallback(
    (href: string) => {
      navigateAfterClose(onClose, () => router.push(href as never))
    },
    [onClose, router],
  )

  const handleTimerStop = useCallback(
    async (hours: number) => {
      const current = jobRef.current
      if (!current) return
      const nextStatus = current.status === 'scheduled' ? 'in_progress' : current.status
      if (requiresPreJobInspection(current.status, nextStatus) && !jobHasPreJobInspection(current)) {
        Alert.alert(
          'Walkthrough required',
          'Complete the pre-job liability walkthrough before starting this job.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open walkthrough',
              onPress: () => {
                navigateAway(`/jobs/${jobId}/inspection`)
              },
            },
          ],
        )
        return
      }
      const updated = await updateJob(jobId, {
        date: current.date,
        packageId: current.package_id,
        vehicleType: current.vehicle_type,
        locationType: current.location_type,
        revenue: current.revenue,
        tip: current.tip,
        hours_worked: Math.round(hours * 100) / 100,
        start_time: current.start_time,
        status: nextStatus,
        notes: current.notes,
      })
      setJob(updated)
    },
    [jobId, navigateAway],
  )

  const timer = useJobTimer(jobId, (hours) => void handleTimerStop(hours))

  useEffect(() => {
    if (!job) return
    const next = jobDetailPriority(job, {
      hasInvoice: Boolean(invoice),
      timerRunning: timer.running,
    })
    setOpenSection(next.expandedSection)
  }, [job, invoice, timer.running])

  const load = useCallback(async () => {
    setError(null)
    const row = await getJob(jobId)
    setJob(row)
    if (row?.invoice_id || row?.invoice) {
      setInvoice(row.invoice ?? (await getInvoiceByJobId(jobId)))
    } else {
      setInvoice(null)
    }
    try {
      setPhotos(await getJobPhotos(jobId))
    } catch {
      setPhotos([])
    }
    const conflict = await checkRecordConflict('jobs', jobId)
    setHasConflict(conflict.hasConflict)
  }, [jobId])

  useEffect(() => {
    let cancelled = false
    void load()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load job')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    void loadSettings().then((s) => {
      setTrackSupplies(s.track_job_supplies === true)
      setPolicies(normalizeBusinessPolicies(s.business_policies))
      setTipPrefs(normalizeTipPrefs(s.tip_prefs))
      setTechRoster(normalizeTechRoster(s.tech_roster))
    })
  }, [])

  const handleRefreshFromServer = async () => {
    setRefreshing(true)
    try {
      const orgId = requireOrganizationId()
      await refreshRecordFromServer('jobs', jobId, orgId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) return <LoadingState label={t('jobDetail.loading')} />

  if (error || !job) {
    return (
      <View style={styles.errorWrap}>
        <AppText variant="body" style={styles.error}>
          {error ?? 'Job not found'}
        </AppText>
      </View>
    )
  }

  jobRef.current = job

  const priority = jobDetailPriority(job, {
    hasInvoice: Boolean(invoice),
    timerRunning: timer.running,
  })

  const toggleSection = (section: JobDetailSection) => {
    setOpenSection((current) => (current === section ? null : section))
  }

  const status = mapJobStatusForDisplay(job)
  const profit = netProfit(job)
  const margin = marginPct(job)
  const expenses = jobExpensesForDisplay(job)
  const invoiceChip = invoice ? invoiceStatusChip(invoice.status) : null
  const isUpcoming = job.status === 'scheduled' || job.status === 'in_progress'
  const dateLabel = formatJobDate(job.date)
  const depositTone = depositBadgeTone(job.deposit_status)
  const depositLabel = depositBadgeLabel(job.deposit_status)
  const depositDueAmount =
    job.deposit_amount != null && job.deposit_amount > 0
      ? job.deposit_amount
      : computeDepositDue(policies, job.revenue)
  const techName = job.assignee_id
    ? techRoster.find((t) => t.id === job.assignee_id)?.name ?? 'Assigned'
    : 'You'
  const photoCounts = countJobPhotosByType(photos)
  const timeLabel = [
    formatStartTimeLabel(job.start_time),
    job.hours_worked > 0 ? `${job.hours_worked}h` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const vehicleLine = capitalize(job.vehicle_type)
  const showNextService =
    (job.status === 'completed' || job.status === 'paid' || job.status === 'invoiced') &&
    Boolean(job.package && job.client)
  const returnDays = job.package?.expected_return_days ?? 90
  const nextServiceDate = showNextService ? suggestNextServiceDate(job.date, returnDays) : null

  const handleCreateInvoice = async () => {
    setCreatingInvoice(true)
    try {
      const gate = await checkPremiumGate('create_invoice')
      if (!gate.allowed) return
      const created = await createInvoiceForJob(jobId)
      setInvoice(created)
      router.push(`/invoices/${created.id}`)
    } catch (e) {
      Alert.alert('Invoice', e instanceof Error ? e.message : 'Could not create invoice')
    } finally {
      setCreatingInvoice(false)
    }
  }

  const handleComplete = async (suppliesUsed?: JobWithRelations['supplies_used']) => {
    setCompleting(true)
    try {
      const updated = await completeJob(jobId, suppliesUsed)
      setJob(updated)
      Alert.alert(t('jobDetail.jobCompleteTitle'), t('jobDetail.jobCompleteBody'))
    } catch (e) {
      Alert.alert('Complete', e instanceof Error ? e.message : 'Could not mark complete')
    } finally {
      setCompleting(false)
    }
  }

  const promptComplete = () => {
    if (!job) return
    if (!trackSupplies) {
      void handleComplete()
      return
    }
    const usage = resolveSuppliesUsed(job, job.package)
    if (usage.length === 0) {
      void handleComplete()
      return
    }
    Alert.alert(
      'Log supplies used?',
      `Confirm ${usage.length} supply line${usage.length === 1 ? '' : 's'} before marking complete.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm & complete', onPress: () => void handleComplete(usage) },
      ]
    )
  }

  const handleTextClient = async () => {
    if (!job?.client?.phone) return
    const body = await composeSmsFromTemplate('appointment_reminder', {
      name: job.client.name,
      packageName: job.package?.name,
      time: formatStartTimeLabel(job.start_time) ?? '',
      date: formatJobDate(job.date),
    })
    void Linking.openURL(openSms(job.client.phone, body))
  }

  const handleOnMyWay = async () => {
    if (!job?.client?.phone) {
      Alert.alert(t('jobDetail.noPhoneTitle'), t('jobDetail.noPhoneBody'))
      return
    }
    try {
      const result = await sendSmsTemplate({
        templateId: 'on_my_way',
        clientId: job.client_id,
        jobId: job.id,
        force: true,
      })
      if (result.dryRun) {
        Alert.alert(
          'On my way (dry run)',
          'Twilio is not configured yet — message was logged. Set TWILIO_* on the API to deliver for real.',
        )
        return
      }
      Alert.alert(t('jobDetail.sentTitle'), t('jobDetail.onMyWaySent'))
    } catch (e) {
      Alert.alert('SMS', e instanceof Error ? e.message : 'Could not send')
    }
  }

  const handleCancel = () => {
    setCancelOpen(true)
  }

  const confirmCancelJob = () => {
    setCancelling(true)
    void deleteJob(jobId).then((result) => {
      setCancelling(false)
      setCancelOpen(false)
      if (result.ok) {
        onClose?.()
        if (variant === 'screen') router.replace('/(tabs)/jobs')
      } else {
        Alert.alert(t('common.cancel'), result.error ?? 'Could not cancel job')
      }
    })
  }

  const patchDeposit = async (patch: {
    deposit_status: NonNullable<JobWithRelations['deposit_status']>
    deposit_amount?: number
    deposit_paid_at?: string
  }) => {
    setDepositBusy(true)
    try {
      const updated = await updateJob(jobId, {
        date: job!.date,
        packageId: job!.package_id,
        vehicleType: job!.vehicle_type,
        locationType: job!.location_type,
        revenue: job!.revenue,
        tip: job!.tip,
        hours_worked: job!.hours_worked,
        start_time: job!.start_time,
        status: job!.status,
        notes: job!.notes,
        ...patch,
      })
      setJob(updated)
      setDepositOpen(false)
    } catch (e) {
      Alert.alert('Deposit', e instanceof Error ? e.message : 'Could not update deposit')
    } finally {
      setDepositBusy(false)
    }
  }

  const handleSharePdf = async () => {
    if (!invoice) return
    try {
      let portalUrl: string | undefined
      try {
        const link = await createPortalLink({
          clientId: job.client_id,
          scope: 'invoice',
          jobId: job.id,
        })
        portalUrl = link.url
      } catch {
        // optional
      }
      const gate = await checkPremiumGate('export_pdf')
      if (!gate.allowed) return
      await shareInvoicePdf(job.id, invoice, portalUrl)
    } catch (e) {
      Alert.alert('PDF', e instanceof Error ? e.message : 'Export failed')
    }
  }

  const handleShareTransformation = async () => {
    if (!jobHasBeforeAndAfter(photos)) {
      Alert.alert('Before & after required', jobPhotoCompletenessMessage(countJobPhotosByType(photos)), [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add photos',
          onPress: () => {
            navigateAway(`/(tabs)/jobs/${jobId}/photos`)
          },
        },
      ])
      return
    }
    try {
      const gate = await checkPremiumGate('export_pdf')
      if (!gate.allowed) return
      await shareTransformationPdf(jobId)
    } catch (e) {
      Alert.alert('PDF', e instanceof Error ? e.message : 'Export failed')
    }
  }

  const contentPadding = variant === 'overlay' ? spacing.md : 0
  const bottomPad = variant === 'screen' ? dockPadding : spacing.xl
  const statusEyebrow = [dateLabel, timeLabel].filter(Boolean).join(' · ').toUpperCase()

  const handlePrimaryAction = () => {
    switch (priority.primaryAction) {
      case 'on_my_way':
        void handleOnMyWay()
        break
      case 'timer_toggle':
        timer.toggle()
        break
      case 'create_invoice':
        void handleCreateInvoice()
        break
      case 'open_invoice':
        if (invoice) {
          navigateAway(`/invoices/${invoice.id}`)
        }
        break
      case 'share_pay_link':
        setSharePayOpen(true)
        break
      default:
        break
    }
  }

  const openPhotos = () => {
    navigateAway(`/(tabs)/jobs/${jobId}/photos`)
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingHorizontal: contentPadding, paddingBottom: bottomPad },
      ]}
    >
      {variant === 'overlay' ? (
        <View style={styles.overlayHeader}>
          <View style={styles.overlayTitleBlock}>
            <AppText variant="h1">{job.client?.name ?? t('jobDetail.titleFallback')}</AppText>
            <AppText variant="caption" style={styles.muted}>
              {dateLabel}
            </AppText>
          </View>
          <Badge tone={statusBadgeTone(status)} label={status.replace('_', ' ')} />
        </View>
      ) : null}

      {hasConflict ? (
        <ConflictBanner onRefresh={() => void handleRefreshFromServer()} refreshing={refreshing} />
      ) : null}

      <JobStatusPanel
        eyebrow={statusEyebrow}
        heading={priority.guidanceHeading}
        statusTone={statusBadgeTone(status)}
      />

      <View style={styles.card}>
        <AppText variant="caption" style={styles.kvLabel}>
          VEHICLE
        </AppText>
        <AppText variant="bodySemiBold">{vehicleLine}</AppText>
        {job.location_type === 'mobile' && job.client?.address ? (
          <AppText variant="caption" style={styles.muted}>
            {job.client.address}
          </AppText>
        ) : (
          <AppText variant="caption" style={styles.muted}>
            {capitalize(job.location_type)}
          </AppText>
        )}
      </View>

      <View style={[styles.card, styles.serviceCard]}>
        <DetailRow label="Service" value={job.package?.name ?? '—'} />
        <DetailRow label="Time" value={timeLabel || dateLabel} />
        <DetailRow label="Technician" value={techName} chip />
        <DetailRow
          label="Status"
          value={status.replace('_', ' ')}
          badge
          badgeTone={statusBadgeTone(status)}
          isLast
        />
      </View>

      {priority.hideActions ? (
        <View style={styles.cancelledNote}>
          <AppText variant="body" style={styles.muted}>
            Actions unavailable — job cancelled.
          </AppText>
        </View>
      ) : (
        <>
          {priority.primaryLabel && priority.primaryAction ? (
            <PrimaryButton
              label={
                priority.primaryAction === 'create_invoice' && creatingInvoice
                  ? t('jobDetail.creating')
                  : priority.primaryLabel
              }
              loading={priority.primaryAction === 'create_invoice' && creatingInvoice}
              onPress={handlePrimaryAction}
            />
          ) : null}

          <AccordionSection
            title="Job Progress"
            hint={job.status === 'in_progress' ? 'Live' : `$${(job.revenue + job.tip).toFixed(0)} revenue`}
            icon={<Clock size={19} color={colors.greenText} weight="duotone" />}
            expanded={openSection === 'progress'}
            onToggle={() => toggleSection('progress')}
          >
            <JobTimer jobId={job.id} embedded onStopped={(hours) => void handleTimerStop(hours)} />
            <View style={styles.metricGrid}>
              <View style={styles.metricCell}>
                <AppText variant="caption" style={styles.metricLabel}>
                  {t('common.revenue')}
                </AppText>
                <CurrencyAmount value={job.revenue + job.tip} variant="revenue" />
              </View>
              <View style={[styles.metricCell, styles.metricDivider]}>
                <AppText variant="caption" style={styles.metricLabel}>
                  {t('jobDetail.netProfit')}
                </AppText>
                <CurrencyAmount value={profit} variant="profit" />
              </View>
              <View style={[styles.metricCell, styles.metricDivider]}>
                <AppText variant="caption" style={styles.metricLabel}>
                  Margin
                </AppText>
                <AppText variant="bodySemiBold" style={styles.metricValue}>
                  {margin}%
                </AppText>
              </View>
            </View>
            {isUpcoming ? (
              <SecondaryButton
                label={completing ? t('jobDetail.markingComplete') : t('jobDetail.markComplete')}
                loading={completing}
                onPress={() => promptComplete()}
              />
            ) : null}
            {(job.status === 'scheduled' || job.status === 'in_progress') && (
              <>
                <AppText variant="caption" style={styles.muted}>
                  {jobHasPreJobInspection(job)
                    ? 'Walkthrough completed'
                    : 'Walkthrough required before In progress'}
                </AppText>
                <TextActionRow
                  label={
                    jobHasPreJobInspection(job)
                      ? t('jobDetail.viewWalkthrough')
                      : t('jobDetail.startWalkthrough')
                  }
                  icon={<ClipboardText size={17} color={colors.greenText} weight="duotone" />}
                  onPress={() => {
                    navigateAway(`/jobs/${job.id}/inspection`)
                  }}
                />
              </>
            )}
            {expenses.length > 0 ? (
              <View style={styles.expenseList}>
                <AppText variant="sectionLabel">{t('common.expenses')}</AppText>
                {expenses.map((e, i) => (
                  <View key={`${e.category}-${i}`} style={styles.expenseRow}>
                    <AppText variant="body">{e.description || e.category}</AppText>
                    <CurrencyAmount value={e.amount} variant="expense" unsigned />
                  </View>
                ))}
              </View>
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="Payments"
            hint={paymentsAccordionHint(job, depositDueAmount)}
            icon={<Wallet size={19} color={colors.greenText} weight="duotone" />}
            expanded={openSection === 'payments'}
            onToggle={() => toggleSection('payments')}
          >
            <View style={styles.depositSummary}>
              <View>
                <AppText variant="sectionLabel">DEPOSIT</AppText>
                <AppText variant="bodySemiBold">
                  ${(job.deposit_amount ?? depositDueAmount).toFixed(2)}
                </AppText>
                <AppText variant="caption" style={styles.muted}>
                  {job.deposit_status === 'paid'
                    ? 'Collected'
                    : job.deposit_status === 'waived'
                      ? 'Waived'
                      : 'Due at booking'}
                </AppText>
              </View>
              {depositTone && depositLabel ? <Badge tone={depositTone} label={depositLabel} /> : null}
            </View>
            {(job.deposit_status === 'due' || (!job.deposit_status && depositDueAmount > 0)) && (
              <SecondaryButton label="Collect deposit" onPress={() => setDepositOpen(true)} />
            )}
            {job.client ? (
              <TextActionRow
                label="Share pay link / tip"
                icon={<PaperPlaneTilt size={16} color={colors.greenText} weight="duotone" />}
                onPress={() => setSharePayOpen(true)}
              />
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="Photos"
            hint={photosAccordionHint(photoCounts.before, photoCounts.after)}
            icon={<ImageIcon size={19} color={colors.greenText} weight="duotone" />}
            expanded={openSection === 'photos'}
            onToggle={() => toggleSection('photos')}
          >
            <AppText variant="body" style={styles.accordionBody}>
              {jobPhotoCompletenessMessage(photoCounts)}
            </AppText>
            <SecondaryButton
              label="Add photos"
              onPress={openPhotos}
              style={styles.accordionOutlineButton}
            />
            {jobHasBeforeAndAfter(photos) ? (
              <TextActionRow
                label={t('jobDetail.shareBeforeAfter')}
                icon={<ImageIcon size={17} color={colors.greenText} weight="duotone" />}
                onPress={() => void handleShareTransformation()}
              />
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="Client Communication"
            hint={
              job.client?.phone
                ? `${job.status === 'scheduled' ? 3 : 2} actions`
                : 'No phone on file'
            }
            icon={<NavigationArrow size={19} color={colors.greenText} weight="duotone" />}
            expanded={openSection === 'communication'}
            onToggle={() => toggleSection('communication')}
          >
            {job.location_type === 'mobile' && job.client?.address ? (
              <TextActionRow
                label={t('common.directions')}
                icon={<MapPin size={17} color={colors.greenText} weight="duotone" />}
                onPress={() => void Linking.openURL(openMaps(job.client!.address!))}
              />
            ) : null}
            {job.client?.phone ? (
              <>
                <TextActionRow
                  label={t('jobDetail.onMyWay')}
                  icon={<NavigationArrow size={17} color={colors.greenText} weight="duotone" />}
                  highlighted={job.status === 'scheduled'}
                  onPress={() => void handleOnMyWay()}
                />
                <TextActionRow
                  label={t('jobDetail.textClient')}
                  icon={<PaperPlaneTilt size={17} color={colors.greenText} weight="duotone" />}
                  onPress={() => void handleTextClient()}
                />
              </>
            ) : null}
            <TextActionRow
              label={t('jobDetail.createQuote')}
              icon={<FileText size={17} color={colors.greenText} weight="duotone" />}
              onPress={() => {
                navigateAway(`/quotes/new?clientId=${job.client_id}&jobId=${job.id}`)
              }}
            />
          </AccordionSection>

          <AccordionSection
            title="Billing"
            hint={invoice ? invoice.invoice_number : 'Invoice & portal'}
            icon={<FileText size={19} color={colors.greenText} weight="duotone" />}
            expanded={openSection === 'billing'}
            onToggle={() => toggleSection('billing')}
          >
            {invoice ? (
              <Pressable
                style={styles.invoiceCard}
                onPress={() => {
                  navigateAway(`/invoices/${invoice.id}`)
                }}
              >
                <View style={styles.invoiceRow}>
                  <AppText variant="bodySemiBold">{invoice.invoice_number}</AppText>
                  {invoiceChip ? <Badge tone={invoiceChip.tone} label={invoiceChip.label} /> : null}
                </View>
                <View style={styles.invoiceDueRow}>
                  <CurrencyAmount value={invoice.balance_due} variant="balance" precision="detailed" />
                  <AppText variant="caption" style={styles.muted}>
                    {' '}
                    due · Tap to edit
                  </AppText>
                </View>
              </Pressable>
            ) : (
              <TextActionRow
                label={creatingInvoice ? t('jobDetail.creating') : t('jobDetail.createInvoice')}
                icon={<FileText size={17} color={colors.greenText} weight="duotone" />}
                highlighted={job.status === 'completed' || job.status === 'invoiced'}
                onPress={() => void handleCreateInvoice()}
              />
            )}
            {job.client ? (
              <ShareLinkActions
                clientId={job.client_id}
                clientEmail={job.client.email}
                clientName={job.client.name}
                jobId={job.id}
                context={invoice ? 'invoice' : isUpcoming ? 'appointment' : 'full'}
                invoiceNumber={invoice?.invoice_number}
                hasBeforeAndAfter={jobHasBeforeAndAfter(photos)}
                onRequirePhotos={openPhotos}
                onPdf={invoice ? () => void handleSharePdf() : undefined}
                pdfLabel={t('jobDetail.sharePdf')}
              />
            ) : null}
            {nextServiceDate ? (
              <>
                <AppText variant="caption" style={styles.muted}>
                  Suggested next: {formatNextServiceLabel(nextServiceDate)} ({returnDays}-day cadence)
                </AppText>
                <TextActionRow
                  label={t('jobDetail.bookNext')}
                  icon={<Calendar size={17} color={colors.greenText} weight="duotone" />}
                  onPress={() => {
                    navigateAway(`/jobs/new?client=${job.client_id}&date=${nextServiceDate}`)
                  }}
                />
              </>
            ) : null}
          </AccordionSection>

          <JobHistorySection jobId={jobId} />

          {job.notes ? (
            <View style={styles.section}>
              <AppText variant="sectionLabel">{t('common.notes')}</AppText>
              <View style={styles.card}>
                <AppText variant="body">{job.notes}</AppText>
              </View>
            </View>
          ) : null}

          {variant === 'screen' ? (
            <TextActionRow
              label={t('jobDetail.editJob')}
              icon={<GearSix size={17} color={colors.greenText} weight="duotone" />}
              onPress={() => router.push(`/jobs/edit/${jobId}`)}
            />
          ) : null}

          {isUpcoming ? (
            <SecondaryButton
              label={cancelling ? t('jobDetail.cancelling') : t('jobDetail.cancelAppointment')}
              onPress={handleCancel}
            />
          ) : null}
        </>
      )}

      <CollectDepositSheet
        visible={depositOpen}
        onClose={() => setDepositOpen(false)}
        revenue={job.revenue}
        policies={policies}
        currentStatus={job.deposit_status}
        currentAmount={job.deposit_amount}
        busy={depositBusy}
        onMarkPaid={(amount) =>
          void patchDeposit({
            deposit_status: 'paid',
            deposit_amount: amount,
            deposit_paid_at: new Date().toISOString(),
          }).then(() =>
            import('@/src/lib/entity-events').then(({ appendEntityEvent }) =>
              appendEntityEvent({
                entity: 'job',
                entity_id: jobId,
                action: 'deposit_paid',
                patch: { deposit_amount: amount },
              }),
            ),
          )
        }
        onWaive={() =>
          void patchDeposit({
            deposit_status: 'waived',
            deposit_amount: job.deposit_amount ?? 0,
          })
        }
        onSendPayLink={
          job.client
            ? async (amount) => {
                try {
                  await patchDeposit({
                    deposit_status: 'due',
                    deposit_amount: amount,
                  })
                  const link = await createPortalLink({
                    clientId: job.client_id,
                    scope: 'invoice',
                    jobId: job.id,
                  })
                  await Linking.openURL(openSms(job.client!.phone ?? '', `Deposit for your detail: ${link.url}`))
                } catch (e) {
                  Alert.alert('Pay link', e instanceof Error ? e.message : 'Could not send link')
                }
              }
            : undefined
        }
      />
      <CancelJobPolicySheet
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
        policies={policies}
        busy={cancelling}
        onConfirmCancel={confirmCancelJob}
      />
      {job.client ? (
        <SharePayLinkSheet
          visible={sharePayOpen}
          onClose={() => setSharePayOpen(false)}
          job={job}
          tipPrefs={tipPrefs}
          invoiceTotal={invoice?.total ?? job.revenue + job.tip}
          hasBeforeAndAfter={jobHasBeforeAndAfter(photos)}
          onRequirePhotos={() => {
            setSharePayOpen(false)
            navigateAway(`/(tabs)/jobs/${jobId}/photos`)
          }}
        />
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.sm,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  overlayTitleBlock: {
    flex: 1,
    gap: 2,
  },
  muted: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  serviceCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 0,
  },
  cancelledNote: {
    backgroundColor: colors.surfaceActive,
    borderRadius: 12,
    padding: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  metricLabel: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  metricValue: {
    color: colors.greenText,
  },
  depositSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  expenseList: {
    gap: spacing.xs,
  },
  accordionBody: {
    color: colors.textSecondary,
  },
  accordionOutlineButton: {
    alignSelf: 'stretch',
    width: '100%',
    borderColor: colors.greenBorder,
  },
  kvLabel: {
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  profit: {
    color: colors.greenText,
  },
  margin: {
    color: colors.greenText,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  nextCopy: {
    marginBottom: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  expenseRow: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 4,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  invoiceDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  errorWrap: {
    padding: spacing.md,
  },
  error: {
    color: colors.danger,
  },
})
