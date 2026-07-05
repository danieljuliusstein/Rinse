'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge, Button, ScreenLoading } from '@/components/ui'
import InvoiceTemplateGallery from '@/components/invoice/InvoiceTemplateGallery'
import InvoiceTemplateMock from '@/components/invoice/InvoiceTemplateMock'
import InvoiceLineTemplateManager from '@/components/invoice/InvoiceLineTemplateManager'
import { getPocketBaseAuthToken } from '@/lib/pb-auth'
import { readApiJson } from '@/lib/api-json'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'
import { isValidHexColor, normalizeAccentColor } from '@/lib/brand-color'
import type { InvoiceTemplateId } from '@/lib/invoice-templates'

const ACCENT_PRESETS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9']

type ConnectStatus = {
  accountId: string | null
  chargesEnabled: boolean
  detailsSubmitted: boolean
  ready: boolean
}

async function connectFetch(path: string, method: 'GET' | 'POST' = 'GET') {
  const token = getPocketBaseAuthToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await readApiJson(res)
  if (!res.ok) throw new Error(String(data.error ?? 'Request failed'))
  return data
}

export default function SettingsInvoicingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings, ready, update } = useSettingsDraft()
  const [connect, setConnect] = useState<ConnectStatus | null>(null)
  const [connectLoading, setConnectLoading] = useState(true)
  const [connectBusy, setConnectBusy] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const connectReturn = searchParams.get('connect')
  const refreshHandled = useRef(false)
  const returnCaptured = useRef(false)
  const [stripeReturnNotice, setStripeReturnNotice] = useState<
    'checking' | 'incomplete' | 'complete' | null
  >(null)

  const loadConnect = useCallback(async () => {
    setConnectLoading(true)
    setConnectError(null)
    try {
      const data = await connectFetch('/api/stripe/connect/status')
      setConnect(data as ConnectStatus)
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Could not load Stripe status')
    } finally {
      setConnectLoading(false)
    }
  }, [])

  const handleConnect = useCallback(async () => {
    setConnectBusy(true)
    setConnectError(null)
    try {
      const data = await connectFetch('/api/stripe/connect/onboard', 'POST')
      const url = typeof data.url === 'string' ? data.url : null
      if (url) window.location.href = url
      else throw new Error('Could not open Stripe')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Could not open Stripe')
    } finally {
      setConnectBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    void loadConnect()
  }, [ready, loadConnect, connectReturn])

  useEffect(() => {
    if (connectReturn !== 'return' || returnCaptured.current) return
    returnCaptured.current = true
    setStripeReturnNotice('checking')
    router.replace('/settings/invoicing', { scroll: false })
  }, [connectReturn, router])

  useEffect(() => {
    if (stripeReturnNotice !== 'checking' || connectLoading) return
    setStripeReturnNotice(connect?.ready ? 'complete' : 'incomplete')
  }, [stripeReturnNotice, connectLoading, connect?.ready])

  useEffect(() => {
    if (!ready || connectReturn !== 'refresh' || refreshHandled.current) return
    refreshHandled.current = true
    void handleConnect()
  }, [ready, connectReturn, handleConnect])

  if (!ready || !settings) {
    return <ScreenLoading body variant="settings" />
  }

  const connectReady = connect?.ready === true
  const template = (settings.invoice_template ?? 'rinse') as InvoiceTemplateId
  const accent = normalizeAccentColor(settings.accent_color)
  const businessName = settings.business_name.trim() || 'Your business'

  return (
    <SettingsDetailShell title="Invoicing">
      <section className="card settings-billing-card">
        <div className="settings-billing-card__row">
          <h2 className="settings-billing-card__title">Accept payments online</h2>
          {connectLoading ? null : (
            <Badge tone={connectReady ? 'green' : 'amber'}>
              {connectReady ? 'Connected' : 'Setup needed'}
            </Badge>
          )}
        </div>
        <p className="settings-panel__lead settings-panel__lead--tight">
          Connect your Stripe account so clients pay you directly when they click Pay online on
          invoices. Rinse subscription billing is separate.
        </p>
        {stripeReturnNotice === 'checking' ? (
          <p className="settings-msg">Returned from Stripe — checking status…</p>
        ) : null}
        {stripeReturnNotice === 'incomplete' ? (
          <p className="settings-msg settings-msg--warn">
            Stripe setup is not finished yet. Tap Connect Stripe below to continue where you left off.
          </p>
        ) : null}
        {stripeReturnNotice === 'complete' ? (
          <p className="settings-msg">Stripe is connected — client invoices can accept Pay online.</p>
        ) : null}
        {connectReturn === 'refresh' ? (
          <p className="settings-msg">Reopening Stripe…</p>
        ) : null}
        {!connectLoading && connect && !connectReady ? (
          <p className="settings-status-line">
            {connect.accountId
              ? 'Finish Stripe onboarding to enable Pay online on client invoices.'
              : 'Connect Stripe to turn on Pay online for your portal invoices.'}
          </p>
        ) : null}
        {!connectLoading && !connectReady ? (
          <p className="settings-field-hint form-field-hint-block">
            Stripe opens in your browser. If captcha fails, use Safari or Chrome (not an embedded preview). Use a real business email in Settings → Your business.
          </p>
        ) : null}
        {!connectLoading && connectReady ? (
          <p className="settings-status-line">Client invoice payments deposit to your Stripe account.</p>
        ) : null}
        <div className="settings-divider" />
        <Button
          type="button"
          variant="secondary"
          disabled={connectBusy || connectLoading}
          onClick={() => void handleConnect()}
        >
          {connectReady ? 'Open Stripe dashboard' : 'Connect Stripe'}
        </Button>
        {connectError ? <p className="settings-msg settings-msg--error">{connectError}</p> : null}
      </section>

      <section className="card settings-panel">
        <h2 className="settings-billing-card__title">Invoice appearance</h2>
        <p className="settings-section-desc">
          Template and accent color appear on client-facing invoices and PDFs.
        </p>

        <InvoiceTemplateGallery
          value={template}
          onChange={(v) => update('invoice_template', v)}
          accent={accent}
          businessName={businessName}
          logoUrl={settings.logo_url}
        />

        <div className="invoice-template-live">
          <h3 className="settings-section-head">Live preview</h3>
          <p className="settings-field-hint">Matches what clients see on invoices you send.</p>
          <div className="invoice-doc-card-wrap invoice-template-live__doc">
            <InvoiceTemplateMock
              template={template}
              accent={accent}
              businessName={businessName}
              logoUrl={settings.logo_url}
              scale="full"
            />
          </div>
        </div>

        <div className="settings-field settings-accent-field">
          <h3 className="settings-section-head">Accent color</h3>
          <div className="invoice-accent-presets">
            {ACCENT_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                className={`invoice-accent-swatch${
                  accent === hex ? ' invoice-accent-swatch--on' : ''
                }`}
                style={{ backgroundColor: hex }}
                aria-label={`Accent ${hex}`}
                onClick={() => update('accent_color', hex)}
              />
            ))}
          </div>
          <div className="settings-accent-row">
            <input
              type="color"
              className="settings-accent-swatch-input"
              value={accent}
              onChange={(e) => update('accent_color', e.target.value)}
              aria-label="Custom accent color"
            />
            <input
              type="text"
              className="f-input settings-accent-hex"
              value={settings.accent_color ?? ''}
              placeholder="#22c55e"
              onChange={(e) => {
                const next = e.target.value
                if (!next.trim() || isValidHexColor(next)) update('accent_color', next.trim() || null)
              }}
            />
          </div>
        </div>
      </section>

      <div className="settings-panel">
        <div className="settings-field">
          <h2 className="settings-section-head">Terms footer</h2>
          <p className="settings-section-desc">Shown on invoice PDFs and the client portal footer.</p>
          <textarea
            id="settings-invoice-terms"
            className="input settings-textarea"
            rows={5}
            value={settings.invoice_terms_footer}
            onChange={(e) => update('invoice_terms_footer', e.target.value)}
          />
        </div>
      </div>

      <InvoiceLineTemplateManager />
    </SettingsDetailShell>
  )
}
