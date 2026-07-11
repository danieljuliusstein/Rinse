/**
 * App Store product IDs — must match App Store Connect auto-renewable subscription.
 * Override with EXPO_PUBLIC_IAP_STARTER_PRODUCT_ID when the ASC SKU differs.
 */
export const IAP_STARTER_PRODUCT_ID =
  process.env.EXPO_PUBLIC_IAP_STARTER_PRODUCT_ID?.trim() || 'com.rinse.mobile.starter.monthly'

export const IAP_SUBSCRIPTION_SKUS = [IAP_STARTER_PRODUCT_ID] as const
