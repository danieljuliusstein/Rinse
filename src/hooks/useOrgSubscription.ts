'use client'

import { useEffect, useState } from 'react'
import { getPocketBase } from '@/lib/pocketbase'
import { getCurrentOrganizationId } from '@/lib/tenant'
import {
  isFoundingMember,
  isSubscriptionActive,
  trialDaysLeft,
  type OrgSubscription,
} from '@/lib/subscription'

export function useOrgSubscription() {
  const [org, setOrg] = useState<OrgSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const orgId = getCurrentOrganizationId()
        const pb = getPocketBase()
        if (!orgId || !pb?.authStore.isValid) return
        const record = await pb.collection('organizations').getOne(orgId)
        if (cancelled) return
        setOrg({
          plan: String(record.plan ?? 'starter'),
          founding_member: record.founding_member === true,
          subscription_status: String(record.subscription_status ?? 'none'),
          trial_ends_at: record.trial_ends_at ? String(record.trial_ends_at) : undefined,
          current_period_end: record.current_period_end ? String(record.current_period_end) : undefined,
          stripe_customer_id: record.stripe_customer_id ? String(record.stripe_customer_id) : undefined,
        })
      } catch {
        if (!cancelled) setOrg(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const founding = org ? isFoundingMember(org) : false
  const active = org ? isSubscriptionActive(org) : true
  const daysLeft = org ? trialDaysLeft(org) : null
  const subscribed =
    !founding &&
    (org?.subscription_status === 'active' ||
      org?.subscription_status === 'past_due' ||
      Boolean(org?.stripe_customer_id))

  const showTrialBanner =
    !loading &&
    !founding &&
    !subscribed &&
    daysLeft != null &&
    daysLeft <= 7

  return { org, loading, founding, active, daysLeft, subscribed, showTrialBanner }
}
