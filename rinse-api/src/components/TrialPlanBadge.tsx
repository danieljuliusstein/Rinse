'use client'

import { useRouter } from 'next/navigation'
import { useOrgSubscription } from '@/hooks/useOrgSubscription'
import { STARTER_PLAN } from '@/lib/plans'

export default function TrialPlanBadge() {
  const router = useRouter()
  const { org, loading, founding, subscribed, daysLeft } = useOrgSubscription()

  if (loading || founding || subscribed) return null
  if (org?.subscription_status !== 'trialing') return null

  const label =
    daysLeft != null
      ? `Free trial · ${daysLeft}d left`
      : `${STARTER_PLAN.name} trial`

  return (
    <button
      type="button"
      className="trial-plan-badge"
      onClick={() => router.push('/settings/billing')}
      aria-label={`${label}. Open billing settings.`}
    >
      {label}
    </button>
  )
}
