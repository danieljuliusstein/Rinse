export type AppFormation = 'ai' | 'notify' | 'money' | 'sync' | 'escape' | 'later'
export type AppReadiness = 'available' | 'liaison' | 'paper'

export type AppCatalogItem = {
  id: string
  label: string
  /** Simple Icons slug (jsDelivr CDN) */
  slug: string
  /** Official Simple Icons brand hex (no #) */
  color: string
  formation: AppFormation
  readiness: AppReadiness
  /** How this app attaches to Desk CRM spine */
  spineHint: string
  stampSubjectPrefix: string
  liaisonBody: string
  /** Optional product deep-link hint (e.g. Stripe → Money) */
  deepLinkHint?: string
}

/** Landing marquee tools — product surface only; credentials deferred. */
export const APP_CATALOG: readonly AppCatalogItem[] = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    slug: 'openai',
    color: '412991',
    formation: 'ai',
    readiness: 'liaison',
    spineHint: 'Assist after deal, chat, or form events',
    stampSubjectPrefix: '[ChatGPT]',
    liaisonBody: 'Draft AI notes on the contact timeline from automation context. Live model delivery ships in a later credentials plan.',
  },
  {
    id: 'claude',
    label: 'Claude',
    slug: 'anthropic',
    color: 'D4A27F',
    formation: 'ai',
    readiness: 'liaison',
    spineHint: 'Assist after deal, chat, or form events',
    stampSubjectPrefix: '[Claude]',
    liaisonBody: 'Summarize or draft follow-ups as Activity notes. External Claude API access comes with the credentials plan.',
  },
  {
    id: 'slack',
    label: 'Slack',
    slug: 'slack',
    color: '4A154B',
    formation: 'notify',
    readiness: 'liaison',
    spineHint: 'Notify after deal stage, chat, or form submit',
    stampSubjectPrefix: '[Slack]',
    liaisonBody: 'Intended Slack messages are logged as branded Activity notes until workspace OAuth ships.',
  },
  {
    id: 'twilio',
    label: 'Twilio',
    slug: 'twilio',
    color: 'F22F46',
    formation: 'notify',
    readiness: 'liaison',
    spineHint: 'Message after chat or form events',
    stampSubjectPrefix: '[Twilio]',
    liaisonBody: 'SMS/voice destinations are recorded on the contact until Twilio credentials are connected.',
  },
  {
    id: 'apple',
    label: 'Apple',
    slug: 'apple',
    color: '555555',
    formation: 'notify',
    readiness: 'paper',
    spineHint: 'Later notify / calendar spoke',
    stampSubjectPrefix: '[Apple]',
    liaisonBody: 'Reserved for Apple Messages / Calendar fan-out. Not on the live spine yet.',
  },
  {
    id: 'mailchimp',
    label: 'Mailchimp',
    slug: 'mailchimp',
    color: 'FFE01B',
    formation: 'notify',
    readiness: 'liaison',
    spineHint: 'Outreach after form submit',
    stampSubjectPrefix: '[Mailchimp]',
    liaisonBody: 'List and campaign intents write Activity trails until Mailchimp OAuth is available.',
  },
  {
    id: 'hubspot',
    label: 'HubSpot',
    slug: 'hubspot',
    color: 'FF7A59',
    formation: 'notify',
    readiness: 'liaison',
    spineHint: 'Sync outreach with form and deal events',
    stampSubjectPrefix: '[HubSpot]',
    liaisonBody: 'CRM sync destinations stay on Desk Activities until HubSpot connect ships.',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    slug: 'stripe',
    color: '635BFF',
    formation: 'money',
    readiness: 'available',
    spineHint: 'Money outcomes after deal stage changes',
    stampSubjectPrefix: '[Stripe]',
    liaisonBody: 'Invoice and payment intents are stamped on Log notes. See Money / Payments for Stripe Connect framing on mobile.',
    deepLinkHint: 'Money / Payments',
  },
  {
    id: 'quickbooks',
    label: 'QuickBooks',
    slug: 'quickbooks',
    color: '2CA01C',
    formation: 'money',
    readiness: 'liaison',
    spineHint: 'Accounting after deal booked',
    stampSubjectPrefix: '[QuickBooks]',
    liaisonBody: 'Invoice prep is recorded on the contact until QuickBooks credentials ship.',
  },
  {
    id: 'xero',
    label: 'Xero',
    slug: 'xero',
    color: '13B5EA',
    formation: 'money',
    readiness: 'liaison',
    spineHint: 'Accounting after deal booked',
    stampSubjectPrefix: '[Xero]',
    liaisonBody: 'Accounting destinations write branded Activity notes until Xero connect ships.',
  },
  {
    id: 'google-calendar',
    label: 'Google Calendar',
    slug: 'googlecalendar',
    color: '4285F4',
    formation: 'sync',
    readiness: 'liaison',
    spineHint: 'Schedule after deal or chat',
    stampSubjectPrefix: '[Google Calendar]',
    liaisonBody: 'Meeting intents are logged on Activities until Google Calendar OAuth ships.',
  },
  {
    id: 'google-maps',
    label: 'Google Maps',
    slug: 'googlemaps',
    color: '4285F4',
    formation: 'later',
    readiness: 'paper',
    spineHint: 'Location context (later spoke)',
    stampSubjectPrefix: '[Google Maps]',
    liaisonBody: 'Reserved for place context. Not paired to a live Automations spine event yet.',
  },
  {
    id: 'notion',
    label: 'Notion',
    slug: 'notion',
    color: '000000',
    formation: 'later',
    readiness: 'paper',
    spineHint: 'Docs / wiki (later spoke)',
    stampSubjectPrefix: '[Notion]',
    liaisonBody: 'Page and database sync will attach later. For now stamps only brand Activity notes.',
  },
  {
    id: 'linear',
    label: 'Linear',
    slug: 'linear',
    color: '5E6AD2',
    formation: 'later',
    readiness: 'paper',
    spineHint: 'Issue tracking (later spoke)',
    stampSubjectPrefix: '[Linear]',
    liaisonBody: 'Issue creation is a later spoke. Stamps record intent on the Activity timeline.',
  },
  {
    id: 'github',
    label: 'GitHub',
    slug: 'github',
    color: '181717',
    formation: 'later',
    readiness: 'paper',
    spineHint: 'Dev tools (later spoke)',
    stampSubjectPrefix: '[GitHub]',
    liaisonBody: 'Issues and PRs are out of the CRM spine for v1. Catalog presence only.',
  },
  {
    id: 'zapier',
    label: 'Zapier',
    slug: 'zapier',
    color: 'FF4F00',
    formation: 'escape',
    readiness: 'liaison',
    spineHint: 'Long-tail adapter (future webhook)',
    stampSubjectPrefix: '[Zapier]',
    liaisonBody: 'Zapier is the escape hatch for everything else. Payload preview only until the adapter plan ships — not a peer runnable action.',
  },
] as const

