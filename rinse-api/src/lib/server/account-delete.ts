import { getStripe } from './stripe'
import { authenticateServerAdmin } from './pocketbase-admin'
import { escapeFilterValue, type PbRecord } from '../api/mappers'

const TENANT_COLLECTIONS = [
  'damage_docs',
  'portal_tokens',
  'quotes',
  'invoices',
  'jobs',
  'leads',
  'sent_messages',
  'vehicles',
  'notifications_log',
  'clients',
  'packages',
  'supplies',
  'equipment',
  'overhead_expenses',
  'business_expenses',
  'app_settings',
] as const

async function deleteOrgRecords(pb: Awaited<ReturnType<typeof authenticateServerAdmin>>, orgId: string, collection: string) {
  const escaped = escapeFilterValue(orgId)
  const records = await pb.collection(collection).getFullList<PbRecord>({
    filter: `organization_id = "${escaped}"`,
  })
  for (const record of records) {
    await pb.collection(collection).delete(record.id)
  }
}

export async function deleteOrganizationAccount(orgId: string, userId: string) {
  const pb = await authenticateServerAdmin()

  const org = await pb.collection('organizations').getOne<PbRecord>(orgId)
  const stripeSubId = String(org.stripe_subscription_id ?? '').trim()
  if (stripeSubId) {
    const stripe = getStripe()
    if (stripe) {
      try {
        await stripe.subscriptions.cancel(stripeSubId)
      } catch {
        // continue deletion even if Stripe cancel fails
      }
    }
  }

  for (const collection of TENANT_COLLECTIONS) {
    await deleteOrgRecords(pb, orgId, collection)
  }

  const users = await pb.collection('users').getFullList<PbRecord>({
    filter: `organization_id = "${escapeFilterValue(orgId)}"`,
  })
  for (const user of users) {
    await pb.collection('users').delete(user.id)
  }

  await pb.collection('organizations').delete(orgId)

  return { deletedOrgId: orgId, deletedUserId: userId }
}
