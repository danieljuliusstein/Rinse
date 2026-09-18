import { slugifyBusinessName } from '../tenant'
import { DEFAULT_INVOICE_TERMS } from '../settings'
import { DEFAULT_BOOKING_SCHEDULE } from '../booking-availability'
import { isPlatformAdminEmail } from '../platform-admin'
import { authenticateServerAdmin } from './pocketbase-admin'
import { logPlatformEvent } from './platform-events'
import { escapeFilterValue } from '../api/mappers'
import type { PbRecord } from '../api/mappers'

const DEFAULT_PACKAGES = [
  { name: 'Basic Wash', base_price: 80, active: true, description: 'Exterior wash and dry', duration_minutes: 90 },
  { name: 'Full Detail', base_price: 320, active: true, description: 'Interior + exterior full detail', duration_minutes: 240 },
  { name: 'Paint Correction', base_price: 450, active: true, description: 'Single-stage paint correction', duration_minutes: 300 },
  { name: 'Ceramic Coat', base_price: 800, active: true, description: 'Ceramic coating application', duration_minutes: 360 },
]

const DEFAULT_SUPPLIES = [
  { name: 'Car wash soap', unit: 'oz', quantity_on_hand: 128, reorder_threshold: 32, cost_per_unit: 0.15, supplier: 'Chemical Guys', kind: 'chemical' },
  { name: 'Microfiber towels', unit: 'each', quantity_on_hand: 24, reorder_threshold: 8, cost_per_unit: 2.5, supplier: 'Amazon', kind: 'consumable' },
  { name: 'Interior cleaner', unit: 'oz', quantity_on_hand: 64, reorder_threshold: 16, cost_per_unit: 0.22, supplier: 'Meguiars', kind: 'chemical' },
  { name: 'Wax / sealant', unit: 'oz', quantity_on_hand: 32, reorder_threshold: 8, cost_per_unit: 1.2, supplier: 'Chemical Guys', kind: 'chemical' },
]

