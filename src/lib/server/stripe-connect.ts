import type PocketBase from 'pocketbase'
import type Stripe from 'stripe'
import type { PbRecord } from '../api/mappers'
import { authenticateServerAdmin } from './pocketbase-admin'
import { getStripe, stripeAppOrigin } from './stripe'

async function orgPb(userPb?: PocketBase): Promise<PocketBase> {
  if (userPb?.authStore.isValid) return userPb
  return authenticateServerAdmin()
}

export interface StripeConnectStatus {
  accountId: string | null
  chargesEnabled: boolean
  detailsSubmitted: boolean
  ready: boolean
}

export function appOriginFromRequest(request: Request): string {
  return stripeAppOrigin(request)
}

export async function syncConnectAccountToOrg(orgId: string, account: Stripe.Account) {
  const metaOrgId = String(account.metadata?.organization_id ?? '').trim()
  if (metaOrgId && metaOrgId !== orgId) return

  const admin = await authenticateServerAdmin()
  await admin.collection('organizations').update(orgId, {
    stripe_connect_account_id: account.id,
    stripe_connect_charges_enabled: account.charges_enabled === true,
  })
}

export function connectStatusFromAccount(account: Stripe.Account): StripeConnectStatus {
  const chargesEnabled = account.charges_enabled === true
  const detailsSubmitted = account.details_submitted === true
  return {
    accountId: account.id,
    chargesEnabled,
    detailsSubmitted,
    ready: chargesEnabled && detailsSubmitted,
  }
}

/** Find Connect account when PB fields are missing (e.g. migration not applied yet). */
async function findConnectAccountIdInStripe(orgId: string): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null

  let startingAfter: string | undefined
  for (let page = 0; page < 5; page++) {
    const list = await stripe.accounts.list({ limit: 100, starting_after: startingAfter })
    const match = list.data.find((a) => String(a.metadata?.organization_id ?? '') === orgId)
    if (match) return match.id
    if (!list.has_more || list.data.length === 0) break
    startingAfter = list.data[list.data.length - 1]?.id
  }

  return null
}

async function resolveConnectAccountId(orgId: string, org: PbRecord): Promise<string | null> {
  const fromPb = String(org.stripe_connect_account_id ?? '').trim()
  if (fromPb) return fromPb
  return findConnectAccountIdInStripe(orgId)
}

export async function refreshConnectStatus(
  orgId: string,
  userPb?: PocketBase,
): Promise<StripeConnectStatus> {
  const pb = await orgPb(userPb)
  const org = await pb.collection('organizations').getOne<PbRecord>(orgId)
  const accountId = await resolveConnectAccountId(orgId, org)

  if (!accountId) {
    return {
      accountId: null,
      chargesEnabled: false,
      detailsSubmitted: false,
      ready: false,
    }
  }

  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')

  const account = await stripe.accounts.retrieve(accountId)
  try {
    await syncConnectAccountToOrg(orgId, account)
  } catch {
    // PB may lack stripe_connect_* fields until migration 1761300000 is applied
  }
  return connectStatusFromAccount(account)
}

export async function ensureConnectAccount(
  orgId: string,
  email: string,
  businessName: string,
  userPb?: PocketBase,
): Promise<string> {
  const pb = await orgPb(userPb)
  const org = await pb.collection('organizations').getOne<PbRecord>(orgId)
  const existing = await resolveConnectAccountId(orgId, org)

  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')

  if (existing) return existing

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: email || undefined,
    business_profile: businessName ? { name: businessName } : undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { organization_id: orgId },
  })

  try {
    await pb.collection('organizations').update(orgId, {
      stripe_connect_account_id: account.id,
      stripe_connect_charges_enabled: false,
    })
  } catch {
    // PB may lack stripe_connect_* fields until migration 1761300000 is applied
  }

  return account.id
}

export async function resolveConnectDestination(
  orgId: string,
  userPb?: PocketBase,
): Promise<string | null> {
  const status = await refreshConnectStatus(orgId, userPb)
  return status.ready && status.accountId ? status.accountId : null
}

const CONNECT_RETURN_PATH = '/settings/invoicing'

export function connectLinkStrategy(status: StripeConnectStatus): 'login' | 'onboarding' {
  return status.ready ? 'login' : 'onboarding'
}

/** Express accounts cannot use account_update links — use onboarding or Express Dashboard. */
export async function buildConnectRedirectUrl(
  accountId: string,
  request: Request,
  status: StripeConnectStatus,
): Promise<string> {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')

  const origin = appOriginFromRequest(request)
  const refreshUrl = `${origin}${CONNECT_RETURN_PATH}?connect=refresh`
  const returnUrl = `${origin}${CONNECT_RETURN_PATH}?connect=return`

  if (connectLinkStrategy(status) === 'login') {
    const login = await stripe.accounts.createLoginLink(accountId)
    if (!login.url) throw new Error('Could not open Stripe dashboard')
    return login.url
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
  if (!link.url) throw new Error('Could not start Stripe onboarding')
  return link.url
}
