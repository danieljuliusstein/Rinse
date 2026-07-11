import { router, useNavigation, type Href } from 'expo-router'
import { useCallback } from 'react'

type NavLike = {
  canGoBack: () => boolean
  goBack: () => void
  getParent?: () => NavLike | undefined
}

/**
 * Go back when a navigator in the chain can; otherwise replace.
 * Prefer `useNavigation()` from expo-router over `router.canGoBack()` —
 * the latter can be true at the root while the focused stack cannot handle
 * GO_BACK, which logs a development warning.
 *
 * Walks parents so tab screens can pop tab history (`backBehavior="history"`).
 */
export function safeGoBack(navigation: NavLike, fallbackHref: Href = '/(tabs)'): void {
  let nav: NavLike | undefined = navigation
  while (nav) {
    if (nav.canGoBack()) {
      nav.goBack()
      return
    }
    nav = typeof nav.getParent === 'function' ? nav.getParent() : undefined
  }
  router.replace(fallbackHref)
}

/** Back handler for secondary screens (Tools, Invoices, Pipeline, …). */
export function useSafeBack(fallbackHref: Href = '/(tabs)'): () => void {
  const navigation = useNavigation()
  return useCallback(() => safeGoBack(navigation, fallbackHref), [fallbackHref, navigation])
}
