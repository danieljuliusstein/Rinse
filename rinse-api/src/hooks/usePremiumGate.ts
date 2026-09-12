'use client'

import { useCallback } from 'react'
import { usePaywallGateContext } from '@/providers/PaywallGateProvider'
import { PREMIUM_ACTION_LABELS, type PremiumAction } from '@/lib/subscription-gates'

export function usePremiumGate(action: PremiumAction) {
  const { runGated: runGatedContext, subscriptionMode, openPaywall } = usePaywallGateContext()
  const featureLabel = PREMIUM_ACTION_LABELS[action]

  const runGated = useCallback(
    (callback: () => void) => runGatedContext(action, callback),
    [action, runGatedContext]
  )

  return {
    action,
    featureLabel,
    subscriptionMode,
    isPremiumLocked: subscriptionMode === 'lapsed',
    openPaywall,
    runGated,
  }
}

/** @deprecated Prefer `usePremiumGate(action)` with a specific PremiumAction. */
export function usePaywallGate(featureLabel = 'This feature') {
  const gate = usePremiumGate('send_invoice')
  return {
    gated: gate.subscriptionMode === 'lapsed',
    paywallOpen: false,
    setPaywallOpen: () => {},
    featureLabel,
    runGated: gate.runGated,
  }
}
