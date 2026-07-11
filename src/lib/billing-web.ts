import { Alert, Linking, Platform } from 'react-native'
import { appOrigin } from './org-slug'
import { openNativeSubscriptionManagement } from './iap-purchase'
import type { OrgSubscription } from './subscription-types'

export function billingSettingsUrl(): string {
  return `${appOrigin()}/settings/billing`
}

/** Open web billing settings (Stripe manage / subscribe on rinsehq.com). */
export function openBillingSettings(): void {
  const url = billingSettingsUrl()
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  Alert.alert('Open rinsehq.com?', 'Manage your Rinse plan in the browser.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open', onPress: () => void Linking.openURL(url) },
  ])
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
        'Open Settings → Apple ID → Subscriptions to change or cancel your plan.',
      )
    })
    return
  }

  openBillingSettings()
}
