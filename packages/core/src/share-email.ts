import {
  normalizeDocumentLocale,
  type DocumentLocale,
} from './document-locales'
import { getDocumentStrings } from './document-i18n'

export type ShareEmailKind = 'quote' | 'appointment' | 'invoice' | 'full' | 'photos'

type ShareEmailCopy = {
  subject: (args: {
    businessName: string
    quoteNumber?: string
    invoiceNumber?: string
  }) => string
  bodyIntro: string
}

/** Customer-facing share email copy — EN/ES first; other locales fall back to EN. */
const SHARE_EMAIL_ES: Record<ShareEmailKind, ShareEmailCopy> = {
  quote: {
    subject: ({ businessName, quoteNumber }) =>
      `${getDocumentStrings('es').estimate} ${quoteNumber ?? ''} de ${businessName}`.trim(),
    bodyIntro: 'Revise y acepte su cotización con el enlace seguro a continuación.',
  },
  appointment: {
    subject: ({ businessName }) => `Su cita con ${businessName}`,
    bodyIntro: 'Vea los detalles de su cita con el enlace seguro a continuación.',
  },
  invoice: {
    subject: ({ businessName, invoiceNumber }) =>
      `${getDocumentStrings('es').invoice} ${invoiceNumber ?? ''} de ${businessName}`.trim(),
    bodyIntro: 'Vea y pague su factura con el enlace seguro a continuación.',
  },
  full: {
    subject: ({ businessName }) => `Detalles de su servicio de ${businessName}`,
    bodyIntro: 'Vea su servicio, factura y fotos con el enlace seguro a continuación.',
  },
  photos: {
    subject: ({ businessName }) => `Sus fotos de ${businessName}`,
    bodyIntro: 'Vea sus fotos de antes y después con el enlace seguro a continuación.',
  },
}

const SHARE_EMAIL_EN: Record<ShareEmailKind, ShareEmailCopy> = {
  quote: {
    subject: ({ businessName, quoteNumber }) =>
      `${getDocumentStrings('en').estimate} ${quoteNumber ?? ''} from ${businessName}`.trim(),
    bodyIntro: 'Review and accept your estimate using the secure link below.',
  },
  appointment: {
    subject: ({ businessName }) => `Your appointment with ${businessName}`,
    bodyIntro: 'View your scheduled appointment details using the secure link below.',
  },
  invoice: {
    subject: ({ businessName, invoiceNumber }) =>
      `${getDocumentStrings('en').invoice} ${invoiceNumber ?? ''} from ${businessName}`.trim(),
    bodyIntro: 'View and pay your invoice using the secure link below.',
  },
  full: {
    subject: ({ businessName }) => `Your service details from ${businessName}`,
    bodyIntro: 'View your service details, invoice, and photos using the secure link below.',
  },
  photos: {
    subject: ({ businessName }) => `Your photos from ${businessName}`,
    bodyIntro: 'View your before and after photos using the secure link below.',
  },
}

export function getShareEmailCopy(
  kind: ShareEmailKind,
  locale: DocumentLocale | string | undefined = 'en',
): ShareEmailCopy {
  const normalized = normalizeDocumentLocale(locale)
  if (normalized === 'es') return SHARE_EMAIL_ES[kind]
  return SHARE_EMAIL_EN[kind]
}

export function formatShareEmailBody(intro: string, link: string): string {
  return `${intro}\n\n${link}`
}
