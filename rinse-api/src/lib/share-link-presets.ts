import type { PortalScope } from './portal-client'

export type ShareLinkContext = 'quote' | 'appointment' | 'invoice' | 'full' | 'photos'

export interface ShareLinkPreset {
  scope: PortalScope
  sectionTitle: string
  emailSubject: (args: { businessName: string; quoteNumber?: string; invoiceNumber?: string }) => string
  emailMessage: string
  primaryActionLabel: string
}

export const SHARE_LINK_PRESETS: Record<ShareLinkContext, ShareLinkPreset> = {
  quote: {
    scope: 'quote',
    sectionTitle: 'Send estimate to customer',
    emailSubject: ({ businessName, quoteNumber }) =>
      `Estimate ${quoteNumber ?? ''} from ${businessName}`.trim(),
    emailMessage: 'Review and accept your estimate using the secure link below.',
    primaryActionLabel: 'Email estimate',
  },
  appointment: {
    scope: 'job',
    sectionTitle: 'Confirm appointment',
    emailSubject: ({ businessName }) => `Your appointment with ${businessName}`,
    emailMessage: 'View your scheduled appointment details using the secure link below.',
    primaryActionLabel: 'Email confirmation',
  },
  invoice: {
    scope: 'invoice',
    sectionTitle: 'Send invoice',
    emailSubject: ({ businessName, invoiceNumber }) =>
      `Invoice ${invoiceNumber ?? ''} from ${businessName}`.trim(),
    emailMessage: 'View and pay your invoice using the secure link below.',
    primaryActionLabel: 'Email invoice',
  },
  full: {
    scope: 'full',
    sectionTitle: 'Client portal',
    emailSubject: ({ businessName }) => `Your service details from ${businessName}`,
    emailMessage: 'View your service details, invoice, and photos using the secure link below.',
    primaryActionLabel: 'Email portal link',
  },
  photos: {
    scope: 'photos',
    sectionTitle: 'Share photos',
    emailSubject: ({ businessName }) => `Your photos from ${businessName}`,
    emailMessage: 'View your before and after photos using the secure link below.',
    primaryActionLabel: 'Email photos',
  },
}
