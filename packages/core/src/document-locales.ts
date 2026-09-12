/** App + customer-document locales (most spoken / globally common). */
export const DOCUMENT_LOCALE_CODES = [
  'en',
  'zh',
  'hi',
  'es',
  'fr',
  'ar',
  'bn',
  'pt',
  'ru',
  'ur',
  'id',
  'de',
  'ja',
  'tr',
  'ko',
  'it',
  'vi',
] as const

export type DocumentLocale = (typeof DOCUMENT_LOCALE_CODES)[number]

export type DocumentLocaleOption = {
  value: DocumentLocale
  /** Native autonym for pickers (e.g. Español, 中文). */
  label: string
  /** English name for search / accessibility. */
  englishLabel: string
}

export const DOCUMENT_LOCALES: DocumentLocaleOption[] = [
  { value: 'en', label: 'English', englishLabel: 'English' },
  { value: 'zh', label: '中文', englishLabel: 'Chinese' },
  { value: 'hi', label: 'हिन्दी', englishLabel: 'Hindi' },
  { value: 'es', label: 'Español', englishLabel: 'Spanish' },
  { value: 'fr', label: 'Français', englishLabel: 'French' },
  { value: 'ar', label: 'العربية', englishLabel: 'Arabic' },
  { value: 'bn', label: 'বাংলা', englishLabel: 'Bengali' },
  { value: 'pt', label: 'Português', englishLabel: 'Portuguese' },
  { value: 'ru', label: 'Русский', englishLabel: 'Russian' },
  { value: 'ur', label: 'اردو', englishLabel: 'Urdu' },
  { value: 'id', label: 'Bahasa Indonesia', englishLabel: 'Indonesian' },
  { value: 'de', label: 'Deutsch', englishLabel: 'German' },
  { value: 'ja', label: '日本語', englishLabel: 'Japanese' },
  { value: 'tr', label: 'Türkçe', englishLabel: 'Turkish' },
  { value: 'ko', label: '한국어', englishLabel: 'Korean' },
  { value: 'it', label: 'Italiano', englishLabel: 'Italian' },
  { value: 'vi', label: 'Tiếng Việt', englishLabel: 'Vietnamese' },
]

const LOCALE_SET = new Set<string>(DOCUMENT_LOCALE_CODES)

export function isDocumentLocale(raw: unknown): raw is DocumentLocale {
  return typeof raw === 'string' && LOCALE_SET.has(raw)
}

export function normalizeDocumentLocale(raw: unknown): DocumentLocale {
  if (typeof raw !== 'string') return 'en'
  const code = raw.trim().toLowerCase().slice(0, 2)
  return isDocumentLocale(code) ? code : 'en'
}

/** Map device / BCP-47 language tags onto a supported app locale. */
export function documentLocaleFromLanguageTag(tag: string | null | undefined): DocumentLocale {
  if (!tag) return 'en'
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0] ?? ''
  // zh-Hans / zh-Hant → zh; pt-BR / pt-PT → pt
  return isDocumentLocale(primary) ? primary : 'en'
}

const INTL_BY_LOCALE: Record<DocumentLocale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  hi: 'hi-IN',
  es: 'es-US',
  fr: 'fr-FR',
  ar: 'ar-SA',
  bn: 'bn-BD',
  pt: 'pt-BR',
  ru: 'ru-RU',
  ur: 'ur-PK',
  id: 'id-ID',
  de: 'de-DE',
  ja: 'ja-JP',
  tr: 'tr-TR',
  ko: 'ko-KR',
  it: 'it-IT',
  vi: 'vi-VN',
}

export function intlLocaleForDocument(locale: DocumentLocale): string {
  return INTL_BY_LOCALE[normalizeDocumentLocale(locale)]
}

export function isRtlDocumentLocale(locale: DocumentLocale): boolean {
  const code = normalizeDocumentLocale(locale)
  return code === 'ar' || code === 'ur'
}
