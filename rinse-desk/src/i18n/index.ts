import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  DOCUMENT_LOCALES,
  isRtlDocumentLocale,
  normalizeDocumentLocale,
  type DocumentLocale,
} from '@rinse/core'
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

const STORAGE_KEY = 'rinse_desk_locale'

export function getInitialDeskLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return normalizeDocumentLocale(stored)
  const navLang = navigator.language?.split('-')[0]
  return normalizeDocumentLocale(navLang)
}

export function setDeskAppLanguage(locale: AppLocale) {
  const norm = normalizeDocumentLocale(locale)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, norm)
    document.documentElement.dir = isRtlDocumentLocale(norm) ? 'rtl' : 'ltr'
    document.documentElement.lang = norm
  }
  return i18n.changeLanguage(norm)
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

const initialLocale = getInitialDeskLocale()

if (typeof document !== 'undefined') {
  document.documentElement.dir = isRtlDocumentLocale(initialLocale) ? 'rtl' : 'ltr'
  document.documentElement.lang = initialLocale
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
