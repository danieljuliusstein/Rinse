import type { DocumentLocale } from '@rinse/core'
import { getShareEmailCopy, type ShareEmailKind } from '@rinse/core'
import type { PortalScope } from './share'

export type ShareLinkContext = ShareEmailKind

export interface ShareLinkPreset {
  scope: PortalScope
  sectionTitle: string
  /** Localized subject/body from document_locale. */
  emailSubject: (args: {
    businessName: string
    quoteNumber?: string
    invoiceNumber?: string
    locale?: DocumentLocale | string
  }) => string
  emailMessage: (locale?: DocumentLocale | string) => string
  primaryActionLabel: string
  /** Invoice / photos / full portal sends require before+after when a job is linked. */
  requiresTransformation: boolean
}

function preset(
  kind: ShareEmailKind,
  scope: PortalScope,
  sectionTitle: string,
  primaryActionLabel: string,
  requiresTransformation: boolean,
): ShareLinkPreset {
  return {
    scope,
    sectionTitle,
    primaryActionLabel,
    requiresTransformation,
    emailSubject: ({ businessName, quoteNumber, invoiceNumber, locale }) =>
      getShareEmailCopy(kind, locale).subject({ businessName, quoteNumber, invoiceNumber }),
    emailMessage: (locale) => getShareEmailCopy(kind, locale).bodyIntro,
  }
}

export const SHARE_LINK_PRESETS: Record<ShareLinkContext, ShareLinkPreset> = {
  quote: preset('quote', 'quote', 'Send estimate to customer', 'Email estimate', false),
  appointment: preset('appointment', 'job', 'Confirm appointment', 'Email confirmation', false),
  invoice: preset('invoice', 'invoice', 'Send invoice', 'Email invoice', true),
  full: preset('full', 'full', 'Client portal', 'Email portal link', true),
  photos: preset('photos', 'photos', 'Share photos', 'Email photos', true),
}
