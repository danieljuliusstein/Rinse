'use client'

import { Clock, X } from '@phosphor-icons/react'
import { usePaywallGateContext } from '@/providers/PaywallGateProvider'

interface TrialExpiryBannerProps {
  daysLeft: number
  onDismiss?: () => void
}

export default function TrialExpiryBanner({ daysLeft, onDismiss }: TrialExpiryBannerProps) {
  const { openPaywall } = usePaywallGateContext()
  const urgent = daysLeft <= 3

  return (
    <div className={`trial-banner${urgent ? ' trial-banner--urgent' : ''}`} role="status">
      <Clock size={18} weight="duotone" className="trial-banner__icon" aria-hidden="true" />
      <button
        type="button"
        className="trial-banner__body"
        onClick={() => openPaywall({ mode: 'nudge' })}
      >
        <strong>
          {daysLeft === 0 ? 'Trial ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in trial`}
        </strong>
        <span>Subscribe to keep access to jobs, invoices, and booking.</span>
      </button>
      {onDismiss ? (
        <button type="button" className="trial-banner__dismiss" onClick={onDismiss} aria-label="Dismiss">
          <X size={16} weight="bold" />
        </button>
      ) : null}
    </div>
  )
}
