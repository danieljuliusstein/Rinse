import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'
import { mergeTemplateBodyForContext, type MessageTemplateContext } from './message-templates'

export type SentMessageStatus = 'sent' | 'failed'
export type SentMessageChannel = 'sms' | 'email'

export interface AutoMessageTemplate {
  id: string
  name: string
  trigger: string
  enabled: boolean
  emailBody: string
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
  },
  {
    id: 'job_completion',
    name: 'Job complete follow-up',
    trigger: 'After job complete',
    enabled: true,
    emailBody: 'Hi {{name}}, thanks for choosing us! Your {{package}} is complete.',
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
  },
]

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function loadAutoMessageTemplates(): Promise<AutoMessageTemplate[]> {
  if (!(await isOnline())) return DEFAULT_AUTO_TEMPLATES
  try {
    const orgId = requireOrganizationId()
    const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const records = await pb().collection('app_settings').getFullList({
      filter: `organization_id = "${escaped}"`,
      fields: 'auto_messages',
    })
    const raw = records[0]?.auto_messages
    if (!Array.isArray(raw)) return DEFAULT_AUTO_TEMPLATES
    return raw as AutoMessageTemplate[]
  } catch {
    return DEFAULT_AUTO_TEMPLATES
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
    await pb().collection('app_settings').update(records[0].id, { auto_messages: templates })
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
    })
    return page.items.map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: String(row.id),
        client_name: String(row.client_name ?? ''),
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
  ctx: MessageTemplateContext
): Promise<string | undefined> {
  const templates = await loadAutoMessageTemplates()
  const tpl = templates.find((t) => t.id === templateId)
  if (!tpl?.enabled) return undefined
  return mergeTemplateBodyForContext(tpl.emailBody, ctx)
}
