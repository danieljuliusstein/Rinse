import { Alert, Platform } from 'react-native'
import { appApiJson } from './app-api'
import { startBillingCheckout } from './billing-checkout'
import { IAP_STARTER_PRODUCT_ID, IAP_SUBSCRIPTION_SKUS } from './iap-products'
import { clearOrgSubscriptionCache } from './subscription-fetch'

export class IapPurchaseError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'IapPurchaseError'
  }
}

type ConfirmResult = {
  ok: boolean
  plan: string
  subscription_status: string
  current_period_end: string | null
}

async function confirmApplePurchase(signedTransaction: string): Promise<ConfirmResult> {
  return appApiJson<ConfirmResult>('/api/billing/apple/confirm', {
    method: 'POST',
    body: JSON.stringify({ signedTransaction }),
  })
}

/**
 * Start Starter upgrade.
 * iOS → StoreKit via expo-iap + server confirm.
 * Web / Android → existing Stripe Checkout (Play Billing later).
 */
export async function startStarterUpgrade(): Promise<'apple' | 'stripe'> {
  if (Platform.OS !== 'ios') {
    if (Platform.OS === 'android') throw new IapPurchaseError('Android subscriptions are not available yet.')
    await startBillingCheckout('starter')
    return 'stripe'
  }

    const offer = await appApiJson<{ productId: string; appAccountToken: string }>('/api/billing/apple/prepare', { method: 'POST' })
    const {
      initConnection,
      endConnection,
      fetchProducts,
      requestPurchase,
      finishTransaction,
      purchaseUpdatedListener,
      purchaseErrorListener,
      ErrorCode,
    } = await import('expo-iap')

    await initConnection()

    try {
      const products = await fetchProducts({ skus: [offer.productId], type: 'subs' })
      if (!products?.length) {
        throw new IapPurchaseError(
          'Starter subscription is not available in the App Store yet. Try again after the product is approved.',
          'sku_missing',
        )
      }

      const approved = await new Promise<boolean>(resolve => Alert.alert('Subscribe to Starter', `${products[0].displayPrice} per month. Renews automatically until canceled. Includes all Starter features.`, [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) }, { text: 'Continue', onPress: () => resolve(true) }], { cancelable: false }))
      if (!approved) throw new IapPurchaseError('Purchase cancelled', 'cancelled')
      const purchase = await new Promise<import('expo-iap').Purchase>((resolve, reject) => {
        const successSub = purchaseUpdatedListener((p) => {
          if (p.productId !== offer.productId) return
          cleanup()
          resolve(p)
        })
        const errorSub = purchaseErrorListener((err) => {
          cleanup()
          reject(err)
        })

        function cleanup() {
          successSub.remove()
          errorSub.remove()
        }

        void requestPurchase({
          request: {
            apple: { sku: offer.productId, appAccountToken: offer.appAccountToken },
            google: { skus: [IAP_STARTER_PRODUCT_ID] },
          },
          type: 'subs',
        }).catch((err: unknown) => {
          cleanup()
          reject(err)
        })
      })

      const signedTransaction =
        typeof purchase.purchaseToken === 'string' ? purchase.purchaseToken.trim() : ''
      if (!signedTransaction) {
        throw new IapPurchaseError('Missing App Store transaction token', 'missing_token')
      }

      await confirmApplePurchase(signedTransaction)
      await finishTransaction({ purchase, isConsumable: false })
      clearOrgSubscriptionCache()
      // Soft product funnel only — entitlement truth is server platform_events + org fields.
      const { trackProductEvent } = await import('./telemetry')
      trackProductEvent('iap_starter_purchased', { product_id: IAP_STARTER_PRODUCT_ID })
      return 'apple'
    } catch (e) {
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code?: string }).code) : undefined
      if (code === ErrorCode.UserCancelled || code === 'user-cancelled') {
        throw new IapPurchaseError('Purchase cancelled', 'cancelled')
      }
      if (e instanceof IapPurchaseError) throw e
      const message = e instanceof Error ? e.message : 'Purchase failed'
      throw new IapPurchaseError(message, code)
    } finally {
      try {
        await endConnection()
      } catch {
        // ignore
      }
    }
}

/** Restore App Store purchases and re-bind entitlement to the signed-in org. */
export async function restoreApplePurchases(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false

  const {
    initConnection,
    endConnection,
    getAvailablePurchases,
    finishTransaction,
    restorePurchases,
  } = await import('expo-iap')

  await initConnection()
  try {
    await restorePurchases()
    const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })
    const starter = (purchases ?? []).find((p) => (IAP_SUBSCRIPTION_SKUS as readonly string[]).includes(p.productId))
    if (!starter?.purchaseToken) return false

    await confirmApplePurchase(starter.purchaseToken)
    await finishTransaction({ purchase: starter, isConsumable: false })
    clearOrgSubscriptionCache()
    return true
  } finally {
    try {
      await endConnection()
    } catch {
      // ignore
    }
  }
}

export async function openNativeSubscriptionManagement(): Promise<void> {
  if (Platform.OS !== 'ios') return
  const { deepLinkToSubscriptions } = await import('expo-iap')
  await deepLinkToSubscriptions({})
}
