import { Resend } from 'resend'
import type { MailEnv } from './env.js'
import { assertSendEnv } from './env.js'
import { authAsAdmin, authAsUser, escapeFilter, parseAudienceIds } from './pb.js'
import { takeToken } from './rate-limit.js'

export type SendSummary = {
  campaign: Record<string, unknown>
  mode: 'live'
  organizationId: string
  sent: number
  skipped: number
  errors: string[]
  contactIds: string[]
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  // Autolink bare URLs so Resend click tracking can rewrite them.
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (raw) => {
      const trailing = raw.match(/[),.;:!?]+$/)?.[0] ?? ''
      const href = trailing ? raw.slice(0, -trailing.length) : raw
      if (!href) return raw
      return `<a href="${href}">${href}</a>${trailing}`
    },
  )
  return `<div style="font-family:system-ui,sans-serif;line-height:1.5;white-space:pre-wrap">${withLinks}</div>`
}

export async function sendCampaign(
  env: MailEnv,
  campaignId: string,
  bearerToken: string | null,
  localTokenOk: boolean,
): Promise<SendSummary> {
  assertSendEnv(env)

  let organizationId: string
  if (bearerToken && !(env.localSendToken && bearerToken === env.localSendToken)) {
    const user = await authAsUser(env, bearerToken)
    organizationId = user.organizationId
  } else if (localTokenOk && env.localSendToken && bearerToken === env.localSendToken) {
    organizationId = ''
  } else {
    throw new Error('Unauthorized — sign in and retry')
  }

  const admin = await authAsAdmin(env)
  const campaign = await admin.collection('campaigns').getOne(campaignId)
  const campOrg = String((campaign as { organization_id?: string }).organization_id ?? '')
  if (organizationId && campOrg && campOrg !== organizationId) {
    throw new Error('Campaign does not belong to your organization')
  }
  if (!organizationId) organizationId = campOrg
  if (!organizationId) throw new Error('Campaign is missing organization_id')

  const subject = String((campaign as { subject?: string }).subject ?? '').trim()
  const body = String((campaign as { body?: string }).body ?? '').trim()
  const name = String((campaign as { name?: string }).name ?? 'Campaign')
  if (!subject || !body) throw new Error('Add a subject and body before sending')

  const audienceIds = parseAudienceIds((campaign as { audience_ids?: unknown }).audience_ids)
  if (audienceIds.length === 0) throw new Error('Pick at least one contact in the audience')
  if (audienceIds.length > env.maxAudience) {
    throw new Error(
      `Audience too large (${audienceIds.length}). Max ${env.maxAudience} contacts per send.`,
    )
  }

  const orgDayKey = `org-day:${organizationId}:${new Date().toISOString().slice(0, 10)}`
  const orgLimit = takeToken(orgDayKey, env.orgSendLimit, 24 * 60 * 60 * 1000)
  if (!orgLimit.ok) {
    throw new Error(
      `Daily send limit reached for this organization (${env.orgSendLimit}). Try again tomorrow.`,
    )
  }

  const cooldown = takeToken(`campaign:${campaignId}`, 1, env.campaignCooldownSec * 1000)
  if (!cooldown.ok) {
    throw new Error(
      `Campaign was sent recently. Wait ${cooldown.retryAfterSec}s before sending again.`,
    )
  }

  const resend = new Resend(env.resendApiKey)
  const html = textToHtml(body)
  let sent = 0
  let skipped = 0
  const errors: string[] = []
  const contactIds: string[] = []

  for (const contactId of audienceIds) {
    let contact: { id: string; email?: string; name?: string; organization_id?: string }
    try {
      contact = (await admin.collection('clients').getOne(contactId)) as typeof contact
    } catch {
      skipped += 1
      errors.push(`Contact ${contactId} not found`)
      continue
    }
    const contactOrg = String(contact.organization_id ?? '')
    if (contactOrg && contactOrg !== organizationId) {
      skipped += 1
      errors.push(`Contact ${contactId} is outside campaign org`)
      continue
    }
    const to = (contact.email ?? '').trim()
    if (!to || !to.includes('@')) {
      skipped += 1
      continue
    }

    try {
      const { data, error } = await resend.emails.send({
        from: env.resendFrom,
        to,
        subject,
        html,
        text: body,
        tags: [
          { name: 'campaign_id', value: campaignId },
          { name: 'contact_id', value: contactId },
          { name: 'organization_id', value: organizationId },
        ],
      })
      if (error || !data?.id) {
        errors.push(`${to}: ${error?.message ?? 'Resend did not return email id'}`)
        continue
      }

      await admin.collection('campaign_sends').create({
        organization_id: organizationId,
        campaign_id: campaignId,
        contact_id: contactId,
        resend_email_id: data.id,
        to_email: to,
      })

      await admin.collection('activities').create({
        organization_id: organizationId,
        contact_id: contactId,
        type: 'email',
        subject: `Campaign: ${name}`,
        body: subject,
        occurred_at: new Date().toISOString(),
        direction: 'out',
      })

      contactIds.push(contactId)
      sent += 1
    } catch (err) {
      errors.push(`${to}: ${err instanceof Error ? err.message : 'send failed'}`)
    }
  }

  const prevSent = Number((campaign as { stats_sent?: number }).stats_sent ?? 0)
  const patch: Record<string, unknown> = {
    channel: 'email',
    stats_sent: prevSent + sent,
  }
  if (sent > 0) patch.status = 'completed'

  const updated = await admin.collection('campaigns').update(campaignId, patch)

  return {
    campaign: updated as unknown as Record<string, unknown>,
    mode: 'live',
    organizationId,
    sent,
    skipped,
    errors,
    contactIds,
  }
}

/** Used by tests/helpers — filter for campaign_sends lookup */
export function sendFilterByEmailId(emailId: string): string {
  return `resend_email_id="${escapeFilter(emailId)}"`
}
