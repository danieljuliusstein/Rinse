'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge, Button } from '@/components/ui'
import { getPocketBase } from '@/lib/pocketbase'
import { getPocketBaseAuthToken } from '@/lib/pb-auth'
import { getCurrentOrganizationId } from '@/lib/tenant'
import {
  isFoundingMember,
  isSubscriptionActive,
  trialDaysLeft,
  type OrgSubscription,
} from '@/lib/subscription'
import { STARTER_PLAN, PRO_PLAN } from '@/lib/plans'
import { readApiJson } from '@/lib/api-json'
import SettingsDetailShell from './SettingsDetailShell'

const PLAN_LABELS: Record<string, string> = {
  founding: 'Founding',
  starter: STARTER_PLAN.name,
  pro: 'Pro',
}

function PlanFeatureList() {
  return (
    <ul className="settings-billing-features">
      {STARTER_PLAN.features.map((feature) => (
        <li key={feature}>{feature}</li>
      ))}
    </ul>
  )
}

async function billingFetch(path: string, body?: Record<string, unknown>) {
  const token = getPocketBaseAuthToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await readApiJson(res)
  if (!res.ok) throw new Error(String(data.error ?? 'Request failed'))
  return data
}

export default function SettingsBillingPage() {
  const searchParams = useSearchParams()
  const [org, setOrg] = useState<OrgSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkoutStatus = searchParams.get('checkout')

  useEffect(() => {
    void (async () => {
      try {
        const orgId = getCurrentOrganizationId()
        const pb = getPocketBase()
        if (!orgId || !pb?.authStore.isValid) return
        const record = await pb.collection('organizations').getOne(orgId)
        setOrg({
          plan: String(record.plan ?? 'starter'),
          founding_member: record.founding_member === true,
          subscription_status: String(record.subscription_status ?? 'none'),
          trial_ends_at: record.trial_ends_at ? String(record.trial_ends_at) : undefined,
          current_period_end: record.current_period_end ? String(record.current_period_end) : undefined,
          stripe_customer_id: record.stripe_customer_id ? String(record.stripe_customer_id) : undefined,
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const founding = org ? isFoundingMember(org) : false
  const active = org ? isSubscriptionActive(org) : true
  const daysLeft = org ? trialDaysLeft(org) : null

  const subscribed =
    !founding &&
    (org?.subscription_status === 'active' ||
      org?.subscription_status === 'past_due' ||
      Boolean(org?.stripe_customer_id))

  const handleSubscribe = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await billingFetch('/api/billing/checkout', { plan: 'starter' })
      if (typeof data.url === 'string') window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setBusy(false)
    }
  }

  const handleSubscribePro = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await billingFetch('/api/billing/checkout', { plan: 'pro' })
      if (typeof data.url === 'string') window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setBusy(false)
    }
  }

  const handlePortal = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await billingFetch('/api/billing/portal')
      if (typeof data.url === 'string') window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open billing portal')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
  }

  return (
    <SettingsDetailShell title="Billing" showSave={false}>
      {checkoutStatus === 'success' ? (
        <p className="settings-msg">Subscription updated — thanks!</p>
      ) : null}
      {checkoutStatus === 'cancel' ? (
        <p className="settings-msg settings-msg--warn">Checkout canceled.</p>
      ) : null}

      <section className="card settings-billing-card">
        <div className="settings-billing-card__row">
          <h2 className="settings-billing-card__title">Current plan</h2>
          <Badge tone={active ? 'green' : 'amber'}>{active ? 'Active' : 'Action needed'}</Badge>
        </div>
        <p className="settings-panel__lead">
          {founding
            ? 'You’re on a founding member plan with lifetime access.'
            : `Plan: ${PLAN_LABELS[org?.plan ?? 'starter'] ?? org?.plan}`}
        </p>
        {!founding && daysLeft != null ? (
          <p className="settings-status-line">
            Trial: {daysLeft} day{daysLeft === 1 ? '' : 's'} left
            {org?.trial_ends_at ? ` (ends ${org.trial_ends_at})` : ''}
          </p>
        ) : null}
        {!founding && org?.current_period_end ? (
          <p className="settings-status-line">Renews {org.current_period_end}</p>
        ) : null}
        {!founding ? (
          <>
            <div className="settings-divider" />
            <p className="settings-panel__lead settings-panel__lead--tight">{STARTER_PLAN.tagline}</p>
            <PlanFeatureList />
          </>
        ) : null}
      </section>

      {!founding && !subscribed ? (
        <section className="card settings-billing-plans">
          <div className="settings-billing-plan settings-billing-plan--featured">
            <div>
              <h2 className="settings-billing-card__title">{STARTER_PLAN.name}</h2>
              <p className="settings-panel__lead settings-panel__lead--tight">
                {STARTER_PLAN.launchNote ? (
                  <>
                    <span className="settings-billing-price">{STARTER_PLAN.priceLabel}</span>
                    {' '}
                    <span className="settings-billing-price settings-billing-price--list">
                      {STARTER_PLAN.listPriceLabel}
                    </span>
                    {' '}after your trial
                  </>
                ) : (
                  <>{STARTER_PLAN.priceLabel} after your trial</>
                )}
              </p>
              {STARTER_PLAN.launchNote ? (
                <p className="settings-status-line">{STARTER_PLAN.launchNote}</p>
              ) : null}
            </div>
            <Button type="button" variant="primary" fullWidth={false} disabled={busy} onClick={() => void handleSubscribe()}>
              Subscribe
            </Button>
          </div>

          <div className="settings-billing-plan settings-billing-plan--muted">
            <div>
              <div className="settings-billing-plan__row">
                <h2 className="settings-billing-card__title">{PRO_PLAN.name}</h2>
                {PRO_PLAN.comingSoon ? <Badge tone="amber">Coming soon</Badge> : null}
              </div>
              <p className="settings-panel__lead settings-panel__lead--tight">
                {PRO_PLAN.priceLabel} — {PRO_PLAN.tagline}
              </p>
              <ul className="settings-billing-features settings-billing-features--compact">
                {PRO_PLAN.features.slice(1, 5).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {PRO_PLAN.footnote ? (
                <p className="settings-status-line">{PRO_PLAN.footnote}</p>
              ) : null}
            </div>
            {!PRO_PLAN.comingSoon ? (
              <Button type="button" variant="secondary" fullWidth={false} disabled={busy} onClick={() => void handleSubscribePro()}>
                Subscribe to Pro
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {!founding && subscribed && org?.stripe_customer_id ? (
        <section className="card settings-billing-plans">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void handlePortal()}>
            Manage subscription
          </Button>
        </section>
      ) : null}

      {error ? <p className="settings-msg settings-msg--error">{error}</p> : null}
    </SettingsDetailShell>
  )
}
