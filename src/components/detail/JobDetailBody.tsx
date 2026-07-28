import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Image as ImageIcon } from 'phosphor-react-native'
import {
  countJobPhotosByType,
  jobExpensesForDisplay,
  jobHasBeforeAndAfter,
  jobHasPreJobInspection,
  jobPhotoCompletenessMessage,
  mapJobStatusForDisplay,
  marginPct,
  netProfit,
  effectiveRate,
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
import { ListRow } from '@/src/components/ui/ListRow'
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
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'
import { listEntityEvents, type EntityEvent } from '@/src/lib/entity-events'

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

  const status = mapJobStatusForDisplay(job)
  const profit = netProfit(job)
  const margin = marginPct(job)
  const rate = effectiveRate(job)
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
            onClose?.()
            router.push(`/(tabs)/jobs/${jobId}/photos` as never)
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

  const handleTimerStop = async (hours: number) => {
    const nextStatus = job.status === 'scheduled' ? 'in_progress' : job.status
    if (requiresPreJobInspection(job.status, nextStatus) && !jobHasPreJobInspection(job)) {
      Alert.alert(
        'Walkthrough required',
        'Complete the pre-job liability walkthrough before starting this job.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open walkthrough',
            onPress: () => {
              onClose?.()
              router.push(`/jobs/${jobId}/inspection` as never)
            },
          },
        ],
      )
      return
    }
    const updated = await updateJob(jobId, {
      date: job.date,
      packageId: job.package_id,
      vehicleType: job.vehicle_type,
      locationType: job.location_type,
      revenue: job.revenue,
      tip: job.tip,
      hours_worked: Math.round(hours * 100) / 100,
      start_time: job.start_time,
      status: nextStatus,
      notes: job.notes,
    })
    setJob(updated)
  }

  const contentPadding = variant === 'overlay' ? spacing.md : 0
  const bottomPad = variant === 'screen' ? dockPadding : spacing.xl

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
        {(
          [
            { label: 'Service', value: job.package?.name ?? '—' },
            { label: 'Time', value: timeLabel || dateLabel },
            { label: 'Technician', value: techName, chip: true },
            { label: 'Status', value: status.replace('_', ' '), badge: true },
          ] as const
        ).map((row, i, arr) => (
          <View
            key={row.label}
            style={[styles.serviceRow, i < arr.length - 1 && styles.serviceRowBorder]}
          >
            <AppText variant="body" style={styles.muted}>
              {row.label}
            </AppText>
            {'badge' in row && row.badge ? (
              <Badge tone={statusBadgeTone(status)} label={String(row.value)} />
            ) : 'chip' in row && row.chip ? (
              <View style={styles.techChip}>
                <AppText variant="caption" style={styles.techChipText}>
                  {String(row.value)}
                </AppText>
              </View>
            ) : (
              <AppText variant="bodySemiBold">{String(row.value)}</AppText>
            )}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.moneyRow}>
          <AppText variant="bodySemiBold">Deposit</AppText>
          {depositTone && depositLabel ? <Badge tone={depositTone} label={depositLabel} /> : null}
        </View>
        {job.deposit_status === 'due' || (!job.deposit_status && depositDueAmount > 0) ? (
          <>
            <AppText variant="caption" style={styles.muted}>
              ${depositDueAmount.toFixed(2)} due at booking
            </AppText>
            <PrimaryButton label="Collect Deposit" onPress={() => setDepositOpen(true)} />
          </>
        ) : null}
        {job.deposit_status === 'paid' ? (
          <AppText variant="caption" style={styles.profit}>
            ✓ ${(job.deposit_amount ?? depositDueAmount).toFixed(2)} collected
          </AppText>
        ) : null}
        {job.deposit_status === 'waived' ? (
          <AppText variant="caption" style={styles.muted}>
            Deposit waived
          </AppText>
        ) : null}
      </View>

      <Pressable
        style={styles.card}
        onPress={() => {
          onClose?.()
          router.push(`/(tabs)/jobs/${jobId}/photos` as never)
        }}
      >
        <AppText variant="sectionLabel">Before / After</AppText>
        <AppText variant="body">
          {photoCounts.before} before · {photoCounts.after} after
        </AppText>
        <AppText variant="caption" style={styles.muted}>
          {jobPhotoCompletenessMessage(photoCounts)}
        </AppText>
      </Pressable>

      {job.client ? (
        <PrimaryButton label="Share Pay Link / Tip" onPress={() => setSharePayOpen(true)} />
      ) : null}

      {isUpcoming ? (
        <SecondaryButton
          label={completing ? t('jobDetail.markingComplete') : t('jobDetail.markComplete')}
          loading={completing}
          onPress={() => promptComplete()}
        />
      ) : null}

      {job.status === 'scheduled' || job.status === 'in_progress' ? (
        <View style={styles.card}>
          <AppText variant="sectionLabel">{t('jobDetail.liability')}</AppText>
          {jobHasPreJobInspection(job) ? (
            <AppText variant="caption" style={styles.muted}>
              Completed — view docs or export PDF
            </AppText>
          ) : (
            <AppText variant="caption" style={styles.muted}>
              Required before moving to In progress
            </AppText>
          )}
          <PrimaryButton
            label={jobHasPreJobInspection(job) ? t('jobDetail.viewWalkthrough') : t('jobDetail.startWalkthrough')}
            onPress={() => {
              onClose?.()
              router.push(`/jobs/${job.id}/inspection` as never)
            }}
          />
        </View>
      ) : null}

      <JobTimer jobId={job.id} onStopped={(hours) => void handleTimerStop(hours)} />

      <View style={styles.card}>
        <View style={styles.moneyRow}>
          <AppText variant="body">{t('common.revenue')}</AppText>
          <CurrencyAmount value={job.revenue + job.tip} variant="revenue" />
        </View>
        <View style={styles.divider} />
        <View style={styles.moneyRow}>
          <AppText variant="bodySemiBold">{t('jobDetail.netProfit')}</AppText>
          <CurrencyAmount value={profit} variant="profit" />
        </View>
        <View style={styles.rateRow}>
          <AppText variant="caption" style={styles.margin}>
            Margin {margin}%
          </AppText>
          {rate != null ? (
            <>
              <AppText variant="caption" style={styles.margin}>
                {' · '}
              </AppText>
              <CurrencyAmount value={rate} variant="neutral" precision="detailed" style={styles.margin} />
              <AppText variant="caption" style={styles.margin}>
                /hr
              </AppText>
            </>
          ) : null}
        </View>
      </View>

      {nextServiceDate ? (
        <View style={styles.card}>
          <AppText variant="sectionLabel">{t('jobDetail.nextService')}</AppText>
          <AppText variant="body" style={styles.nextCopy}>
            Suggested: {formatNextServiceLabel(nextServiceDate)} ({returnDays}-day cadence)
          </AppText>
          <PrimaryButton
            label={t('jobDetail.bookNext')}
            onPress={() => {
              onClose?.()
              router.push(`/jobs/new?client=${job.client_id}&date=${nextServiceDate}` as never)
            }}
          />
        </View>
      ) : null}

      {job.location_type === 'mobile' && job.client?.address ? (
        <SecondaryButton
          label={t('common.directions')}
          onPress={() => void Linking.openURL(openMaps(job.client!.address!))}
        />
      ) : null}

      {job.client?.phone ? (
        <>
          <PrimaryButton label={t('jobDetail.onMyWay')} onPress={() => void handleOnMyWay()} />
          <SecondaryButton label={t('jobDetail.textClient')} onPress={() => void handleTextClient()} />
        </>
      ) : null}

      {expenses.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">{t('common.expenses')}</AppText>
          {expenses.map((e, i) => (
            <View key={`${e.category}-${i}`} style={styles.expenseRow}>
              <AppText variant="body">{e.description || e.category}</AppText>
              <CurrencyAmount value={e.amount} variant="expense" unsigned />
            </View>
          ))}
        </View>
      ) : null}

      <SecondaryButton
        label={t('jobDetail.createQuote')}
        onPress={() => {
          onClose?.()
          router.push(`/quotes/new?clientId=${job.client_id}&jobId=${job.id}` as never)
        }}
      />

      <View style={styles.section}>
        <AppText variant="sectionLabel">{t('common.invoice')}</AppText>
        {invoice ? (
          <>
            <Pressable
              style={styles.invoiceCard}
              onPress={() => {
                onClose?.()
                router.push(`/invoices/${invoice.id}`)
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
          </>
        ) : (
          <PrimaryButton
            label={creatingInvoice ? t('jobDetail.creating') : t('jobDetail.createInvoice')}
            loading={creatingInvoice}
            onPress={() => void handleCreateInvoice()}
          />
        )}
      </View>

      {job.client ? (
        <ShareLinkActions
          clientId={job.client_id}
          clientEmail={job.client.email}
          clientName={job.client.name}
          jobId={job.id}
          context={invoice ? 'invoice' : isUpcoming ? 'appointment' : 'full'}
          invoiceNumber={invoice?.invoice_number}
          hasBeforeAndAfter={jobHasBeforeAndAfter(photos)}
          onRequirePhotos={() => {
            onClose?.()
            router.push(`/(tabs)/jobs/${jobId}/photos` as never)
          }}
          onPdf={invoice ? () => void handleSharePdf() : undefined}
          pdfLabel={t('jobDetail.sharePdf')}
        />
      ) : null}

      <JobHistorySection jobId={jobId} />

      <View style={styles.section}>
        <ListRow
          icon={<ImageIcon size={18} color={iconTonePalette.green.fg} weight="duotone" />}
          iconTone="green"
          title={t('common.photos')}
          subtitle={jobPhotoCompletenessMessage(countJobPhotosByType(photos))}
          onPress={() => {
            onClose?.()
            router.push(`/(tabs)/jobs/${jobId}/photos` as never)
          }}
        />
        {jobHasBeforeAndAfter(photos) ? (
          <SecondaryButton
            label={t('jobDetail.shareBeforeAfter')}
            onPress={() => void handleShareTransformation()}
          />
        ) : null}
      </View>

      {job.notes ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">{t('common.notes')}</AppText>
          <View style={styles.card}>
            <AppText variant="body">{job.notes}</AppText>
          </View>
        </View>
      ) : null}

      {variant === 'screen' ? (
        <SecondaryButton label={t('jobDetail.editJob')} onPress={() => router.push(`/jobs/edit/${jobId}`)} />
      ) : null}

      {isUpcoming ? (
        <>
          <SecondaryButton label="Collect deposit" onPress={() => setDepositOpen(true)} />
          <SecondaryButton
            label={cancelling ? t('jobDetail.cancelling') : t('jobDetail.cancelAppointment')}
            onPress={handleCancel}
          />
        </>
      ) : (
        <SecondaryButton label="Deposit" onPress={() => setDepositOpen(true)} />
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
            onClose?.()
            router.push(`/(tabs)/jobs/${jobId}/photos` as never)
          }}
        />
      ) : null}
    </ScrollView>
  )
}

function KvCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <AppText variant="caption" style={styles.kvLabel}>
        {label.toUpperCase()}
      </AppText>
      <AppText variant="bodySemiBold">{value}</AppText>
    </View>
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
    paddingVertical: 0,
    paddingHorizontal: spacing.md,
    gap: 0,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  serviceRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  techChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: iconTonePalette.green.bg,
  },
  techChipText: {
    color: colors.greenText,
    fontWeight: '600',
  },
  kvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kv: {
    width: '46%',
    gap: 2,
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
