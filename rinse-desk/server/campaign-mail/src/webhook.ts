import { Resend } from 'resend'
import type { MailEnv } from './env.js'
import { assertWebhookEnv } from './env.js'
import { authAsAdmin, escapeFilter } from './pb.js'
import {
  extractEmailId,
  shouldIncrementClick,
  shouldIncrementOpen,
} from './unique-open.js'

export type WebhookResult = {
  ok: true
  handled:
    | 'ignored'
    | 'already_opened'
    | 'opened'
    | 'already_clicked'
    | 'clicked'
    | 'unknown_email'
}

type SendRow = {
  id: string
  campaign_id: string
  opened_at?: string
  clicked_at?: string
}

export async function handleResendWebhook(
  env: MailEnv,
  rawBody: string,
  headers: {
    id?: string
    timestamp?: string
    signature?: string
  },
): Promise<WebhookResult> {
  assertWebhookEnv(env)

  const id = headers.id?.trim()
  const timestamp = headers.timestamp?.trim()
  const signature = headers.signature?.trim()
  if (!id || !timestamp || !signature) {
    throw new Error('Missing webhook signature headers')
  }

  const resend = new Resend(env.resendApiKey || 're_unused_for_verify')
  const event = resend.webhooks.verify({
    payload: rawBody,
    headers: { id, timestamp, signature },
    webhookSecret: env.resendWebhookSecret,
  }) as { type?: string; data?: { email_id?: string; created_at?: string } }

  if (event.type === 'email.opened') {
    return handleOpened(env, event.data)
  }
  if (event.type === 'email.clicked') {
    return handleClicked(env, event.data)
  }

  return { ok: true, handled: 'ignored' }
}

async function lookupSend(env: MailEnv, emailId: string): Promise<SendRow | null> {
  const admin = await authAsAdmin(env)
  try {
    return (await admin
      .collection('campaign_sends')
      .getFirstListItem(`resend_email_id="${escapeFilter(emailId)}"`)) as unknown as SendRow
  } catch {
    return null
  }
}

async function handleOpened(
  env: MailEnv,
  data: { email_id?: string; created_at?: string } | undefined,
): Promise<WebhookResult> {
  const emailId = extractEmailId(data)
  if (!emailId) return { ok: true, handled: 'ignored' }

  const row = await lookupSend(env, emailId)
  if (!row) return { ok: true, handled: 'unknown_email' }

  if (!shouldIncrementOpen(row.opened_at)) {
    return { ok: true, handled: 'already_opened' }
  }

  const admin = await authAsAdmin(env)
  const openedAt = data?.created_at || new Date().toISOString()
  try {
    const fresh = (await admin.collection('campaign_sends').getOne(row.id)) as unknown as SendRow
    if (!shouldIncrementOpen(fresh.opened_at)) {
      return { ok: true, handled: 'already_opened' }
    }
    await admin.collection('campaign_sends').update(row.id, { opened_at: openedAt })
  } catch {
    return { ok: true, handled: 'already_opened' }
  }

  const campaign = (await admin.collection('campaigns').getOne(row.campaign_id)) as unknown as {
    stats_opened?: number
  }
  const prev = Number(campaign.stats_opened ?? 0)
  await admin.collection('campaigns').update(row.campaign_id, {
    stats_opened: prev + 1,
  })

  return { ok: true, handled: 'opened' }
}

async function handleClicked(
  env: MailEnv,
  data: { email_id?: string; created_at?: string } | undefined,
): Promise<WebhookResult> {
  const emailId = extractEmailId(data)
  if (!emailId) return { ok: true, handled: 'ignored' }

  const row = await lookupSend(env, emailId)
  if (!row) return { ok: true, handled: 'unknown_email' }

  if (!shouldIncrementClick(row.clicked_at)) {
    return { ok: true, handled: 'already_clicked' }
  }

  const admin = await authAsAdmin(env)
  const clickedAt = data?.created_at || new Date().toISOString()
  try {
    const fresh = (await admin.collection('campaign_sends').getOne(row.id)) as unknown as SendRow
    if (!shouldIncrementClick(fresh.clicked_at)) {
      return { ok: true, handled: 'already_clicked' }
    }
    await admin.collection('campaign_sends').update(row.id, { clicked_at: clickedAt })
  } catch {
    return { ok: true, handled: 'already_clicked' }
  }

  const campaign = (await admin.collection('campaigns').getOne(row.campaign_id)) as unknown as {
    stats_clicked?: number
  }
  const prev = Number(campaign.stats_clicked ?? 0)
  await admin.collection('campaigns').update(row.campaign_id, {
    stats_clicked: prev + 1,
  })

  return { ok: true, handled: 'clicked' }
}

/** Prefer Resend webhook-* headers; fall back to legacy Svix names. */
export function readWebhookHeaders(h: Headers | Record<string, string | undefined>): {
  id?: string
  timestamp?: string
  signature?: string
} {
  const get = (key: string) => {
    if (h instanceof Headers) return h.get(key) ?? undefined
    return h[key] ?? h[key.toLowerCase()]
  }
  return {
    id: get('webhook-id') || get('svix-id') || undefined,
    timestamp: get('webhook-timestamp') || get('svix-timestamp') || undefined,
    signature: get('webhook-signature') || get('svix-signature') || undefined,
  }
}
