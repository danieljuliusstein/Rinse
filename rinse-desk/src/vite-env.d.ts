/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PB_URL?: string
  /** Base URL of the campaign-mail service (no secret). When set, campaign send goes through Resend. */
  readonly VITE_CAMPAIGN_MAIL_URL?: string
  /** Detailing apps/api base URL (production: https://rinsehq.com). Desk sends PB Bearer; API should require it. */
  readonly VITE_APP_API_URL?: string
  /** Google Maps JS API key (Places Autocomplete). Restrict by HTTP referrer in Cloud Console. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** MapLibre style JSON URL. Defaults to MapLibre demo tiles when unset. */
  readonly VITE_MAP_STYLE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
