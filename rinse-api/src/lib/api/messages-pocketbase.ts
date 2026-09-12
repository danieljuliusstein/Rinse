import { getPocketBase, isPocketBaseConfigured } from '../pocketbase'
import { checkPocketBaseHealth } from '../pocketbase'
import { authenticatePocketBase } from '../pb-auth'
import { tenantFilter } from './tenant-pocketbase'
import {
  DEFAULT_AUTO_TEMPLATES,
  type AutoMessageTemplate,
  type SentMessage,
} from '../messages'
import type { PbRecord } from './mappers'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

async function canSync(): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false
  if (!(await checkPocketBaseHealth())) return false
  return authenticatePocketBase()
}

export async function loadAutoMessageTemplatesFromPocketBase(): Promise<AutoMessageTemplate[] | null> {
  if (!(await canSync())) return null
  try {
    const records = await pb().collection('app_settings').getFullList<PbRecord>({
      filter: tenantFilter(),
      limit: 1,
    })
    const raw = records[0]?.auto_messages
    if (!Array.isArray(raw)) {
      return DEFAULT_AUTO_TEMPLATES.map((t) => ({ ...t }))
    }
    return DEFAULT_AUTO_TEMPLATES.map((def) => {
      const saved = (raw as { id?: string; enabled?: boolean; emailBody?: string }[]).find((p) => p.id === def.id)
      return saved
        ? {
            ...def,
            enabled: saved.enabled ?? def.enabled,
            emailBody: saved.emailBody?.trim() ? saved.emailBody : def.emailBody,
          }
        : { ...def }
    })
  } catch {
    return null
  }
}

export async function saveAutoMessageTemplatesToPocketBase(templates: AutoMessageTemplate[]): Promise<boolean> {
  if (!(await canSync())) return false
  try {
    const payload = templates.map(({ id, enabled, emailBody }) => ({ id, enabled, emailBody }))
    const records = await pb().collection('app_settings').getFullList<PbRecord>({
      filter: tenantFilter(),
      limit: 1,
    })
    if (records.length === 0) return false
    await pb().collection('app_settings').update(records[0].id, { auto_messages: payload })
    return true
  } catch {
    return false
  }
}

export async function loadSentMessagesFromPocketBase(limit = 50): Promise<SentMessage[] | null> {
  if (!(await canSync())) return null
  try {
    const page = await pb().collection('sent_messages').getList<PbRecord>(1, limit, {
      filter: tenantFilter(),
      sort: '-sent_at',
      expand: 'client_id',
    })
    const records = page.items
    return records.map((r) => ({
      id: String(r.id),
      client_name: r.expand?.client_id?.name ? String(r.expand.client_id.name) : 'Client',
      preview: String(r.preview ?? ''),
      body: String(r.body ?? ''),
      channel: String(r.channel) as SentMessage['channel'],
      sent_at: String(r.sent_at ?? r.created ?? ''),
      status: String(r.status) as SentMessage['status'],
    }))
  } catch {
    return null
  }
}
