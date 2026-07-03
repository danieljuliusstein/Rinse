'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, EnvelopeSimple, Link } from '@phosphor-icons/react'
import { copyShareLink, createShareLink, emailShareLink, openPortalLink, sameOriginPortalPath } from '@/lib/portal-client'
import { loadSettings } from '@/lib/settings'
import {
  SHARE_LINK_PRESETS,
  type ShareLinkContext,
} from '@/lib/share-link-presets'
import { usePremiumGate } from '@/hooks/usePremiumGate'

export default function ShareLinkActions({
  clientId,
  clientEmail,
  clientName,
  jobId,
  quoteId,
  context = 'full',
  emailSubject,
  emailMessage,
  quoteNumber,
  invoiceNumber,
}: {
  clientId: string
  clientEmail?: string
  clientName: string
  jobId?: string
  quoteId?: string
  /** Preset for scope, copy, and primary action label */
  context?: ShareLinkContext
  emailSubject?: string
  emailMessage?: string
  quoteNumber?: string
  invoiceNumber?: string
}) {
  const preset = SHARE_LINK_PRESETS[context]
  const scope = preset.scope

  const router = useRouter()
  const openingRef = useRef(false)
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const { runGated: runPortalGated } = usePremiumGate('share_portal')

  const settings = loadSettings()
  const resolvedSubject =
    emailSubject ??
    preset.emailSubject({
      businessName: settings.business_name,
      quoteNumber,
      invoiceNumber,
    })
  const resolvedMessage = emailMessage ?? preset.emailMessage

  const ensureLink = async () => {
    if (url) return url
    const result = await createShareLink({ clientId, scope, jobId, quoteId })
    setUrl(result.url)
    return result.url
  }

  const handleCopy = async () => {
    runPortalGated(async () => {
      setBusy(true)
      setMsg('')
      try {
        const link = await ensureLink()
        await copyShareLink(link)
        setMsg('Link copied')
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Failed')
      } finally {
        setBusy(false)
      }
    })
  }

  const handleEmail = async () => {
    if (!clientEmail) {
      setMsg('Client has no email')
      return
    }
    runPortalGated(async () => {
      setBusy(true)
      setMsg('')
      try {
        const link = await ensureLink()
        await emailShareLink({
          to: clientEmail,
          clientName,
          businessName: settings.business_name,
          portalUrl: link,
          subject: resolvedSubject,
          message: resolvedMessage,
        })
        setMsg('Email sent')
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Failed')
      } finally {
        setBusy(false)
      }
    })
  }

  const handleOpen = async () => {
    if (openingRef.current || busy) return
    runPortalGated(async () => {
      openingRef.current = true
      setBusy(true)
      setMsg('')
      try {
        const link = await ensureLink()
        openPortalLink(link, router.push)
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Failed')
      } finally {
        setBusy(false)
        openingRef.current = false
      }
    })
  }

  const previewPath = url ? sameOriginPortalPath(url) : null

  return (
    <div className="share-link-actions">
      <button
        type="button"
        className="btn-primary share-link-actions__primary"
        disabled={busy || !clientEmail}
        onClick={handleEmail}
      >
        <EnvelopeSimple size={16} weight="bold" aria-hidden="true" />
        {preset.primaryActionLabel}
      </button>
      {!clientEmail ? (
        <p className="share-link-actions__hint">Add a client email to send from here, or copy the link below.</p>
      ) : null}
      <div className="share-link-actions__secondary">
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => void handleCopy()}>
          <Copy size={16} aria-hidden="true" /> Copy link
        </button>
        {previewPath ? (
          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={() => router.push(previewPath)}
          >
            <Link size={16} aria-hidden="true" /> Preview
          </button>
        ) : (
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => void handleOpen()}>
            <Link size={16} aria-hidden="true" /> Preview
          </button>
        )}
      </div>
      {msg ? <p className="share-link-actions__msg">{msg}</p> : null}
      {url ? <p className="share-link-actions__url">{url}</p> : null}
    </div>
  )
}
