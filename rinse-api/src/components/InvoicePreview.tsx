'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilePdf, Lock, PaperPlaneTilt, Plus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import ConfirmSheet from '@/components/ConfirmSheet'
import { ActionDock, Badge, Button, QrCode } from '@/components/ui'
import InvoiceAdjustmentsSheet, {
  invoiceToAdjustments,
  type InvoiceAdjustments,
} from '@/components/invoice/InvoiceAdjustmentsSheet'
import InvoiceCustomizeSheet, {
  buildCustomizeState,
  type InvoiceCustomizeState,
} from '@/components/invoice/InvoiceCustomizeSheet'
import InvoiceDocumentBody from '@/components/invoice/InvoiceDocumentBody'
import InvoiceMoreSheet, { InvoiceMoreButton } from '@/components/invoice/InvoiceMoreSheet'
import InvoicePaymentSheet from '@/components/invoice/InvoicePaymentSheet'
import InvoiceSendSheet from '@/components/invoice/InvoiceSendSheet'
import {
  addPayment,
  createInvoiceForJob,
  deleteInvoice,
  duplicateInvoice,
  getInvoiceLineTemplates,
  getJob,
  markInvoicePaid,
  markInvoiceSent,
  updateInvoice,
} from '@/lib/api'
import { notifyFinancialDataChanged } from '@/lib/financial-data-events'
import { PAYMENT_METHODS } from '@/lib/invoices'
import { downloadInvoicePdf } from '@/lib/pdf/downloadInvoicePdf'
import { createShareLink } from '@/lib/portal-client'
import { successHaptic } from '@/lib/haptics'
import { getAuthFetchHeaders } from '@/lib/pb-auth'
import { handleApiResponsePremiumGate, PREMIUM_REQUIRED_MESSAGE } from '@/lib/premium-api'
import { usePremiumGate } from '@/hooks/usePremiumGate'
import { loadSettings, loadSettingsAsync, type AppSettings } from '@/lib/settings'
import type { InvoiceLineTemplate, JobWithRelations } from '@/lib/types'

