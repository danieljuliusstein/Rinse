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
  let depth = 0
  while (nav) {
    const can = nav.canGoBack()
    // #region agent log
    if (typeof fetch !== 'undefined') {
      const origin =
        typeof window !== 'undefined' && window.location?.origin
          ? window.location.origin
          : 'http://127.0.0.1:8081'
      fetch(`${origin}/__agent-debug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
        body: JSON.stringify({
          sessionId: '89a058',
          runId: 'post-fix',
          hypothesisId: 'A',
          location: 'safe-go-back.ts:safeGoBack',
          message: can ? 'navigator canGoBack — popping' : 'navigator cannot goBack — walk parent',
          data: { depth, canGoBack: can, fallbackHref: String(fallbackHref) },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
    }
    // #endregion
    if (can) {
      nav.goBack()
      return
    }
    depth += 1
    nav = typeof nav.getParent === 'function' ? nav.getParent() : undefined
  }
  // #region agent log
  if (typeof fetch !== 'undefined') {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://127.0.0.1:8081'
    fetch(`${origin}/__agent-debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
      body: JSON.stringify({
        sessionId: '89a058',
        runId: 'post-fix',
        hypothesisId: 'A',
        location: 'safe-go-back.ts:safeGoBack',
        message: 'no navigator can goBack — replace fallback',
        data: { depth, fallbackHref: String(fallbackHref) },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }
  // #endregion
  router.replace(fallbackHref)
}

/** Back handler for secondary screens (Tools, Invoices, Pipeline, …). */
export function useSafeBack(fallbackHref: Href = '/(tabs)'): () => void {
  const navigation = useNavigation()
  return useCallback(() => safeGoBack(navigation, fallbackHref), [fallbackHref, navigation])
}
