import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
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
import { openExternalUrl } from '@/src/lib/open-external-url'
import { useSafeBack } from '@/src/lib/safe-go-back'
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
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { ScreenShell } from '@/src/components/ScreenShell'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { buildInvoiceViewModel } from '@/src/lib/invoice-layout'
import { loadSettings, type AppSettings } from '@/src/lib/settings-store'
import { colors, spacing } from '@/src/theme/colors'

export default function InvoiceDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const goBack = useSafeBack('/(tabs)/invoices')
  const handleBack = () => {
    // #region agent log
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      fetch(`${window.location.origin}/__agent-debug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
        body: JSON.stringify({
          sessionId: '89a058',
          runId: 'post-fix',
          hypothesisId: 'GO_BACK',
          location: 'invoices/[id].tsx:handleBack',
          message: 'Invoice back pressed (safeGoBack)',
          data: { path: window.location.pathname },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
    }
    // #endregion
    goBack()
  }
  const { openJob } = useDetailNavigation()
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

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    const [row, appSettings] = await Promise.all([getInvoice(id), loadSettings()])
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
  }, [id])

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

  const model = useMemo(() => {
    if (!invoice || !job || !settings) return null
    return buildInvoiceViewModel(job, invoice, settings, { portalUrl })
  }, [invoice, job, settings, portalUrl])

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

  const photoCounts = useMemo(() => countJobPhotosByType(jobPhotos), [jobPhotos])
  const hasTransformation = jobHasBeforeAndAfter(jobPhotos)

  const requireTransformationPhotos = (): boolean => {
    if (hasTransformation) return true
    Alert.alert('Before & after required', transformationPdfMissingMessage(), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add photos',
        onPress: () => {
          if (invoice?.job_id) {
            setSendOpen(false)
            router.push(`/(tabs)/jobs/${invoice.job_id}/photos` as never)
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
      } catch (e) {
        // #region agent log
        const payload = JSON.stringify({
          sessionId: '89a058',
          runId: 'post-fix',
          hypothesisId: 'EMAIL-SMS',
          location: 'invoices/[id].tsx:ensureSent',
          message: 'markInvoiceSent failed; continuing share',
          data: { err: e instanceof Error ? e.message : String(e) },
          timestamp: Date.now(),
        })
        console.warn('[debug-89a058] markInvoiceSent failed; continuing share', e)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          fetch(`${window.location.origin}/__agent-debug`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
            body: payload,
          }).catch(() => {})
        }
        // #endregion
        // Remote PB may still gate status=sent on photos; payment-link share must still work.
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
    // #region agent log
    const dbg = (message: string, data: Record<string, unknown>) => {
      const payload = JSON.stringify({
        sessionId: '89a058',
        runId: 'post-fix',
        hypothesisId: 'EMAIL-SMS',
        location: 'invoices/[id].tsx:handleEmailSend',
        message,
        data,
        timestamp: Date.now(),
      })
      console.warn('[debug-89a058]', message, data)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        fetch(`${window.location.origin}/__agent-debug`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
          body: payload,
        }).catch(() => {})
      }
    }
    dbg('email send start', {
      hasInvoice: Boolean(invoice),
      hasEmail: Boolean(job?.client?.email),
      hasSettings: Boolean(settings),
      platform: Platform.OS,
    })
    // #endregion
    if (!invoice) return
    if (!settings) {
      Alert.alert('Share invoice', 'Settings are still loading — try again in a moment.')
      return
    }
    if (!job?.client?.email) {
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
      // #region agent log
      dbg('portal link ok', { hasUrl: Boolean(linkUrl) })
      // #endregion
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not create payment link'
      // #region agent log
      dbg('portal link failed', { message })
      // #endregion
      Alert.alert('Share invoice', message)
      return
    }
    const copy = getShareEmailCopy('invoice', settings.document_locale)
    const subject = copy.subject({
      businessName: settings.business_name,
      invoiceNumber: invoice.invoice_number,
    })
    const body = formatShareEmailBody(copy.bodyIntro, linkUrl)
    const mailto = `mailto:${encodeURIComponent(job.client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    // #region agent log
    dbg('opening mailto via openExternalUrl', { scheme: 'mailto' })
    // #endregion
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
    let linkUrl = ''
    try {
      const link = await createPortalLink({
        clientId: invoice.client_id,
        scope: 'invoice',
        jobId: invoice.job_id,
      })
      linkUrl = link.url
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not create payment link'
      Alert.alert('Copy link', message)
      return
    }
    if (Platform.OS === 'web' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(linkUrl)
    } else {
      await sharePortalUrl(linkUrl)
    }
    setLinkCopied(true)
  }

  const handleSms = async () => {
    // #region agent log
    const dbg = (message: string, data: Record<string, unknown>) => {
      const payload = JSON.stringify({
        sessionId: '89a058',
        runId: 'post-fix',
        hypothesisId: 'EMAIL-SMS',
        location: 'invoices/[id].tsx:handleSms',
        message,
        data,
        timestamp: Date.now(),
      })
      console.warn('[debug-89a058]', message, data)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        fetch(`${window.location.origin}/__agent-debug`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
          body: payload,
        }).catch(() => {})
      }
    }
    dbg('sms send start', {
      hasInvoice: Boolean(invoice),
      hasPhone: Boolean(job?.client?.phone),
      platform: Platform.OS,
    })
    // #endregion
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
      // #region agent log
      dbg('opening sms via openExternalUrl', { scheme: 'sms' })
      // #endregion
      await openExternalUrl(smsUrl)
      setSendOpen(false)
    } catch (e) {
      // #region agent log
      dbg('sms failed', { err: e instanceof Error ? e.message : String(e) })
      // #endregion
      Alert.alert('SMS', e instanceof Error ? e.message : 'Could not send SMS')
    }
  }

  const handlePdf = async () => {
    if (!invoice?.job_id) throw new Error('This invoice is not linked to a job.')
    let url: string | undefined
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

  if (loading) return <LoadingState label={t('invoices.detail.loading')} />

  if (error || !invoice || !model || !settings || !job) {
    return (
      <ScreenShell title={t('invoices.detail.title')} headerRight={<DetailHeaderActions onBack={handleBack} />}>
        <AppText variant="body" style={styles.error}>
          {error ?? t('invoices.detail.notFound')}
        </AppText>
      </ScreenShell>
    )
  }

  const extrasCount = invoice.extra_line_items?.length ?? 0

  return (
    <ScreenShell
      title={invoice.invoice_number}
      subtitle={model.billToName}
      headerRight={<DetailHeaderActions onBack={handleBack} />}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <InvoiceDocumentBody model={model} />

        <View style={styles.actions}>
          <AppText variant="caption" style={styles.photoHint}>
            {jobPhotoCompletenessMessage(photoCounts)}
          </AppText>
          <PrimaryButton
            label={invoice.status === 'draft' ? t('invoices.detail.send') : t('invoices.detail.resend')}
            loading={busy}
            onPress={openSendFlow}
          />

          {invoice.balance_due > 0 && invoice.status !== 'draft' ? (
            <SecondaryButton label={t('invoices.detail.logPayment')} loading={busy} onPress={() => setPaymentOpen(true)} />
          ) : null}

          <SecondaryButton
            label={extrasCount > 0 ? t('invoices.detail.editLinesCount', { count: extrasCount }) : t('invoices.detail.editLines')}
            loading={busy}
            onPress={() => {
              setPendingSendAfterCustomize(false)
              setCustomizeOpen(true)
            }}
          />

          <SecondaryButton label={t('invoices.detail.quickAdjustments')} loading={busy} onPress={() => setAdjustOpen(true)} />

          <SecondaryButton label={t('invoices.detail.previewCustomize')} onPress={() => router.push('/settings/invoicing')} />

          {invoice.job_id ? (
            <SecondaryButton label={t('invoices.detail.viewJob')} onPress={() => openJob(invoice.job_id)} />
          ) : null}
        </View>
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
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  photoHint: {
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
})
