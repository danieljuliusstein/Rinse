import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { AppStoreServerAPIClient, Environment, SignedDataVerifier } from '@apple/app-store-server-library'
import { authenticateServerAdmin } from './pocketbase-admin'
import { billingCommand } from './billing-store'
export function appleAccountToken(orgId: string): string {
  const h = createHash('sha256').update(`rinse:apple:${orgId}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}
function required(name: string): string {
  const value = process.env[name]?.trim(); if (!value) throw new Error(`${name} is not configured`); return value
}
export function appleServices() {
  const env = required('APPLE_ENVIRONMENT')
  if (!['Sandbox', 'Production'].includes(env)) throw new Error('Invalid Apple environment')
  const environment = env === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX
  const bundle = required('APPLE_BUNDLE_ID')
  const roots = required('APPLE_ROOT_CA_PATHS').split(',').map(path => readFileSync(path.trim()))
  const verifier = new SignedDataVerifier(roots, true, environment, bundle, environment === Environment.PRODUCTION ? Number(required('APPLE_APP_ID')) : undefined)
  const client = new AppStoreServerAPIClient(required('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n'), required('APPLE_KEY_ID'), required('APPLE_ISSUER_ID'), bundle, environment)
  return { verifier, client }
}
export function appleProduct(plan: 'starter' | 'early') { return required(plan === 'early' ? 'APPLE_EARLY_PRODUCT_ID' : 'APPLE_STARTER_PRODUCT_ID') }
export async function syncApplePurchase(signedTransaction: string, expectedOrgId?: string, notificationId?: string) {
  const { verifier, client } = appleServices()
  const initial = await verifier.verifyAndDecodeTransaction(signedTransaction)
  if (!initial.originalTransactionId || !initial.appAccountToken) throw new Error('Purchase is not bound to a Rinse account')
  const pb = await authenticateServerAdmin()
  const org = expectedOrgId ? await pb.collection('organizations').getOne(expectedOrgId) : await pb.collection('organizations').getFirstListItem(pb.filter('billing_account_token = {:token}', { token: initial.appAccountToken }))
  if (initial.appAccountToken.toLowerCase() !== appleAccountToken(org.id)) throw new Error('This purchase belongs to another Rinse account')
  // Query current status to avoid granting access from a replayed or revoked transaction.
  const current = await client.getAllSubscriptionStatuses(initial.originalTransactionId)
  const latest = current.data?.flatMap(group => group.lastTransactions ?? []).find(t => t.originalTransactionId === initial.originalTransactionId)
  if (!latest?.signedTransactionInfo) throw new Error('Subscription status unavailable')
  const transaction = await verifier.verifyAndDecodeTransaction(latest.signedTransactionInfo)
  const renewal = latest.signedRenewalInfo ? await verifier.verifyAndDecodeRenewalInfo(latest.signedRenewalInfo) : null
  if (transaction.appAccountToken?.toLowerCase() !== appleAccountToken(org.id)) throw new Error('Purchase ownership mismatch')
  const plan = transaction.productId === appleProduct('early') ? 'early' : transaction.productId === appleProduct('starter') ? 'starter' : null
  if (!plan || transaction.type !== 'Auto-Renewable Subscription' || transaction.inAppOwnershipType !== 'PURCHASED') throw new Error('Unsupported product')
  const active = latest.status === 1 && !transaction.revocationDate && (transaction.expiresDate ?? 0) > Date.now()
  return billingCommand({ action: 'sync', orgId: org.id, provider: 'apple', subscriptionId: transaction.originalTransactionId,
    eventId: `apple:${notificationId || `${transaction.transactionId}:${latest.status}:${renewal?.autoRenewStatus}:${transaction.signedDate}`}`,
    order: transaction.signedDate, plan, status: active ? 'active' : 'canceled', paid: (transaction.price ?? 0) > 0,
    periodEnd: transaction.expiresDate ? new Date(transaction.expiresDate).toISOString() : '', cancelAtPeriodEnd: renewal?.autoRenewStatus === 0 })
}
