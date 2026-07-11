import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Image as ImageIcon } from 'phosphor-react-native'
import {
  jobExpensesForDisplay,
  mapJobStatusForDisplay,
  marginPct,
  netProfit,
  effectiveRate,
} from '@rinse/core'
import type { Invoice, JobWithRelations } from '@rinse/core'
import { completeJob, deleteJob, getJob, openMaps, openSms, updateJob } from '@/src/lib/api'
import { formatStartTimeLabel } from '@/src/lib/home-dashboard'
import { composeSmsFromTemplate } from '@/src/lib/messages-api'
import { loadSettings } from '@/src/lib/settings-store'
import { resolveSuppliesUsed } from '@/src/lib/supplies-logic'
import { checkRecordConflict, refreshRecordFromServer } from '@/src/lib/conflict'
import { createInvoiceForJob, getInvoiceByJobId } from '@/src/lib/invoices-api'
import { invoiceStatusChip } from '@/src/lib/invoices-list'
import { formatJobDate } from '@/src/lib/format-dates'
import { formatNextServiceLabel, suggestNextServiceDate } from '@/src/lib/next-service'
import { requireOrganizationId } from '@/src/lib/org'
import { checkPremiumGate } from '@/src/lib/subscription'
import { createPortalLink, shareInvoicePdf } from '@/src/lib/share'
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
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

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
  const router = useRouter()
  const dockPadding = useTabDockPadding(variant === 'screen')
  const [job, setJob] = useState<JobWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasConflict, setHasConflict] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [trackSupplies, setTrackSupplies] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const row = await getJob(jobId)
    setJob(row)
    if (row?.invoice_id || row?.invoice) {
      setInvoice(row.invoice ?? (await getInvoiceByJobId(jobId)))
    } else {
      setInvoice(null)
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
    void loadSettings().then((s) => setTrackSupplies(s.track_job_supplies === true))
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

  if (loading) return <LoadingState label="Loading job…" />

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
      Alert.alert('Job complete', 'You can invoice or share from this screen.')
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

  const handleCancel = () => {
    Alert.alert('Cancel appointment?', 'This frees the slot and removes the job.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel job',
        style: 'destructive',
        onPress: () => {
          setCancelling(true)
          void deleteJob(jobId).then((result) => {
            if (result.ok) {
              onClose?.()
              if (variant === 'screen') router.replace('/(tabs)/jobs')
            } else {
              setCancelling(false)
              Alert.alert('Cancel', result.error ?? 'Could not cancel job')
            }
          })
        },
      },
    ])
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

  const handleTimerStop = async (hours: number) => {
    const updated = await updateJob(jobId, {
      date: job.date,
      packageId: job.package_id,
      vehicleType: job.vehicle_type,
      locationType: job.location_type,
      revenue: job.revenue,
      tip: job.tip,
      hours_worked: Math.round(hours * 100) / 100,
      start_time: job.start_time,
      status: job.status === 'scheduled' ? 'in_progress' : job.status,
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
            <AppText variant="h1">{job.client?.name ?? 'Job'}</AppText>
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

      {isUpcoming ? (
        <PrimaryButton
          label={completing ? 'Marking complete…' : 'Mark job complete'}
          loading={completing}
          onPress={() => promptComplete()}
        />
      ) : null}

      <JobTimer jobId={job.id} onStopped={(hours) => void handleTimerStop(hours)} />

      <View style={styles.card}>
        <View style={styles.kvGrid}>
          <KvCell label="Package" value={job.package?.name ?? '—'} />
          <KvCell label="Vehicle" value={capitalize(job.vehicle_type)} />
          <KvCell label="Location" value={capitalize(job.location_type)} />
          <KvCell label="Hours worked" value={job.hours_worked > 0 ? `${job.hours_worked} hrs` : '—'} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.moneyRow}>
          <AppText variant="body">Revenue</AppText>
          <CurrencyAmount value={job.revenue + job.tip} variant="revenue" />
        </View>
        <View style={styles.divider} />
        <View style={styles.moneyRow}>
          <AppText variant="bodySemiBold">Net profit</AppText>
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
          <AppText variant="sectionLabel">Next service</AppText>
          <AppText variant="body" style={styles.nextCopy}>
            Suggested: {formatNextServiceLabel(nextServiceDate)} ({returnDays}-day cadence)
          </AppText>
          <PrimaryButton
            label="Book next"
            onPress={() => {
              onClose?.()
              router.push(`/jobs/new?client=${job.client_id}&date=${nextServiceDate}` as never)
            }}
          />
        </View>
      ) : null}

      {job.location_type === 'mobile' && job.client?.address ? (
        <SecondaryButton
          label="Directions"
          onPress={() => void Linking.openURL(openMaps(job.client!.address!))}
        />
      ) : null}

      {job.client?.phone ? (
        <SecondaryButton
          label="Text client"
          onPress={() => void handleTextClient()}
        />
      ) : null}

      {expenses.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">Expenses</AppText>
          {expenses.map((e, i) => (
            <View key={`${e.category}-${i}`} style={styles.expenseRow}>
              <AppText variant="body">{e.description || e.category}</AppText>
              <CurrencyAmount value={e.amount} variant="expense" unsigned />
            </View>
          ))}
        </View>
      ) : null}

      <SecondaryButton
        label="Create quote"
        onPress={() => {
          onClose?.()
          router.push(`/quotes/new?clientId=${job.client_id}&jobId=${job.id}` as never)
        }}
      />

      <View style={styles.section}>
        <AppText variant="sectionLabel">Invoice</AppText>
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
            label={creatingInvoice ? 'Creating…' : 'Create invoice'}
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
          onPdf={invoice ? () => void handleSharePdf() : undefined}
          pdfLabel="Share PDF"
        />
      ) : null}

      <View style={styles.section}>
        <ListRow
          icon={<ImageIcon size={18} color={iconTonePalette.green.fg} weight="duotone" />}
          iconTone="green"
          title="Photos"
          subtitle="No photos yet"
          onPress={() => {
            onClose?.()
            router.push(`/(tabs)/jobs/${jobId}/photos` as never)
          }}
        />
      </View>

      {job.notes ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">Notes</AppText>
          <View style={styles.card}>
            <AppText variant="body">{job.notes}</AppText>
          </View>
        </View>
      ) : null}

      {variant === 'screen' ? (
        <SecondaryButton label="Edit job" onPress={() => router.push(`/jobs/edit/${jobId}`)} />
      ) : null}

      {isUpcoming ? (
        <SecondaryButton
          label={cancelling ? 'Cancelling…' : 'Cancel appointment'}
          onPress={handleCancel}
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
