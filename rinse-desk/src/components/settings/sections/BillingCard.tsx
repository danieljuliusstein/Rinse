import { startDesktopCheckout } from '@/lib/billing-checkout'
import { loadDesktopSetup, requestDesktopSetup } from '@/lib/desktop-onboarding'
import { useEffect, useState } from 'react'
import { appApiJson } from '@/lib/app-api'
import { fetchOrgSubscription, type OrgSubscription } from '@/lib/subscription'
import { FREE_PLAN, STARTER_PLAN, hasStarterAccess, isFoundingMember } from '../../../../../packages/core/src/pricing'
import { Card, CardBody, CardHeader } from '../primitives'
export function BillingCard() {
  const [org, setOrg] = useState<OrgSubscription | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [canSetup, setCanSetup] = useState(false)
  useEffect(() => {
    let alive = true
    void fetchOrgSubscription(true).then((value) => { if (alive) setOrg(value) })
    void loadDesktopSetup().then((value) => { if (alive) setCanSetup(value.enabled && !value.completedAt) }).catch(() => {})
    return () => { alive = false }
  }, [])
  async function open(path: string) {
    setBusy(true); setError('')
    try {
      if (path === '/api/billing/checkout') { await startDesktopCheckout(); return }
      const result = await appApiJson<{ url: string }>(path, { method: 'POST' }); window.location.assign(result.url) }
    catch (e) { setError(e instanceof Error ? e.message : 'Billing unavailable') }
    finally { setBusy(false) }
  }
  const founding = !!org && isFoundingMember(org)
  const paid = hasStarterAccess(org)
  return <Card><CardHeader title="Billing & plan" /><CardBody className="space-y-4">
    <p>{founding ? 'Founding · lifetime Starter, granted by the owner' : paid ? org?.plan === 'early' ? 'Early · $3/month' : 'Starter · $6/month' : 'Free · $0'}</p>
    <p className="text-sm text-ink-600">{FREE_PLAN.tagline} Free includes five active jobs, invoices and customer payments. {STARTER_PLAN.tagline}</p>
    {!founding && org?.billing_provider === 'apple' ? <p>Manage or restore your App Store subscription in the Rinse iOS app.</p> : !founding && <div className="flex flex-wrap gap-3">
      {!paid && !['active','past_due'].includes(org?.subscription_status || '') && <button disabled={!org || busy} className="rounded-xl bg-brand-600 text-white px-4 py-3" onClick={() => void open('/api/billing/checkout')}>Upgrade to Starter · $6/month</button>}
      {!!org?.stripe_customer_id && <button disabled={busy} className="rounded-xl border px-4 py-3" onClick={() => void open('/api/billing/portal')}>Manage subscription</button>}
    </div>}
    {!paid && !founding && <p className="text-sm">Early offer: $3/month for the first 100 qualifying paying operators while continuously subscribed. Checkout confirms eligibility and the price.</p>}
    <p className="text-sm">Cancellation keeps Starter through the paid period, then returns to Free. Existing records are preserved.</p>
    {canSetup && <button className="text-sm underline" onClick={requestDesktopSetup}>Open desktop setup</button>}
    {error && <p role="alert">{error}</p>}
  </CardBody></Card>
}
