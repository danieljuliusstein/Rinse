import type { OrgSubscription } from './subscription-types'
import type { PremiumAction } from './subscription-gates'
import { isTrialNudgeDismissed, resolveGate, type GateResolution } from './subscription-gates'
import { dispatchPremiumRequired } from './premium-events'
import { fetchOrgSubscription, clearOrgSubscriptionCache, isOfflineWritesEnabled } from './subscription-fetch'
import { trackProductEvent } from './telemetry'

export type { OrgSubscription, PremiumAction, GateResolution }
export { clearOrgSubscriptionCache, isOfflineWritesEnabled, fetchOrgSubscription }

export async function checkPremiumGate(
  action: PremiumAction,
  options?: { now?: Date },
): Promise<GateResolution> {
  const org = await fetchOrgSubscription()
  const result = resolveGate(org, false, action, {
    ...options,
    nudgeDismissed: isTrialNudgeDismissed(action),
  })

  if (!result.allowed && result.showPaywall) {
    const mode =
      result.reason === 'nudge' ? 'nudge' : result.reason === 'free' ? 'free' : 'lapsed'
    trackProductEvent('premium_gate_blocked', {
      action,
      mode,
      feature_label: result.featureLabel ?? null,
    })
    dispatchPremiumRequired({
      action,
      featureLabel: result.featureLabel,
      mode,
    })
  }

  return result
}
