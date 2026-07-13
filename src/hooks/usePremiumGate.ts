import { useCallback } from 'react'
import { usePaywallGateContext } from '@/src/providers/PaywallGateProvider'
import { PREMIUM_ACTION_LABELS, type PremiumAction } from '@/src/lib/subscription-gates'

export function usePremiumGate(action: PremiumAction) {
  const { runGated: runGatedContext, subscriptionMode, openPaywall } = usePaywallGateContext()
  const featureLabel = PREMIUM_ACTION_LABELS[action]

  const runGated = useCallback(
    (callback: () => void) => runGatedContext(action, callback),
    [action, runGatedContext],
  )

  return {
    action,
    featureLabel,
    subscriptionMode,
    isPremiumLocked: subscriptionMode === 'lapsed' || subscriptionMode === 'vault',
    openPaywall,
    runGated,
  }
}
