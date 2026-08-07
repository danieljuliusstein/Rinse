import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/** Minimal .env loader so we don't need dotenv as a dependency. */
function loadDotEnvFile() {
  const path = resolve(process.cwd(), '.env')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadDotEnvFile()

function required(name: string): string {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`Missing required env ${name}`)
  return v
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

function truthy(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function loadEnv() {
  const allowInsecureCors = truthy('ALLOW_INSECURE_CORS')
  const allowLocalSend = truthy('ALLOW_LOCAL_SEND')
  const corsOrigin = process.env.CORS_ORIGIN?.trim() || (allowInsecureCors ? '*' : '')

  const localSendToken = allowLocalSend ? process.env.LOCAL_SEND_TOKEN?.trim() || '' : ''

  return {
    port: Number(process.env.PORT || 8787),
    pbUrl: (process.env.PB_URL || process.env.VITE_PB_URL || '').replace(/\/$/, ''),
    pbAdminEmail: process.env.PB_ADMIN_EMAIL?.trim() || '',
    pbAdminPassword: process.env.PB_ADMIN_PASSWORD?.trim() || '',
    resendApiKey: process.env.RESEND_API_KEY?.trim() || '',
    resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET?.trim() || '',
    resendFrom: process.env.RESEND_FROM?.trim() || '',
    /** Only active when ALLOW_LOCAL_SEND=1 */
    localSendToken,
    allowLocalSend,
    corsOrigin,
    allowInsecureCors,
    /** Max recipients per single send request */
    maxAudience: intEnv('SEND_MAX_AUDIENCE', 500),
    /** Min seconds between sends of the same campaign id */
    campaignCooldownSec: intEnv('SEND_CAMPAIGN_COOLDOWN_SEC', 300),
    /** Max send endpoint hits per IP per window */
    ipSendLimit: intEnv('SEND_IP_LIMIT', 10),
    ipSendWindowSec: intEnv('SEND_IP_WINDOW_SEC', 900),
    /** Max send endpoint hits per org per day (calendar UTC day) */
    orgSendLimit: intEnv('SEND_ORG_DAILY_LIMIT', 20),
  }
}

export type MailEnv = ReturnType<typeof loadEnv>

/** Fail fast on insecure production defaults. */
export function assertSecureEnv(env: MailEnv) {
  if (!env.corsOrigin || env.corsOrigin === '*') {
    if (env.allowInsecureCors) {
      console.warn(
        '[campaign-mail] CORS_ORIGIN=* allowed via ALLOW_INSECURE_CORS=1 — do not use in production',
      )
      return
    }
    throw new Error(
      'CORS_ORIGIN must be set to your Desk origin(s) (comma-separated). ' +
        'For local-only wildcards set ALLOW_INSECURE_CORS=1.',
    )
  }
}

export function assertSendEnv(env: MailEnv) {
  if (!env.pbUrl) throw new Error('PB_URL is required')
  if (!env.resendApiKey) throw new Error('RESEND_API_KEY is required')
  if (!env.resendFrom) throw new Error('RESEND_FROM is required')
  if (!env.pbAdminEmail || !env.pbAdminPassword) {
    throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD are required for send writes')
  }
}

export function assertWebhookEnv(env: MailEnv) {
  if (!env.pbUrl) throw new Error('PB_URL is required')
  if (!env.resendWebhookSecret) throw new Error('RESEND_WEBHOOK_SECRET is required')
  if (!env.pbAdminEmail || !env.pbAdminPassword) {
    throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD are required for webhook writes')
  }
}

export function requireEnvName(name: string) {
  return required(name)
}