export const FORMATION_ORDER: AppFormation[] = ['ai', 'notify', 'money', 'sync', 'escape', 'later']

export const FORMATION_LABELS: Record<AppFormation, string> = {
  ai: 'AI',
  notify: 'Notify & outreach',
  money: 'Money',
  sync: 'Schedule & sync',
  escape: 'Escape hatch',
  later: 'Later spokes',
}

export function appById(id: string | undefined): AppCatalogItem | undefined {
  if (!id) return undefined
  return APP_CATALOG.find((a) => a.id === id)
}

export function appsByFormation(formation: AppFormation): AppCatalogItem[] {
  return APP_CATALOG.filter((a) => a.formation === formation)
}

export function stampableApps(): AppCatalogItem[] {
  return [...APP_CATALOG]
}

export function readinessLabel(r: AppReadiness): string {
  if (r === 'available') return 'Available on spine'
  if (r === 'liaison') return 'Liaison'
  return 'Paper'
}

/** Prefix Activity subjects with `[App] ` when stamped; never double-prefix. */
export function brandedSubject(
  subject: string | undefined,
  appId: string | undefined,
  fallback: string,
): string {
  const base = (subject?.trim() || fallback).trim()
  const app = appById(appId)
  if (!app) return base
  if (base.startsWith('[')) return base
  return `${app.stampSubjectPrefix} ${base}`
}
