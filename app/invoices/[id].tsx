import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { Invoice, JobWithRelations } from '@rinse/core'
import { getJob } from '@/src/lib/api'
import {
  addPayment,
  getInvoice,
  markInvoiceSent,
  updateInvoice,
} from '@/src/lib/invoices-api'
import { checkPremiumGate } from '@/src/lib/subscription'
import { createPortalLink, shareInvoicePdf, sharePortalUrl } from '@/src/lib/share'
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
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { openJob } = useDetailNavigation()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [job, setJob] = useState<JobWithRelations | null>(null)
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
    } else {
      setJob(null)
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

  const ensureSent = async () => {
    if (!invoice) throw new Error('No invoice')
    if (invoice.status === 'draft') {
      const gate = await checkPremiumGate('send_invoice')
      if (!gate.allowed) return
      await markInvoiceSent(invoice.id)
      await load()
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
      subtotal: job.revenue + values.extra_line_items.reduce((s, l) => s + l.default_amount, 0),
    })
    setCustomizeOpen(false)
    setPendingSendAfterCustomize(false)
    await load()
    if (thenSend) setSendOpen(true)
  }

  const handleEmailSend = async () => {
    if (!invoice || !job?.client?.email || !settings) return
    await ensureSent()
    const link = await createPortalLink({
      clientId: invoice.client_id,
      scope: 'invoice',
      jobId: invoice.job_id,
    })
    const subject = `Invoice ${invoice.invoice_number} from ${settings.business_name}`
    const body = `View and pay your invoice using the secure link below.\n\n${link.url}`
    await Linking.openURL(
      `mailto:${encodeURIComponent(job.client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    )
    setSendOpen(false)
  }

  const handleCopyLink = async () => {
    if (!invoice) return
    const link = await createPortalLink({
      clientId: invoice.client_id,
      scope: 'invoice',
      jobId: invoice.job_id,
    })
    if (Platform.OS === 'web' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link.url)
    } else {
      await sharePortalUrl(link.url)
    }
    setLinkCopied(true)
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

  if (loading) return <LoadingState label="Loading invoice…" />

  if (error || !invoice || !model || !settings || !job) {
    return (
      <ScreenShell title="Invoice" headerRight={<DetailHeaderActions onBack={() => router.back()} />}>
        <AppText variant="body" style={styles.error}>
          {error ?? 'Invoice not found'}
        </AppText>
      </ScreenShell>
    )
  }

  const extrasCount = invoice.extra_line_items?.length ?? 0

  return (
    <ScreenShell
      title={invoice.invoice_number}
      subtitle={model.billToName}
      headerRight={<DetailHeaderActions onBack={() => router.back()} />}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <InvoiceDocumentBody model={model} />

        <View style={styles.actions}>
          <PrimaryButton
            label={invoice.status === 'draft' ? 'Send invoice' : 'Resend / share'}
            loading={busy}
            onPress={openSendFlow}
          />

          {invoice.balance_due > 0 && invoice.status !== 'draft' ? (
            <SecondaryButton label="Log payment" loading={busy} onPress={() => setPaymentOpen(true)} />
          ) : null}

          <SecondaryButton
            label={extrasCount > 0 ? `Edit lines (${extrasCount} extras)` : 'Edit line items'}
            loading={busy}
            onPress={() => {
              setPendingSendAfterCustomize(false)
              setCustomizeOpen(true)
            }}
          />

          <SecondaryButton label="Quick adjustments" loading={busy} onPress={() => setAdjustOpen(true)} />

          <SecondaryButton label="Preview & customize" onPress={() => router.push('/settings/invoicing')} />

          {invoice.job_id ? (
            <SecondaryButton label="View job" onPress={() => openJob(invoice.job_id)} />
          ) : null}
        </View>
      </ScrollView>

      <InvoiceSendSheet
        visible={sendOpen}
        onClose={() => setSendOpen(false)}
        canEmail={Boolean(job.client?.email)}
        busy={busy}
        linkCopied={linkCopied}
        onEmail={() => void runAction('Send', handleEmailSend)}
        onCopyLink={() => void runAction('Copy link', handleCopyLink)}
        onPdf={() => void runAction('PDF', handlePdf)}
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
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
})
