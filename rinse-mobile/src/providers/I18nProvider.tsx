import { useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { hydrateAppLocale, normalizeAppLocale } from '@/src/i18n'
import { loadSettings } from '@/src/lib/settings-store'
import { isOnline } from '@/src/lib/network'

/**
 * Wraps the tree with react-i18next and hydrates the saved / org language.
 * Language changes via setAppLocale() re-render all useTranslation() consumers.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        let fromSettings: string | null = null
        if (await isOnline()) {
          try {
            const settings = await loadSettings()
            fromSettings = settings.document_locale ?? null
          } catch {
            // ignore — fall back to secure storage / device
          }
        }
        if (!cancelled) {
          await hydrateAppLocale(fromSettings ? normalizeAppLocale(fromSettings) : null)
        }
      } catch {
        // keep device default from sync init
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
