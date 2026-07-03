'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FileText, Lock, X } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import QuoteSendSheet from '@/components/quote/QuoteSendSheet'
import { ActionDock, Badge, Button } from '@/components/ui'
import {
  acceptQuote,
  declineQuote,
  getQuote,
  markQuoteSent,
} from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import { downloadQuotePdf } from '@/lib/pdf/downloadQuotePdf'
import { createShareLink, emailShareLink } from '@/lib/portal-client'
import { loadSettingsAsync, type AppSettings } from '@/lib/settings'
import { usePremiumGate } from '@/hooks/usePremiumGate'
import type { QuoteWithRelations } from '@/lib/types'

function formatQuoteDate(dateStr?: string): string {
  if (!dateStr?.trim()) return 'Date TBD'
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return 'Date TBD'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function QuoteDetail({ quote: initial }: { quote: QuoteWithRelations }) {
  const router = useRouter()
  const [quote, setQuote] = useState(initial)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [sendOpen, setSendOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | undefined>()

  const { runGated: runSendGated, isPremiumLocked: sendLocked } = usePremiumGate('send_quote')
  const { runGated: runPortalGated } = usePremiumGate('share_portal')
  const { runGated: runPdfGated } = usePremiumGate('export_pdf')

  useEffect(() => {
    void loadSettingsAsync().then(setSettings)
  }, [])

  useEffect(() => {
    if (!quote.client_id) return
    createShareLink({ clientId: quote.client_id, quoteId: quote.id, scope: 'quote' })
      .then((link) => setPortalUrl(link.url))
      .catch(() => setPortalUrl(undefined))
  }, [quote.client_id, quote.id])

  const refresh = useCallback(async () => {
    const updated = await getQuote(quote.id)
    if (updated) setQuote(updated)
  }, [quote.id])

  const ensureSent = async () => {
    if (quote.status === 'draft') {
      await markQuoteSent(quote.id)
      await refresh()
    }
  }

  const resolvePortalUrl = async () => {
    if (portalUrl) return portalUrl
    const link = await createShareLink({
      clientId: quote.client_id,
      quoteId: quote.id,
      scope: 'quote',
    })
    setPortalUrl(link.url)
    return link.url
  }

  const copyLink = async () => {
    const url = await resolvePortalUrl()
    await navigator.clipboard.writeText(url)
    setLinkCopied(true)
    window.setTimeout(() => setLinkCopied(false), 2000)
    if (quote.status === 'draft') await ensureSent()
    setMessage('Link copied')
    await refresh()
  }

  const sendEmail = async () => {
    if (!settings?.business_email || !quote.client?.email) {
      await ensureSent()
      setMessage('Quote marked as sent')
      return
    }
    await ensureSent()
    const url = await resolvePortalUrl()
    await emailShareLink({
      to: quote.client.email,
      clientName: quote.client.name,
      businessName: settings.business_name,
      portalUrl: url,
      subject: `Quote ${quote.quote_number} from ${settings.business_name}`,
      message: `Hi ${quote.client.name},\n\nYour quote for ${fmtDetailed(quote.subtotal)} is ready to review.`,
    })
    setMessage('Quote sent via email')
    await refresh()
  }

  const handlePdf = async () => {
    setBusy(true)
    try {
      const s = settings ?? (await loadSettingsAsync())
      await downloadQuotePdf(quote, s)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'PDF failed')
    } finally {
      setBusy(false)
    }
  }

  const handleAccept = async () => {
    setBusy(true)
    setMessage('')
    try {
      const result = await acceptQuote(quote.id)
      if (result) {
        setMessage('Quote accepted — job scheduled')
        router.push(`/jobs/${result.jobId}`)
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Accept failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDecline = async () => {
    setBusy(true)
    try {
      await declineQuote(quote.id)
      await refresh()
      setMessage('Quote declined')
    } finally {
      setBusy(false)
    }
  }

  const proposedLabel = formatQuoteDate(quote.date)

  const canRespond = (quote.status === 'sent' || quote.status === 'draft') && !quote.job_id

  return (
    <div className="screen page-content quote-screen screen--dock-nav">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.back()} />
        <div className="page-header__title-block">
          <h1>{quote.quote_number}</h1>
          <Badge status={quote.status} />
        </div>
      </header>

      <p className="quote-screen__client">{quote.client?.name}</p>

      <div className="card quote-doc-card">
        <div className="quote-doc-card__service">
          {quote.package?.name} · {quote.vehicle_type}
        </div>
        <div className="quote-doc-card__date">Proposed {proposedLabel}</div>
        {quote.valid_until ? (
          <div className="quote-doc-card__valid">
            Valid until {formatQuoteDate(quote.valid_until.split('T')[0])}
          </div>
        ) : null}
        <div className="quote-doc-card__amount">{fmtDetailed(quote.subtotal)}</div>
        {quote.notes ? <p className="quote-doc-card__notes">{quote.notes}</p> : null}
      </div>

      {message ? <p className="quote-screen__message">{message}</p> : null}

      {quote.job_id ? (
        <Button variant="secondary" fullWidth onClick={() => router.push(`/jobs/${quote.job_id}`)}>
          <FileText size={18} /> View scheduled job
        </Button>
      ) : null}

      <ActionDock aboveNav>
        <Button
          variant="primary"
          className={`ui-action-dock__btn ui-action-dock__btn--primary${sendLocked ? ' ui-action-dock__btn--premium-locked' : ''}`}
          onClick={() => runSendGated(() => setSendOpen(true))}
          disabled={busy || quote.status === 'accepted' || quote.status === 'declined'}
          aria-label={sendLocked ? 'Send quote — subscription required' : 'Send quote'}
        >
          {sendLocked ? <Lock size={16} weight="bold" aria-hidden="true" /> : null}
          Send
        </Button>
        {canRespond ? (
          <>
            <Button variant="secondary" className="ui-action-dock__btn" onClick={() => void handleAccept()} disabled={busy}>
              <Check size={16} /> Accept
            </Button>
            <Button variant="ghost" className="ui-action-dock__btn" onClick={() => void handleDecline()} disabled={busy}>
              <X size={16} /> Decline
            </Button>
          </>
        ) : null}
      </ActionDock>

      <QuoteSendSheet
        open={sendOpen}
        onOpenChange={setSendOpen}
        canEmail={Boolean(settings?.business_email && quote.client?.email)}
        busy={busy}
        linkCopied={linkCopied}
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
    </div>
  )
}
