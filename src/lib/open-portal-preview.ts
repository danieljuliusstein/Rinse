import * as WebBrowser from 'expo-web-browser'
import { Alert, Platform } from 'react-native'
import { appOrigin } from '@/src/lib/org-slug'

/** Portal links from a local API use localhost — preview should hit the public app host. */
export function resolvePortalPreviewUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  try {
    const parsed = new URL(trimmed)
    if (!/^\/portal(\/|$)/.test(parsed.pathname)) return trimmed
    if (!/localhost|127\.0\.0\.1/i.test(parsed.host)) return trimmed

    const origin = appOrigin()
    return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return trimmed
  }
}

/** Operator preview of the client portal — dismissible app chrome, not in-page portal JS. */
export async function openPortalPreview(url: string): Promise<void> {
  const trimmed = url.trim()
  if (!trimmed) return

  const previewUrl = resolvePortalPreviewUrl(trimmed)

  // #region agent log
  fetch('http://127.0.0.1:7700/ingest/0611bb84-3a92-47a8-a350-9aa3a3c3a3cc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '18bb49' },
    body: JSON.stringify({
      sessionId: '18bb49',
      runId: 'post-fix-v1',
      hypothesisId: 'A',
      location: 'open-portal-preview.ts:openPortalPreview',
      message: 'open portal preview',
      data: {
        platform: Platform.OS,
        originalHost: (() => {
          try {
            return new URL(trimmed).host
          } catch {
            return 'invalid'
          }
        })(),
        previewHost: (() => {
          try {
            return new URL(previewUrl).host
          } catch {
            return 'invalid'
          }
        })(),
        rewritten: previewUrl !== trimmed,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  if (Platform.OS === 'web') {
    const opened = typeof window !== 'undefined' ? window.open(previewUrl, '_blank', 'noopener,noreferrer') : null
    // #region agent log
    fetch('http://127.0.0.1:7700/ingest/0611bb84-3a92-47a8-a350-9aa3a3c3a3cc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '18bb49' },
      body: JSON.stringify({
        sessionId: '18bb49',
        runId: 'post-fix-v1',
        hypothesisId: 'C',
        location: 'open-portal-preview.ts:webOpen',
        message: 'web new-tab preview',
        data: { opened: Boolean(opened), previewHost: (() => { try { return new URL(previewUrl).host } catch { return 'invalid' } })() },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    if (!opened) {
      Alert.alert(
        'Popup blocked',
        'Allow popups for this site to preview the portal, or copy the link and open it in a new tab.',
      )
    }
    return
  }

  try {
    const result = await WebBrowser.openBrowserAsync(previewUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      enableBarCollapsing: true,
      controlsColor: '#22c55e',
    })
    // #region agent log
    fetch('http://127.0.0.1:7700/ingest/0611bb84-3a92-47a8-a350-9aa3a3c3a3cc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '18bb49' },
      body: JSON.stringify({
        sessionId: '18bb49',
        runId: 'post-fix-v1',
        hypothesisId: 'B',
        location: 'open-portal-preview.ts:nativeBrowserClosed',
        message: 'native in-app browser returned',
        data: { type: result.type },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  } catch (e) {
    Alert.alert(
      'Could not open preview',
      e instanceof Error ? e.message : 'Check your connection and try again.',
    )
  }
}