export default function InvoicePreview({ job: initialJob }: { job: JobWithRelations }) {
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [job, setJob] = useState(initialJob)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [sendOpen, setSendOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [customizeState, setCustomizeState] = useState<InvoiceCustomizeState | null>(null)
  const [lineTemplates, setLineTemplates] = useState<InvoiceLineTemplate[]>([])
  const [pendingSendAfterCustomize, setPendingSendAfterCustomize] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS[0])
  const [adjustments, setAdjustments] = useState<InvoiceAdjustments>({
    discount_amount: 0,
    tax_rate: 0,
    po_number: '',
  })
  const [portalUrl, setPortalUrl] = useState<string | undefined>()

  const { runGated: runSendGated, isPremiumLocked: sendLocked } = usePremiumGate('send_invoice')
  const { runGated: runPortalGated } = usePremiumGate('share_portal')
  const { runGated: runPdfGated } = usePremiumGate('export_pdf')
  const { runGated: runCreateInvoiceGated } = usePremiumGate('create_invoice')

  const invoice = job.invoice
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadSettingsAsync().then(setSettings)
  }, [])

  useEffect(() => {
    if (!invoice) return
    setAdjustments(invoiceToAdjustments(invoice))
    setCustomizeState(buildCustomizeState(invoice, settings))
  }, [invoice, settings])

  useEffect(() => {
    void getInvoiceLineTemplates().then(setLineTemplates).catch(() => setLineTemplates([]))
  }, [])

  useEffect(() => {
    if (!invoice?.id || !job.client_id) return
    createShareLink({ clientId: job.client_id, jobId: job.id, scope: 'invoice' })
      .then((link) => setPortalUrl(link.url))
      .catch(() => setPortalUrl(undefined))
  }, [invoice?.id, job.client_id, job.id])

  const refresh = useCallback(async () => {
    const updated = await getJob(job.id)
    if (updated) setJob(updated)
  }, [job.id])

  const handleGenerate = async () => {
    runCreateInvoiceGated(() => {
      void (async () => {
        setBusy(true)
        setMessage('')
        try {
          await createInvoiceForJob(job.id)
          notifyFinancialDataChanged()
          await refresh()
          setMessage('Invoice created')
        } catch (e) {
          setMessage(e instanceof Error ? e.message : 'Failed to create invoice')
        } finally {
          setBusy(false)
        }
      })()
    })
  }

  const ensureSent = async () => {
    if (!invoice) throw new Error('No invoice')
    if (invoice.status === 'draft') {
      const sent = await markInvoiceSent(invoice.id)
      await refresh()
      return sent
    }
    return invoice
  }

  const sendEmail = async () => {
    if (!invoice || !settings.business_email || !job.client?.email) {
      await ensureSent()
      setMessage('Invoice marked as sent')
      notifyFinancialDataChanged()
      await refresh()
      return
    }
    const inv = await ensureSent()
    let link = portalUrl
    if (!link) {
      try {
        const created = await createShareLink({
          clientId: job.client_id,
          jobId: job.id,
          scope: 'invoice',
        })
        link = created.url
        setPortalUrl(link)
      } catch {
        // continue without link
      }
    }
    const res = await fetch('/api/invoices/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthFetchHeaders() },
      body: JSON.stringify({
        to: job.client.email,
        clientName: job.client.name,
        invoiceNumber: inv.invoice_number,
        total: inv.total,
        businessName: settings.business_name,
        fromEmail: settings.business_email,
        portalUrl: link,
      }),
    })
    if (!res.ok) {
      if (await handleApiResponsePremiumGate(res)) {
        throw new Error(PREMIUM_REQUIRED_MESSAGE)
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? 'Email failed')
    }
    setMessage('Invoice sent via email')
    notifyFinancialDataChanged()
    await refresh()
  }

  const copyLink = async () => {
    let link = portalUrl
    if (!link) {
      const created = await createShareLink({
        clientId: job.client_id,
        jobId: job.id,
        scope: 'invoice',
      })
      link = created.url
      setPortalUrl(link)
    }
    await navigator.clipboard.writeText(link)
    setLinkCopied(true)
    window.setTimeout(() => setLinkCopied(false), 2000)
    if (invoice?.status === 'draft') {
      await ensureSent()
      notifyFinancialDataChanged()
      await refresh()
    }
    setMessage('Link copied')
  }

  const handlePdf = async () => {
    if (!invoice) return
    setBusy(true)
    setMessage('')
    try {
      await downloadInvoicePdf(job, invoice, settings, portalUrl)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'PDF export failed')
    } finally {
      setBusy(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!invoice) return
    setBusy(true)
    try {
      await markInvoicePaid(invoice.id, 'Cash')
      notifyFinancialDataChanged()
      successHaptic()
      await refresh()
      setMessage('Marked as paid')
    } finally {
      setBusy(false)
    }
  }

  const handleAddPayment = async () => {
    if (!invoice || payAmount <= 0) return
    setBusy(true)
    try {
      await addPayment(invoice.id, { amount: payAmount, method: payMethod, date: today })
      notifyFinancialDataChanged()
      successHaptic()
      await refresh()
      setPaymentOpen(false)
      setPayAmount(0)
      setMessage('Payment logged')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveCustomize = async (openSend = false) => {
    if (!invoice || !customizeState) return
    setBusy(true)
    try {
      const extrasTotal = customizeState.extraLineItems.reduce((s, l) => s + l.default_amount, 0)
      await updateInvoice(invoice.id, {
        terms: customizeState.termsFooter,
        discount_amount: customizeState.adjustments.discount_amount,
        tax_rate: customizeState.adjustments.tax_rate,
        po_number: customizeState.adjustments.po_number,
        extra_line_items: customizeState.extraLineItems,
        subtotal: job.revenue + extrasTotal,
      })
      notifyFinancialDataChanged()
      await refresh()
      setCustomizeOpen(false)
      setMessage('Invoice updated')
      if (openSend || pendingSendAfterCustomize) {
        setPendingSendAfterCustomize(false)
        setSendOpen(true)
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const openSendFlow = () => {
    if (!invoice) return
    if (invoice.status === 'draft' && customizeState) {
      setPendingSendAfterCustomize(true)
      setCustomizeOpen(true)
      return
    }
    setSendOpen(true)
  }

  const handleSaveAdjustments = async () => {
    if (!invoice) return
    setBusy(true)
    try {
      await updateInvoice(invoice.id, adjustments)
      notifyFinancialDataChanged()
      await refresh()
      setAdjustOpen(false)
      setMessage('Invoice updated')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDuplicate = async () => {
    if (!invoice) return
    setBusy(true)
    try {
      await duplicateInvoice(invoice.id)
      notifyFinancialDataChanged()
      await refresh()
      setMessage('Invoice duplicated as new draft')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Duplicate failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    setBusy(true)
    try {
      await deleteInvoice(invoice.id)
      notifyFinancialDataChanged()
      router.push(`/jobs/${job.id}`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusy(false)
      setDeleteOpen(false)
    }
  }

  if (!invoice) {
    return (
      <div className="screen page-content body">
        <div className="page-header page-header--compact">
          <BackButton onClick={() => router.back()} />
          <div className="page-header__title-block">
            <h1>Invoice</h1>
          </div>
        </div>
        <div className="card ui-empty" style={{ textAlign: 'center', padding: 40, marginBottom: 20 }}>
          <FilePdf size={40} weight="duotone" color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>No invoice for this job yet</div>
          <button className="btn-primary" onClick={() => void handleGenerate()} disabled={busy}>
            {busy ? 'Creating…' : 'Generate invoice'}
          </button>
        </div>
        {message && (
        <div
          className={`invoice-screen__message${
            /sent|paid|copied|logged|created/i.test(message)
              ? ' invoice-screen__message--success'
              : ''
          }`}
        >
          {message}
        </div>
      )}
      </div>
    )
  }

  const status = invoice.status

  return (
    <div className="screen page-content body invoice-screen screen--dock-nav">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>Invoice</h1>
          <Badge key={status} status={status} />
          {invoice.signature_url ? <Badge tone="green">Signed</Badge> : null}
        </div>
        <InvoiceMoreButton onClick={() => setMoreOpen(true)} />
      </header>

      <div className="invoice-preview-shell">
        <div className="card invoice-doc-card invoice-doc-card-wrap">
          <InvoiceDocumentBody job={job} invoice={invoice} settings={settings} portalUrl={portalUrl} />
        </div>
        {portalUrl ? <QrCode value={portalUrl} label="Scan to view or pay" className="invoice-preview-qr" /> : null}
      </div>

      {message && (
        <div
          className={`invoice-screen__message${
            /sent|paid|copied|logged|created/i.test(message)
              ? ' invoice-screen__message--success'
              : ''
          }`}
        >
          {message}
        </div>
      )}

      <ActionDock aboveNav>
        <Button variant="ghost" className="ui-action-dock__btn" onClick={() => setMoreOpen(true)} disabled={busy}>
          More
        </Button>
        <Button
          variant="primary"
          className={`ui-action-dock__btn ui-action-dock__btn--primary${sendLocked ? ' ui-action-dock__btn--premium-locked' : ''}`}
          onClick={() => runSendGated(openSendFlow)}
          disabled={busy || status === 'paid'}
          aria-label={sendLocked ? 'Send invoice — subscription required' : 'Send invoice'}
        >
          {sendLocked ? <Lock size={16} weight="bold" aria-hidden="true" /> : <PaperPlaneTilt size={18} aria-hidden="true" />}
          Send
        </Button>
        {invoice.balance_due > 0 && (
          <>
            <Button
              variant="ghost"
              className="ui-action-dock__btn"
              onClick={() => {
                setPayAmount(invoice.balance_due)
                setPaymentOpen(true)
              }}
            >
              <Plus size={16} /> Payment
            </Button>
            <Button variant="secondary" className="ui-action-dock__btn" onClick={() => void handleMarkPaid()} disabled={busy}>
              Paid
            </Button>
          </>
        )}
      </ActionDock>

      <InvoiceSendSheet
        open={sendOpen}
        onOpenChange={setSendOpen}
        canEmail={Boolean(settings.business_email && job.client?.email)}
        busy={busy}
        linkCopied={linkCopied}
        payUrl={portalUrl}
        onEmail={() =>
          runSendGated(() => {
            setBusy(true)
            void sendEmail()
              .catch((e) => setMessage(e instanceof Error ? e.message : 'Send failed'))
              .finally(() => setBusy(false))
          })
        }
        onCopyLink={() =>
          runPortalGated(() => {
            setBusy(true)
            void copyLink()
              .catch((e) => setMessage(e instanceof Error ? e.message : 'Copy failed'))
              .finally(() => setBusy(false))
          })
        }
        onPdf={() => runPdfGated(() => void handlePdf())}
      />

      <InvoicePaymentSheet
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        balanceDue={invoice.balance_due}
        amount={payAmount}
        method={payMethod}
        onAmountChange={setPayAmount}
        onMethodChange={setPayMethod}
        onSubmit={() => void handleAddPayment()}
        busy={busy}
      />

      <InvoiceMoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        busy={busy}
        onAdjust={() => setAdjustOpen(true)}
        onCustomize={() => setCustomizeOpen(true)}
        onDuplicate={() => void handleDuplicate()}
        onDelete={() => setDeleteOpen(true)}
      />

      <InvoiceAdjustmentsSheet
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        values={adjustments}
        onChange={(patch) => setAdjustments((prev) => ({ ...prev, ...patch }))}
        onSave={() => void handleSaveAdjustments()}
        busy={busy}
      />

      {customizeState ? (
        <InvoiceCustomizeSheet
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          job={job}
          invoice={invoice}
          settings={settings}
          portalUrl={portalUrl}
          lineTemplates={lineTemplates}
          values={customizeState}
          onChange={(patch) => setCustomizeState((prev) => (prev ? { ...prev, ...patch } : prev))}
          onSave={() => void handleSaveCustomize()}
          onSend={() => void handleSaveCustomize(true)}
          busy={busy}
        />
      ) : null}

      {deleteOpen ? (
        <ConfirmSheet
          title="Delete invoice?"
          message="This removes the invoice from the job. You can create a new one later."
          confirmLabel="Delete"
          destructive
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteOpen(false)}
        />
      ) : null}
    </div>
  )
}
