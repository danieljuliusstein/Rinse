import { NextResponse } from 'next/server'
import type PocketBase from 'pocketbase'
import { isSubscriptionActive, type OrgSubscription } from '../subscription'

export const PREMIUM_REQUIRED_CODE = 'premium_required'

export function premiumRequiredJson(message = 'Active subscription required') {
  return NextResponse.json({ error: message, code: PREMIUM_REQUIRED_CODE }, { status: 402 })
}

export async function loadOrgSubscription(
  pb: PocketBase,
  organizationId: string
): Promise<OrgSubscription | null> {
  try {
    const org = await pb.collection('organizations').getOne(organizationId)
    return {
      plan: String(org.plan ?? ''),
      founding_member: org.founding_member === true,
      subscription_status: String(org.subscription_status ?? 'none'),
      trial_ends_at: org.trial_ends_at ? String(org.trial_ends_at) : undefined,
    }
  } catch {
    return null
  }
}

export async function requirePremiumSubscription(
  pb: PocketBase,
  organizationId: string
): Promise<NextResponse | null> {
  if (!organizationId.trim()) {
    return NextResponse.json({ error: 'Organization required' }, { status: 400 })
  }
  const org = await loadOrgSubscription(pb, organizationId)
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }
  if (!isSubscriptionActive(org)) {
    return premiumRequiredJson()
  }
  return null
}

export const PRO_REQUIRED_CODE = 'pro_required'

export function proRequiredJson(message = 'Pro plan required') {
  return NextResponse.json({ error: message, code: PRO_REQUIRED_CODE }, { status: 402 })
}

export async function requireProPlan(
  pb: PocketBase,
  organizationId: string
): Promise<NextResponse | null> {
  const premiumBlock = await requirePremiumSubscription(pb, organizationId)
  if (premiumBlock) return premiumBlock

  const org = await loadOrgSubscription(pb, organizationId)
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }
  if (org.founding_member || org.plan === 'founding') return null
  if (org.plan !== 'pro') {
    return proRequiredJson()
  }
  return null
}
