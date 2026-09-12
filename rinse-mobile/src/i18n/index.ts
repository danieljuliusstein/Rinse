import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import {
  DOCUMENT_LOCALES,
  documentLocaleFromLanguageTag,
  intlLocaleForDocument,
  isDocumentLocale,
  isRtlDocumentLocale,
  normalizeDocumentLocale,
  type DocumentLocale,
} from '@rinse/core'
import { getSecureItem, setSecureItem } from '@/src/lib/secure-storage'
import ar from './locales/ar.json'
import bn from './locales/bn.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import hi from './locales/hi.json'
import id from './locales/id.json'
import it from './locales/it.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import tr from './locales/tr.json'
import ur from './locales/ur.json'
import vi from './locales/vi.json'
import zh from './locales/zh.json'

export type AppLocale = DocumentLocale

export const APP_LOCALES = DOCUMENT_LOCALES

const STORAGE_KEY = 'rinse_app_locale'

export function normalizeAppLocale(raw: unknown): AppLocale {
  return normalizeDocumentLocale(raw)
}

export function deviceAppLocale(): AppLocale {
  try {
    const tag = Localization.getLocales()[0]?.languageTag
      ?? Localization.getLocales()[0]?.languageCode
    return documentLocaleFromLanguageTag(tag)
  } catch {
    return 'en'
  }
}

export function localeDisplayName(locale: AppLocale): string {
  return DOCUMENT_LOCALES.find((l) => l.value === locale)?.label ?? locale
}

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  hi: { translation: hi },
  es: { translation: es },
  fr: { translation: fr },
  ar: { translation: ar },
  bn: { translation: bn },
  pt: { translation: pt },
  ru: { translation: ru },
  ur: { translation: ur },
  id: { translation: id },
  de: { translation: de },
  ja: { translation: ja },
  tr: { translation: tr },
  ko: { translation: ko },
  it: { translation: it },
  vi: { translation: vi },
}

let hydrated = false

/** Sync init so first paint has a language; hydrateAppLocale() refinines from storage/settings. */
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: deviceAppLocale(),
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
    returnNull: false,
  })
}

export function getAppLocale(): AppLocale {
  return normalizeAppLocale(i18n.language)
}

export async function hydrateAppLocale(preferred?: AppLocale | null): Promise<AppLocale> {
  let next: AppLocale | null = preferred ? normalizeAppLocale(preferred) : null
  if (!next) {
    const stored = await getSecureItem(STORAGE_KEY)
    if (isDocumentLocale(stored)) next = stored
  }
  if (!next) next = deviceAppLocale()

  if (i18n.language !== next) {
    await i18n.changeLanguage(next)
  }
  hydrated = true
  return next
}

export async function setAppLocale(locale: AppLocale): Promise<void> {
  const next = normalizeAppLocale(locale)
  await i18n.changeLanguage(next)
  await setSecureItem(STORAGE_KEY, next)
  try {
    const { saveSettings } = await import('@/src/lib/settings-store')
    await saveSettings({ document_locale: next })
  } catch {
    // Settings sync is best-effort when offline / signed out
  }
}

export function isI18nHydrated(): boolean {
  return hydrated
}

export function appIntlLocale(): string {
  return intlLocaleForDocument(getAppLocale())
}

export { isRtlDocumentLocale }

export default i18n
