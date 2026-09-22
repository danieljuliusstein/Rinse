import { appApiJson } from './app-api'
import { Alert, Linking, Platform } from 'react-native'
import { openNativeSubscriptionManagement } from './iap-purchase'
import type { OrgSubscription } from './subscription-types'

/** Open the authenticated Stripe management session, never a retired PWA route. */
export function openBillingSettings(): void {
  if (Platform.OS === 'ios') { Alert.alert('Web subscription', 'Manage or cancel this subscription in Rinse Desk → Settings → Account → Billing.'); return }
  void appApiJson<{ url: string }>('/api/billing/portal', { method: 'POST' }).then(data => Linking.openURL(data.url)).catch(e => Alert.alert('Billing', e.message))
}

/**
 * Manage an active subscription on the correct store.
 * Apple-billed orgs → App Store subscriptions; otherwise Stripe web portal.
 */
export function openManageSubscription(org: OrgSubscription | null): void {
  const appleBilled =
    org?.billing_provider === 'apple' || Boolean(org?.apple_original_transaction_id?.trim())

  if (Platform.OS === 'ios' && appleBilled) {
    void openNativeSubscriptionManagement().catch(() => {
      Alert.alert(
        'Manage in Settings',
        'Open Settings → Apple ID → Subscriptions to change or cancel. You keep access until the period ends, then Free — no further charges.',
      )
    })
    return
  }

  openBillingSettings()
}
