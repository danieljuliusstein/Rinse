import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Check,
  Copy,
  CurrencyDollar,
  FileText,
  GearSix,
  PencilSimple,
  QrCode,
} from '@/src/icons'
import type { Invoice, JobPhoto, JobWithRelations } from '@rinse/core'
import {
  countJobPhotosByType,
  formatShareEmailBody,
  getShareEmailCopy,
  jobHasBeforeAndAfter,
  jobPhotoCompletenessMessage,
  sumLineAmounts,
  transformationPdfMissingMessage,
} from '@rinse/core'
import { getJob } from '@/src/lib/api'
import { navigateAfterClose } from '@/src/lib/navigate-after-close'
import {
  addPayment,
  getInvoice,
  getJobPhotos,
  markInvoiceSent,
  updateInvoice,
} from '@/src/lib/invoices-api'
import { checkPremiumGate } from '@/src/lib/subscription'
import {
  createPortalLink,
  shareInvoicePdf,
  sharePortalUrl,
  shareTransformationPdf,
} from '@/src/lib/share'
import { openSms } from '@/src/lib/api'
import { openPortalPreview } from '@/src/lib/open-portal-preview'
import { openExternalUrl } from '@/src/lib/open-external-url'
import {
  InvoiceAdjustmentsSheet,
  InvoicePaymentSheet,
  InvoiceSendSheet,
} from '@/src/components/invoice/InvoiceActionSheets'
import {
  InvoiceCustomizeSheet,
  type InvoiceCustomizeValues,
} from '@/src/components/invoice/InvoiceCustomizeSheet'
import { InvoiceDocumentBody } from '@/src/components/invoice/InvoiceDocumentBody'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import {
  AccordionSection,
  AppText,
  Badge,
  Button,
  CurrencyAmount,
  PrimaryButton,
  ShareQrCode,
  TextActionRow,
} from '@/src/components/ui'
import { JobStatusPanel } from '@/src/components/detail/JobStatusPanel'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { useTabDockPadding } from '@/src/components/OperatorScreen'
import { buildInvoiceViewModel } from '@/src/lib/invoice-layout'
import {
  invoiceDetailPriority,
  invoiceStatusEyebrow,
  invoiceStatusTone,
  type InvoiceDetailSection,
} from '@/src/lib/invoice-detail-priority'
import { invoiceStatusChip } from '@/src/lib/invoices-list'
import { loadSettings, type AppSettings } from '@/src/lib/settings-store'
import { noScrollbarScrollProps } from '@/src/theme/invoice-surface'
import { colors, radii, spacing } from '@/src/theme/colors'

interface InvoiceDetailBodyProps {
  invoiceId: string
  onClose?: () => void
  onMetaChange?: (meta: { title: string; subtitle?: string }) => void
  variant?: 'screen' | 'overlay'
}

