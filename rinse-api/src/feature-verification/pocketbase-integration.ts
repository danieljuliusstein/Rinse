import PocketBase, { ClientResponseError } from 'pocketbase'

export type IntegrationAccount = {
  email: string
  password: string
  userId: string
  organizationId: string
  pb: PocketBase
}

export function hasPocketBaseIntegrationConfig(): boolean {
  return Boolean(
    (process.env.FEATURE_PB_URL ?? process.env.PB_URL ?? process.env.NEXT_PUBLIC_PB_URL) &&
      process.env.PB_ADMIN_EMAIL &&
      process.env.PB_ADMIN_PASSWORD,
  )
}

function baseUrl(): string {
  return (process.env.FEATURE_PB_URL ?? process.env.PB_URL ?? process.env.NEXT_PUBLIC_PB_URL ?? '').replace(/\/$/, '')
}

function testPassword(): string {
  return process.env.FEATURE_PB_PASSWORD ?? 'FeatureVerification2026!aA1'
}

export async function authenticateAdmin(): Promise<PocketBase> {
  const pb = new PocketBase(baseUrl())
  pb.autoCancellation(false)
  await pb.collection('_superusers').authWithPassword(
    String(process.env.PB_ADMIN_EMAIL),
    String(process.env.PB_ADMIN_PASSWORD),
  )
  return pb
}

export async function createIntegrationAccount(runId: string): Promise<IntegrationAccount> {
  const admin = await authenticateAdmin()
  const suffix = `${runId}-${Math.random().toString(36).slice(2, 8)}`
  const organization = await admin.collection('organizations').create({
    name: `Feature Verification ${suffix}`,
    slug: `feature-verification-${suffix}`.slice(0, 48),
    plan: 'founding',
    founding_member: true,
    booking_enabled: true,
    subscription_status: 'active',
  })
  const email = `feature-${suffix}@example.test`
  const user = await admin.collection('users').create({
    email,
    password: testPassword(),
    passwordConfirm: testPassword(),
    verified: true,
    organization_id: organization.id,
  })
  const pb = new PocketBase(baseUrl())
  pb.autoCancellation(false)
  await pb.collection('users').authWithPassword(email, testPassword())
  return { email, password: testPassword(), userId: user.id, organizationId: organization.id, pb }
}

export async function createUnprovisionedUser(runId: string): Promise<{ admin: PocketBase; userId: string; email: string }> {
  const admin = await authenticateAdmin()
  const email = `oauth-${runId}-${Math.random().toString(36).slice(2, 8)}@example.test`
  const user = await admin.collection('users').create({
    email,
    password: testPassword(),
    passwordConfirm: testPassword(),
    verified: true,
  })
  return { admin, userId: user.id, email }
}

export async function deleteIntegrationAccount(account: IntegrationAccount): Promise<void> {
  const admin = await authenticateAdmin()
  const records = await admin.collection('users').getFullList({ filter: `organization_id = "${account.organizationId}"` })
  for (const collection of ['portal_tokens', 'leads', 'damage_docs', 'quotes', 'invoices', 'vehicles', 'jobs', 'clients', 'packages', 'supplies', 'equipment', 'business_expenses', 'overhead_expenses', 'app_settings']) {
    try {
      const items = await admin.collection(collection).getFullList({ filter: `organization_id = "${account.organizationId}"` })
      for (const item of items) await admin.collection(collection).delete(item.id)
    } catch (error) {
      if (!(error instanceof ClientResponseError) || error.status !== 404) throw error
    }
  }
  for (const user of records) await admin.collection('users').delete(user.id)
  await admin.collection('organizations').delete(account.organizationId)
}

export function isPocketBaseUnauthorized(error: unknown): boolean {
  return error instanceof ClientResponseError && [401, 403, 404].includes(error.status)
}
