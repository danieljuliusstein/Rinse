export type BookingUrlParams = {
  date?: string
  time?: string
}

export type WebsitePlatform = 'wix' | 'squarespace' | 'wordpress' | 'other'

export function bookingPageUrl(appOrigin: string, slug: string, params?: BookingUrlParams): string {
  const base = `${appOrigin.replace(/\/$/, '')}/book/${encodeURIComponent(slug)}`
  if (!params?.date && !params?.time) return base
  const qs = new URLSearchParams()
  if (params.date) qs.set('date', params.date)
  if (params.time) qs.set('time', params.time)
  return `${base}?${qs.toString()}`
}

export function embedCalendarPageUrl(appOrigin: string, slug: string): string {
  return `${appOrigin.replace(/\/$/, '')}/embed/book/${encodeURIComponent(slug)}`
}

/** Raw iframe — paste into any HTML page. */
export function embedCalendarIframeHtml(appOrigin: string, slug: string): string {
  const src = embedCalendarPageUrl(appOrigin, slug)
  return `<iframe
  src="${src}"
  title="Book an appointment"
  style="width:100%;max-width:400px;height:520px;border:0;border-radius:12px;display:block;"
  loading="lazy"
></iframe>`
}

/** Calendar widget via embed.js — paste where the widget should appear. */
export function embedCalendarScriptHtml(appOrigin: string, slug: string, brandName = 'your business'): string {
  const label = brandName.trim() || 'your business'
  return `<h2>Book with ${label}</h2>
<div data-detail-booking="${slug}"></div>
<script src="${appOrigin.replace(/\/$/, '')}/embed.js" async></script>`
}

/** Opens full booking flow in a modal when clicked. */
export function embedButtonScriptHtml(
  appOrigin: string,
  slug: string,
  label = 'Book an appointment',
): string {
  return `<button type="button" data-detail-book="${slug}">${label}</button>
<script src="${appOrigin.replace(/\/$/, '')}/embed.js" async></script>`
}

/** Simple link — Tier 1 minimum. */
export function embedLinkHtml(appOrigin: string, slug: string, label = 'Book an appointment'): string {
  const href = bookingPageUrl(appOrigin, slug)
  return `<a href="${href}">${label}</a>`
}

export function exampleSiteUrl(appOrigin: string, slug: string, brandName?: string): string {
  const params = new URLSearchParams({ slug })
  const brand = brandName?.trim()
  if (brand) params.set('brand', brand)
  return `${appOrigin.replace(/\/$/, '')}/examples/customer-site.html?${params.toString()}`
}

export const SOCIAL_PLACEMENTS = [
  'Instagram or TikTok bio',
  'Google Business Profile → Book button',
  'Linktree or bio link',
  'Text message or email signature',
] as const

export const PLATFORM_LABELS: Record<WebsitePlatform, string> = {
  wix: 'Wix',
  squarespace: 'Squarespace',
  wordpress: 'WordPress',
  other: 'Other / AI',
}

export function platformSetupSteps(platform: WebsitePlatform): string[] {
  switch (platform) {
    case 'wix':
      return [
        'Open your site in the Wix Editor.',
        'Click Add (+) → Embed Code → Embed HTML.',
        'Paste the code below where you want customers to book.',
        'Publish. New bookings appear in your app automatically.',
      ]
    case 'squarespace':
      return [
        'Edit the page where you want booking.',
        'Click + → Code (or Embed).',
        'Paste the code below into the block.',
        'Save. Your live calendar stays in sync with your schedule.',
      ]
    case 'wordpress':
      return [
        'Edit your page in WordPress.',
        'Add a Custom HTML block where you want the calendar.',
        'Paste the code below.',
        'Update the page.',
      ]
    default:
      return [
        'Open your site editor (or ask ChatGPT / your web person to help).',
        'Find where you can paste HTML — often called “Custom code”, “Embed”, or “HTML block”.',
        'Paste the code below on your homepage or booking page.',
        'Publish. You keep your design — we only handle scheduling.',
      ]
  }
}

export function socialSetupSteps(): string[] {
  return [
    'Copy your booking link below.',
    'Paste it anywhere customers already find you (see ideas).',
    'When they tap it, they book on your branded page — you get the job in the app.',
  ]
}
