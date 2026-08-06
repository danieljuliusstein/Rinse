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

export function loadEnv() {
  return {
    port: Number(process.env.PORT || 8787),
    pbUrl: (process.env.PB_URL || process.env.VITE_PB_URL || '').replace(/\/$/, ''),
    pbAdminEmail: process.env.PB_ADMIN_EMAIL?.trim() || '',
    pbAdminPassword: process.env.PB_ADMIN_PASSWORD?.trim() || '',
    resendApiKey: process.env.RESEND_API_KEY?.trim() || '',
    resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET?.trim() || '',
    resendFrom: process.env.RESEND_FROM?.trim() || '',
    /** Optional local-only bearer for smoke without PocketBase user token */
    localSendToken: process.env.LOCAL_SEND_TOKEN?.trim() || '',
    corsOrigin: process.env.CORS_ORIGIN?.trim() || '*',
  }
}

export type MailEnv = ReturnType<typeof loadEnv>

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
