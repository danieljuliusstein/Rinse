import { appApiJson } from './app-api'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'
import { mergeTemplateBodyForContext, type MessageTemplateContext } from './message-templates'

export type SentMessageStatus = 'sent' | 'failed' | 'queued'
export type SentMessageChannel = 'sms' | 'email'

export interface AutoMessageTemplate {
  id: string
  name: string
  trigger: string
  enabled: boolean
  emailBody: string
  smsBody?: string
  preferSms?: boolean
}

export interface SentMessage {
  id: string
  client_name: string
  preview: string
  body: string
  channel: SentMessageChannel
  sent_at: string
  status: SentMessageStatus
}

export const DEFAULT_AUTO_TEMPLATES: AutoMessageTemplate[] = [
  {
    id: 'appointment_reminder',
    name: 'Appointment reminder',
    trigger: '24h before job',
    enabled: true,
    emailBody: 'Hi {{name}}, reminder: your {{package}} is scheduled for {{date}} at {{time}}.',
    smsBody: 'Hi {{name}}, reminder: your {{package}} is {{date}} at {{time}}.',
  },
  {
    id: 'job_completion',
    name: 'Job complete follow-up',
    trigger: 'After job complete',
    enabled: true,
    emailBody: 'Hi {{name}}, thanks for choosing us! Your {{package}} is complete.',
    smsBody: 'Hi {{name}}, your {{package}} is done!',
  },
  {
    id: 'on_my_way',
    name: 'On my way',
    trigger: 'Manual — leaving for the job',
    enabled: true,
    preferSms: true,
    emailBody: 'Hi {{name}},\n\nI am on my way for your {{package}} appointment.\n\nSee you soon!',
    smsBody: 'Hi {{name}}, I am on my way for your {{package}}. See you soon!',
  },
  {
    id: 'review_request',
    name: 'Review request',
    trigger: '24h after completion',
    enabled: false,
    preferSms: true,
    emailBody:
      'Hi {{name}},\n\nThank you for trusting us with your {{package}}. If you have a moment, we would appreciate a review.\n\nLeave a review: {{review_link}}',
    smsBody:
      'Hi {{name}}, thanks again for your {{package}}! A quick review helps a lot: {{review_link}}',
  },
  {
    id: 'invoice_overdue',
    name: 'Invoice overdue',
    trigger: 'Invoice overdue',
    enabled: false,
    emailBody: 'Hi {{name}}, friendly reminder that your invoice is past due.',
  },
  {
    id: 'follow_up',
    name: 'Follow up',
    trigger: 'Re-engage past clients',
    enabled: true,
    emailBody: 'Hi {{name}}, hope your {{package}} is still looking great. Ready to book again?',
    smsBody: 'Hi {{name}}, hope your {{package}} is still looking great. Ready to book again?',
  },
]

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function mergeWithDefaults(raw: unknown): AutoMessageTemplate[] {
  if (!Array.isArray(raw)) return DEFAULT_AUTO_TEMPLATES.map((t) => ({ ...t }))
  const saved = raw as {
    id?: string
    enabled?: boolean
    emailBody?: string
    smsBody?: string
    preferSms?: boolean
    name?: string
    trigger?: string
  }[]
  const byId = new Map(saved.map((s) => [s.id, s]))
  return DEFAULT_AUTO_TEMPLATES.map((def) => {
    const row = byId.get(def.id)
    if (!row) return { ...def }
    return {
      ...def,
      enabled: row.enabled ?? def.enabled,
      emailBody: row.emailBody?.trim() ? row.emailBody : def.emailBody,
      smsBody: row.smsBody?.trim() ? row.smsBody : def.smsBody,
      preferSms: row.preferSms ?? def.preferSms,
    }
  })
}

export async function loadAutoMessageTemplates(): Promise<AutoMessageTemplate[]> {
  if (!(await isOnline())) return DEFAULT_AUTO_TEMPLATES.map((t) => ({ ...t }))
  try {
    const orgId = requireOrganizationId()
    const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const records = await pb().collection('app_settings').getFullList({
      filter: `organization_id = "${escaped}"`,
      fields: 'auto_messages',
    })
    return mergeWithDefaults(records[0]?.auto_messages)
  } catch {
    return DEFAULT_AUTO_TEMPLATES.map((t) => ({ ...t }))
  }
}

export async function saveAutoMessageTemplates(templates: AutoMessageTemplate[]): Promise<boolean> {
  if (!(await isOnline())) return false
  try {
    const orgId = requireOrganizationId()
    const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const records = await pb().collection('app_settings').getFullList({
      filter: `organization_id = "${escaped}"`,
    })
    if (!records[0]) return false
    const payload = templates.map(({ id, enabled, emailBody, smsBody, preferSms }) => ({
      id,
      enabled,
      emailBody,
      smsBody,
      preferSms,
    }))
    await pb().collection('app_settings').update(records[0].id, { auto_messages: payload })
    return true
  } catch {
    return false
  }
}

export async function listSentMessages(limit = 50): Promise<SentMessage[]> {
  if (!(await isOnline())) return []
  try {
    const orgId = requireOrganizationId()
    const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const page = await pb().collection('sent_messages').getList(1, limit, {
      filter: `organization_id = "${escaped}"`,
      sort: '-sent_at',
      expand: 'client_id',
    })
    return page.items.map((r) => {
      const row = r as Record<string, unknown> & {
        expand?: { client_id?: { name?: string } }
      }
      return {
        id: String(row.id),
        client_name: String(row.expand?.client_id?.name ?? row.client_name ?? ''),
        preview: String(row.preview ?? ''),
        body: String(row.body ?? ''),
        channel: String(row.channel) as SentMessageChannel,
        sent_at: String(row.sent_at ?? ''),
        status: String(row.status) as SentMessageStatus,
      }
    })
  } catch {
    return []
  }
}

export async function composeSmsFromTemplate(
  templateId: string,
  ctx: MessageTemplateContext,
): Promise<string | undefined> {
  const templates = await loadAutoMessageTemplates()
  const tpl = templates.find((t) => t.id === templateId)
  if (!tpl?.enabled) return undefined
  const body = tpl.smsBody?.trim() || tpl.emailBody
  return mergeTemplateBodyForContext(body, ctx)
}

export type SmsSendApiResult = {
  ok: true
  queued?: boolean
  dryRun?: boolean
  body?: string
  sid?: string
}

export async function sendSmsTemplate(input: {
  templateId: string
  clientId: string
  jobId?: string
  force?: boolean
}): Promise<SmsSendApiResult> {
  return appApiJson<SmsSendApiResult>('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