async function uniqueSlug(pb: Awaited<ReturnType<typeof authenticateServerAdmin>>, base: string): Promise<string> {
  let slug = slugifyBusinessName(base)
  let attempt = 0
  while (attempt < 20) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`
    const escaped = escapeFilterValue(candidate)
    const existing = await pb.collection('organizations').getFullList({
      filter: `slug = "${escaped}"`,
      limit: 1,
    })
    if (existing.length === 0) return candidate
    attempt++
  }
  throw new Error('Could not generate unique slug')
}

export interface SignupInput {
  email: string
  password: string
  businessName: string
  slug?: string
}

export interface OAuthProvisionInput {
  userId: string
  email: string
  businessName?: string
}

async function seedOrganizationData(
  pb: Awaited<ReturnType<typeof authenticateServerAdmin>>,
  orgId: string,
  businessName: string,
  email: string,
) {
  await pb.collection('app_settings').create({
    organization_id: orgId,
    business_name: businessName,
    business_phone: '',
    business_email: email,
    business_address: '',
    onboarding_step: 1,
    invoice_terms_footer: DEFAULT_INVOICE_TERMS,
    booking_schedule: DEFAULT_BOOKING_SCHEDULE,
    notifications: {
      job_reminder: true,
      morning_reminder: true,
      follow_up: true,
      invoice_overdue: true,
      low_inventory: true,
    },
  })

  for (const pkg of DEFAULT_PACKAGES) {
    try {
      await pb.collection('packages').create({
        name: pkg.name,
        base_price: pkg.base_price,
        active: pkg.active,
        description: pkg.description,
        duration_minutes: pkg.duration_minutes,
        organization_id: orgId,
      })
    } catch (e) {
      console.error('[signup] package seed failed', pkg.name, e)
    }
  }

  for (const supply of DEFAULT_SUPPLIES) {
    try {
      await pb.collection('supplies').create({ ...supply, organization_id: orgId })
    } catch (e) {
      console.error('[signup] supply seed failed', supply.name, e)
    }
  }
}

const INTERNAL_ORG_SLUG = (process.env.PLATFORM_ADMIN_ORG_SLUG ?? 'rinse-hq-internal').trim()

async function findOrCreateInternalOrg(pb: Awaited<ReturnType<typeof authenticateServerAdmin>>) {
  const byFlag = await pb.collection('organizations').getFullList<PbRecord>({
    filter: 'is_platform_internal = true',
    limit: 1,
  })
  if (byFlag.length > 0) return byFlag[0]

  const escaped = escapeFilterValue(INTERNAL_ORG_SLUG)
  const bySlug = await pb.collection('organizations').getFullList<PbRecord>({
    filter: `slug = "${escaped}"`,
    limit: 1,
  })
  if (bySlug.length > 0) {
    return pb.collection('organizations').update<PbRecord>(bySlug[0].id, {
      is_platform_internal: true,
      name: 'Rinse HQ',
      booking_enabled: false,
      subscription_status: 'active',
      plan: 'founding',
      founding_member: true,
    })
  }

  return pb.collection('organizations').create<PbRecord>({
    name: 'Rinse HQ',
    slug: INTERNAL_ORG_SLUG,
    is_platform_internal: true,
    plan: 'founding',
    founding_member: true,
    booking_enabled: false,
    subscription_status: 'active',
  })
}

async function ensureMinimalInternalAppSettings(
  pb: Awaited<ReturnType<typeof authenticateServerAdmin>>,
  orgId: string,
  email: string,
) {
  const existing = await pb.collection('app_settings').getFullList<PbRecord>({
    filter: `organization_id = "${escapeFilterValue(orgId)}"`,
    limit: 1,
  })
  const completedAt = new Date().toISOString()
  const payload = {
    business_name: 'Rinse HQ',
    business_email: email,
    onboarding_step: 4,
    onboarding_completed_at: completedAt,
  }
  if (existing.length > 0) {
    await pb.collection('app_settings').update(existing[0].id, payload)
    return
  }
  await pb.collection('app_settings').create({
    organization_id: orgId,
    ...payload,
  })
}

async function provisionPlatformAdminUser(
  pb: Awaited<ReturnType<typeof authenticateServerAdmin>>,
  userId: string,
  email: string,
) {
  const user = await pb.collection('users').getOne<PbRecord>(userId)
  const existingOrgId = String(user.organization_id ?? '').trim()
  if (existingOrgId) {
    const org = await pb.collection('organizations').getOne<PbRecord>(existingOrgId)
    return {
      organizationId: existingOrgId,
      slug: String(org.slug ?? INTERNAL_ORG_SLUG),
      alreadyProvisioned: true,
    }
  }

  const org = await findOrCreateInternalOrg(pb)
  await ensureMinimalInternalAppSettings(pb, org.id, email)
  await pb.collection('users').update(userId, { organization_id: org.id, verified: true })

  return {
    organizationId: String(org.id),
    slug: String(org.slug ?? INTERNAL_ORG_SLUG),
    alreadyProvisioned: false,
  }
}

export async function provisionOrganizationForOAuthUser(input: OAuthProvisionInput) {
  const email = input.email.trim().toLowerCase()
  const businessName =
    input.businessName?.trim() || email.split('@')[0]?.replace(/[._+]/g, ' ') || 'My Detailing'

  if (!input.userId || !email) {
    throw new Error('Valid user required')
  }

  const pb = await authenticateServerAdmin()

  if (isPlatformAdminEmail(email)) {
    return provisionPlatformAdminUser(pb, input.userId, email)
  }

  const user = await pb.collection('users').getOne<PbRecord>(input.userId)
  const existingOrgId = String(user.organization_id ?? '').trim()
  if (existingOrgId) {
    return {
      organizationId: existingOrgId,
      slug: String((await pb.collection('organizations').getOne(existingOrgId)).slug ?? ''),
      alreadyProvisioned: true,
    }
  }

  const slug = await uniqueSlug(pb, businessName)
  const org = await pb.collection('organizations').create<PbRecord>({
    name: businessName,
    slug,
    plan: 'starter',
    founding_member: false,
    booking_enabled: true,
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  })

  await seedOrganizationData(pb, org.id, businessName, email)

  // OAuth2 providers (Google/Apple) already verify the email address, so
  // these accounts skip the email/password verify-by-link flow.
  await pb.collection('users').update(input.userId, {
    organization_id: org.id,
    verified: true,
  })

  void logPlatformEvent('org_created', {
    organizationId: String(org.id),
    actorEmail: email,
    detail: `${businessName} (/${String(org.slug)})`,
    metadata: { source: 'oauth', slug: String(org.slug) },
  })

  return {
    organizationId: String(org.id),
    slug: String(org.slug),
    alreadyProvisioned: false,
  }
}

export async function registerOrganization(input: SignupInput) {
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const businessName = input.businessName.trim()

  if (!email || !password || password.length < 8) {
    throw new Error('Valid email and password (8+ characters) required')
  }
  if (!businessName) throw new Error('Business name is required')
  if (isPlatformAdminEmail(email)) {
    throw new Error('This email is reserved for platform admin. Sign in at /auth/admin instead.')
  }

  const pb = await authenticateServerAdmin()
  const slug = await uniqueSlug(pb, input.slug?.trim() || businessName)

  const org = await pb.collection('organizations').create<PbRecord>({
    name: businessName,
    slug,
    plan: 'starter',
    founding_member: false,
    booking_enabled: true,
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  })

  // Not verified yet — the user must click the link in the verification
  // email before rinse-desk lets them past the auth gate.
  const user = await pb.collection('users').create<PbRecord>({
    email,
    password,
    passwordConfirm: password,
    organization_id: org.id,
    verified: false,
  })

  await seedOrganizationData(pb, org.id, businessName, email)

  let verificationEmailSent = true
  try {
    await pb.collection('users').requestVerification(email)
  } catch (e) {
    verificationEmailSent = false
    console.error('[signup] requestVerification failed', e)
  }

  void logPlatformEvent('org_created', {
    organizationId: String(org.id),
    actorEmail: email,
    detail: `${businessName} (/${String(org.slug)})`,
    metadata: { source: 'email_signup', slug: String(org.slug) },
  })

  return {
    organizationId: String(org.id),
    slug: String(org.slug),
    userId: String(user.id),
    email,
    verificationEmailSent,
  }
}
