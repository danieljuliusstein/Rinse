'use client'

import { Crown } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import { usePaywallGateContext } from '@/providers/PaywallGateProvider'

export default function SubscriptionLapsedBanner() {
  const { isLoggedIn, subscriptionLapsed, subscriptionLoading } = useAuth()
  const { openPaywall } = usePaywallGateContext()

  if (!isLoggedIn || subscriptionLoading || !subscriptionLapsed) return null

  return (
    <div className="trial-banner trial-banner--urgent subscription-lapsed-banner" role="status">
      <Crown size={18} weight="duotone" className="trial-banner__icon" aria-hidden="true" />
      <button
        type="button"
        className="trial-banner__body"
        onClick={() => openPaywall({ mode: 'lapsed' })}
      >
        <strong>Your trial ended</strong>
        <span>Subscribe to send invoices, quotes, and client links.</span>
      </button>
    </div>
  )
}