export function InvoiceDetailBody({ invoiceId, onClose, onMetaChange, variant = 'screen' }: InvoiceDetailBodyProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { openJob } = useDetailNavigation()
  const dockPadding = useTabDockPadding(variant === 'screen')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [job, setJob] = useState<JobWithRelations | null>(null)
  const [jobPhotos, setJobPhotos] = useState<JobPhoto[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [portalUrl, setPortalUrl] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendOpen, setSendOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [pendingSendAfterCustomize, setPendingSendAfterCustomize] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [linkVisible, setLinkVisible] = useState(false)
  const [openSection, setOpenSection] = useState<InvoiceDetailSection | null>(null)

  const load = useCallback(async () => {
    if (!invoiceId) return
    setError(null)
    const [row, appSettings] = await Promise.all([getInvoice(invoiceId), loadSettings()])
    setInvoice(row)
    setSettings(appSettings)
    if (row?.job_id) {
      const jobRow = await getJob(row.job_id)
      setJob(jobRow)
      try {
        setJobPhotos(await getJobPhotos(row.job_id))
      } catch {
        setJobPhotos([])
      }
    } else {
      setJob(null)
      setJobPhotos([])
    }
    if (row?.client_id && row.job_id) {
      try {
        const link = await createPortalLink({
          clientId: row.client_id,
          scope: 'invoice',
          jobId: row.job_id,
        })
        setPortalUrl(link.url)
      } catch {
        setPortalUrl(undefined)
      }
    }
  }, [invoiceId])

  useEffect(() => {
    let cancelled = false
    void load()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load invoice')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const priority = useMemo(
    () => (invoice ? invoiceDetailPriority(invoice) : null),
    [invoice],
  )

  useEffect(() => {
    if (!priority) return
    setOpenSection(priority.expandedSection)
  }, [priority])

  const model = useMemo(() => {
    if (!invoice || !job || !settings) return null
    return buildInvoiceViewModel(job, invoice, settings, { portalUrl })
  }, [invoice, job, settings, portalUrl])

  useEffect(() => {
    if (!invoice || !model) return
    onMetaChange?.({ title: invoice.invoice_number, subtitle: model.billToName })
  }, [invoice, model, onMetaChange])

  const photoCounts = useMemo(() => countJobPhotosByType(jobPhotos), [jobPhotos])
  const hasTransformation = jobHasBeforeAndAfter(jobPhotos)
  const extrasCount = invoice?.extra_line_items?.length ?? 0
  const statusChip = invoice ? invoiceStatusChip(invoice.status) : null

  const runAction = async (label: string, fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      Alert.alert(label, e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const requireTransformationPhotos = (): boolean => {
    if (hasTransformation) return true
    Alert.alert('Before & after required', transformationPdfMissingMessage(), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add photos',
        onPress: () => {
          if (invoice?.job_id) {
            setSendOpen(false)
            navigateAfterClose(onClose, () =>
              router.push(`/(tabs)/jobs/${invoice.job_id}/photos` as never),
            )
          }
        },
      },
    ])
    return false
  }

  const ensureSent = async () => {
    if (!invoice) throw new Error('No invoice')
    if (invoice.status === 'draft') {
      const gate = await checkPremiumGate('send_invoice')
      if (!gate.allowed) return
      try {
        await markInvoiceSent(invoice.id)
        await load()
      } catch {
        // Remote PB may gate status=sent on photos; payment-link share must still work.
      }
    }
  }

  const openSendFlow = () => {
    if (!invoice) return
    if (invoice.status === 'draft') {
      setPendingSendAfterCustomize(true)
      setCustomizeOpen(true)
      return
    }
    setSendOpen(true)
  }

  const saveCustomize = async (values: InvoiceCustomizeValues, thenSend: boolean) => {
    if (!invoice || !job) return
    await updateInvoice(invoice.id, {
      discount_amount: values.discount_amount,
      tax_rate: values.tax_rate,
      po_number: values.po_number,
      extra_line_items: values.extra_line_items,
      subtotal: job.revenue + sumLineAmounts(values.extra_line_items),
    })
    setCustomizeOpen(false)
    setPendingSendAfterCustomize(false)
    await load()
    if (thenSend) setSendOpen(true)
  }

  const handleEmailSend = async () => {
    if (!invoice || !settings || !job?.client?.email) {
      Alert.alert('Share invoice', 'Add a client email on their profile to send from here.')
      return
    }
    await ensureSent()
    let linkUrl = ''
    try {
      const link = await createPortalLink({
        clientId: invoice.client_id,
        scope: 'invoice',
        jobId: invoice.job_id,
      })
      linkUrl = link.url
    } catch (e) {
      Alert.alert('Share invoice', e instanceof Error ? e.message : 'Could not create payment link')
      return
    }
    const copy = getShareEmailCopy('invoice', settings.document_locale)
    const subject = copy.subject({
      businessName: settings.business_name,
      invoiceNumber: invoice.invoice_number,
    })
    const body = formatShareEmailBody(copy.bodyIntro, linkUrl)
    const mailto = `mailto:${encodeURIComponent(job.client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    await openExternalUrl(mailto)
    if (invoice.job_id) {
      try {
        await shareTransformationPdf(invoice.job_id)
      } catch {
        // Companion PDF share is best-effort after mailto.
      }
    }
    setSendOpen(false)
  }

  const handleCopyLink = async () => {
    if (!invoice) return
    let linkUrl = portalUrl ?? ''
    if (!linkUrl) {
      try {
        const link = await createPortalLink({
          clientId: invoice.client_id,
          scope: 'invoice',
          jobId: invoice.job_id,
        })
        linkUrl = link.url
        setPortalUrl(linkUrl)
      } catch (e) {
        Alert.alert('Copy link', e instanceof Error ? e.message : 'Could not create payment link')
        return
      }
    }
    if (Platform.OS === 'web' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(linkUrl)
    } else {
      await sharePortalUrl(linkUrl)
    }
    setLinkCopied(true)
    setLinkVisible(true)
  }

  const handleSms = async () => {
    if (!invoice || !job) return
    const phone = job.client?.phone
    if (!phone) {
      Alert.alert('SMS', 'Add a client phone number to send the invoice.')
      return
    }
    await ensureSent()
    try {
      const link = await createPortalLink({
        clientId: invoice.client_id,
        scope: 'invoice',
        jobId: invoice.job_id,
      })
      const body = `Pay invoice ${invoice.invoice_number}: ${link.url}`
      const smsUrl = openSms(phone, body)
      if (!smsUrl) {
        Alert.alert('SMS', 'Add a valid phone number to send the invoice.')
        return
      }
      await openExternalUrl(smsUrl)
      setSendOpen(false)
    } catch (e) {
      Alert.alert('SMS', e instanceof Error ? e.message : 'Could not send SMS')
    }
  }

  const handlePdf = async () => {
    if (!invoice?.job_id) throw new Error('This invoice is not linked to a job.')
    let url: string | undefined = portalUrl
    if (!url) {
      try {
        const link = await createPortalLink({
          clientId: invoice.client_id,
          scope: 'invoice',
          jobId: invoice.job_id,
        })
        url = link.url
      } catch {
        // optional
      }
    }
    const gate = await checkPremiumGate('export_pdf')
    if (!gate.allowed) return
    await shareInvoicePdf(invoice.job_id, invoice, url)
    setSendOpen(false)
  }

  const handleTransformationPdf = async () => {
    if (!invoice?.job_id) throw new Error('This invoice is not linked to a job.')
    if (!requireTransformationPhotos()) return
    await shareTransformationPdf(invoice.job_id)
    setSendOpen(false)
  }

  const handlePrimaryAction = () => {
    if (!priority?.primaryAction) return
    openSendFlow()
  }

  const toggleSection = (section: InvoiceDetailSection) => {
    setOpenSection((current) => (current === section ? null : section))
  }

  const openCustomize = (thenSend: boolean) => {
    setPendingSendAfterCustomize(thenSend)
    setCustomizeOpen(true)
  }

  const viewOnline = async () => {
    const url = portalUrl
    if (!url) {
      Alert.alert('View online', 'Payment link is not available yet. Try again in a moment.')
      return
    }
    await openPortalPreview(url)
  }

  if (loading) return <LoadingState label={t('invoices.detail.loading')} />

  if (error || !invoice || !model || !settings || !job || !priority) {
    return (
      <AppText variant="body" style={styles.error}>
        {error ?? t('invoices.detail.notFound')}
      </AppText>
    )
  }

  const contentPadding = variant === 'overlay' ? spacing.md : 0
  const bottomPad = variant === 'screen' ? dockPadding : spacing.lg

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: contentPadding, paddingBottom: bottomPad },
        ]}
        {...noScrollbarScrollProps}
      >
        {variant === 'overlay' ? (
          <View style={styles.overlayHeader}>
            <View style={styles.overlayTitleBlock}>
              <AppText variant="sectionLabel" style={styles.eyebrow}>
                {invoiceStatusEyebrow(invoice.status)}
              </AppText>
              <AppText variant="h1">{invoice.invoice_number}</AppText>
              <AppText variant="caption" style={styles.muted}>
                {model.billToName}
              </AppText>
            </View>
            {statusChip ? <Badge tone={statusChip.tone} label={statusChip.label} /> : null}
          </View>
        ) : null}

        <JobStatusPanel
          eyebrow={invoiceStatusEyebrow(invoice.status)}
          heading={priority.guidanceHeading}
          statusTone={invoiceStatusTone(invoice.status)}
        />

        <InvoiceDocumentBody model={model} />

        <AppText variant="caption" style={styles.photoHint}>
          {jobPhotoCompletenessMessage(photoCounts)}
        </AppText>

        {priority.primaryLabel && priority.primaryAction ? (
          invoice.status === 'overdue' ? (
            <Button
              variant="danger"
              label={priority.primaryLabel}
              loading={busy}
              onPress={handlePrimaryAction}
            />
          ) : (
            <PrimaryButton label={priority.primaryLabel} loading={busy} onPress={handlePrimaryAction} />
          )
        ) : null}

        {invoice.status === 'paid' ? (
          <View style={styles.paidBanner}>
            <View style={styles.paidIcon}>
              <Check size={16} color={colors.greenText} weight="bold" />
            </View>
            <View style={styles.paidCopy}>
              <AppText variant="bodySemiBold">Payment received</AppText>
              <AppText variant="caption" style={styles.muted}>
                This invoice is settled in full.
              </AppText>
            </View>
            <CurrencyAmount value={invoice.total} variant="revenue" />
          </View>
        ) : null}

        <AccordionSection
          title="Preview & Share"
          hint={portalUrl ? 'Online invoice · Link' : 'Share with client'}
          icon={<QrCode size={19} color={colors.greenText} weight="duotone" />}
          expanded={openSection === 'share'}
          onToggle={() => toggleSection('share')}
        >
          <View style={styles.sharePreview}>
            {portalUrl ? (
              <ShareQrCode url={portalUrl} size={72} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <QrCode size={48} color={colors.textMuted} weight="regular" />
              </View>
            )}
            <View style={styles.shareCopy}>
              <AppText variant="bodySemiBold">Client-ready invoice</AppText>
              <AppText variant="caption" style={styles.muted}>
                Preview or share the secure invoice portal with {model.billToName}.
              </AppText>
            </View>
          </View>
          <TextActionRow
            label="View invoice online"
            icon={<FileText size={17} color={colors.greenText} weight="duotone" />}
            onPress={() => void runAction('View online', viewOnline)}
            disabled={!portalUrl}
          />
          <TextActionRow
            label={t('invoices.detail.previewCustomize')}
            icon={<GearSix size={17} color={colors.greenText} weight="duotone" />}
            onPress={() => {
              navigateAfterClose(onClose, () => router.push('/settings/invoicing'))
            }}
          />
          <TextActionRow
            label={linkCopied ? 'Link copied' : 'Copy payment link'}
            icon={<Copy size={16} color={colors.greenText} weight="duotone" />}
            onPress={() => void runAction('Copy link', handleCopyLink)}
          />
          {linkVisible && portalUrl ? (
            <AppText variant="caption" style={styles.portalLink} selectable>
              {portalUrl}
            </AppText>
          ) : null}
          {invoice.balance_due > 0 && invoice.status !== 'draft' ? (
            <TextActionRow
              label={t('invoices.detail.logPayment')}
              icon={<CurrencyDollar size={17} color={colors.greenText} weight="duotone" />}
              onPress={() => setPaymentOpen(true)}
            />
          ) : null}
        </AccordionSection>

        <AccordionSection
          title="Edit invoice"
          hint={
            extrasCount > 0
              ? `Line items · ${extrasCount} extra`
              : 'Line items · Adjustments'
          }
          icon={<PencilSimple size={19} color={colors.greenText} weight="duotone" />}
          expanded={openSection === 'edit'}
          onToggle={() => toggleSection('edit')}
        >
          <TextActionRow
            label={
              extrasCount > 0
                ? t('invoices.detail.editLinesCount', { count: extrasCount })
                : t('invoices.detail.editLines')
            }
            icon={<FileText size={17} color={colors.greenText} weight="duotone" />}
            onPress={() => openCustomize(false)}
          />
          <TextActionRow
            label={t('invoices.detail.quickAdjustments')}
            icon={<CurrencyDollar size={17} color={colors.greenText} weight="duotone" />}
            onPress={() => setAdjustOpen(true)}
          />
        </AccordionSection>

        {invoice.job_id ? (
          <TextActionRow
            label={t('invoices.detail.viewJob')}
            icon={<Briefcase size={16} color={colors.greenText} weight="duotone" />}
            onPress={() => {
              navigateAfterClose(onClose, () => openJob(invoice.job_id))
            }}
          />
        ) : null}
      </ScrollView>

      <InvoiceSendSheet
        visible={sendOpen}
        onClose={() => setSendOpen(false)}
        canEmail={Boolean(job.client?.email)}
        canTransformationPdf={hasTransformation}
        busy={busy}
        linkCopied={linkCopied}
        onEmail={() => void runAction('Send', handleEmailSend)}
        onSms={() => void runAction('Send SMS', handleSms)}
        onCopyLink={() => void runAction('Copy link', handleCopyLink)}
        onPdf={() => void runAction('PDF', handlePdf)}
        onTransformationPdf={() => void runAction('Before/after PDF', handleTransformationPdf)}
      />

      <InvoicePaymentSheet
        visible={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        balanceDue={invoice.balance_due}
        busy={busy}
        onSubmit={(amount, method) =>
          void runAction('Payment', async () => {
            if (amount <= 0) throw new Error('Enter a payment amount')
            await addPayment(invoice.id, {
              amount,
              method,
              date: new Date().toISOString().split('T')[0],
            })
            setPaymentOpen(false)
            await load()
          })
        }
      />

      <InvoiceAdjustmentsSheet
        visible={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        invoiceId={invoice.id}
        discount={invoice.discount_amount ?? 0}
        taxRate={invoice.tax_rate ?? 0}
        poNumber={invoice.po_number ?? ''}
        busy={busy}
        onSave={(patch) =>
          void runAction('Adjustments', async () => {
            await updateInvoice(invoice.id, patch)
            setAdjustOpen(false)
            await load()
          })
        }
      />

      <InvoiceCustomizeSheet
        visible={customizeOpen}
        onClose={() => {
          setCustomizeOpen(false)
          setPendingSendAfterCustomize(false)
        }}
        invoice={invoice}
        jobRevenue={job.revenue}
        busy={busy}
        saveLabel={pendingSendAfterCustomize ? 'Save & continue to send' : 'Save'}
        onSave={(values) =>
          void runAction('Edit lines', () => saveCustomize(values, pendingSendAfterCustomize))
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  overlayTitleBlock: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: colors.textMuted,
  },
  muted: {
    color: colors.textMuted,
  },
  photoHint: {
    color: colors.textMuted,
    marginTop: -spacing.xs,
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenSoft,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.greenBorder,
    padding: spacing.md,
  },
  paidIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidCopy: {
    flex: 1,
    gap: 2,
  },
  sharePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceActive,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  qrPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shareCopy: {
    flex: 1,
    gap: 4,
  },
  portalLink: {
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
})
