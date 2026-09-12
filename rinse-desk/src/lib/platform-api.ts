import { brandedSubject } from '@/components/automations/appCatalog'
import { ClientResponseError } from 'pocketbase'
import { getPocketBase } from './pocketbase'
import { formatPbError, orgFilter, requireOrganizationId } from './org'
import { newId, orgStore } from './orgStore'
import { mergeChatThreadMeta, patchChatThreadMeta } from './chat-thread-meta'
import { markActivityOutbound } from './activity-meta'
import {
  ensureWorkflow,
  evaluateCondition,
  isAutomationAction,
  legacyToWorkflow,
  MAX_RUNNER_STEPS,
  nextNodes,
  parseConfigPayload,
  primaryActionFromWorkflow,
  serializeConfigPayload,
  triggerFromWorkflow,
} from './automation-workflow'
import type {
  ActivityType,
  AutomationAction,
  AutomationTrigger,
  AutomationWorkflow,
  CampaignChannel,
  CampaignSendSummary,
  CampaignStatus,
  DeskActivity,
  DeskAutomation,
  DeskCampaign,
  DeskChatMessage,
  DeskChatThread,
  DeskForm,
  DeskFormField,
  DeskFormSubmission,
} from './types'

function isMissingCollection(err: unknown): boolean {
  // PocketBase returns 404 when the collection does not exist. Do not treat generic
  // 400s (bad sort/filter) as missing — that silently falls back to empty orgStore.
  return err instanceof ClientResponseError && err.status === 404
}

/** Skip repeat hits to collections known missing on this PocketBase (e.g. chat_threads on Fly). */
const missingCollections = new Set<string>()
const missingCollectionsKey = 'desk_pb_missing_collections'
const inflightLists = new Map<string, Promise<Record<string, unknown>[] | null>>()

function loadMissingCollections(): void {
  try {
    const raw = sessionStorage.getItem(missingCollectionsKey)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      for (const name of parsed) {
        if (typeof name === 'string') missingCollections.add(name)
      }
    }
  } catch {
    /* ignore */
  }
}

function rememberMissingCollection(collection: string): void {
  loadMissingCollections()
  missingCollections.add(collection)
  try {
    sessionStorage.setItem(missingCollectionsKey, JSON.stringify([...missingCollections]))
  } catch {
    /* ignore */
  }
}

export function isKnownMissingCollection(collection: string): boolean {
  loadMissingCollections()
  return missingCollections.has(collection)
}

async function tryPbList(collection: string): Promise<Record<string, unknown>[] | null> {
  if (isKnownMissingCollection(collection)) return null

  const existing = inflightLists.get(collection)
  if (existing) return existing

  const pending = (async (): Promise<Record<string, unknown>[] | null> => {
    try {
      const pb = getPocketBase()
      try {
        const result = await pb.collection(collection).getList(1, 500, {
          filter: orgFilter(),
          sort: '-id',
        })
        return result.items as unknown as Record<string, unknown>[]
      } catch (err) {
        // Unsortable schemas — retry without sort.
        if (err instanceof ClientResponseError && err.status === 400) {
          const result = await pb.collection(collection).getList(1, 500, {
            filter: orgFilter(),
          })
          return result.items as unknown as Record<string, unknown>[]
        }
        throw err
      }
    } catch (err) {
      if (isMissingCollection(err)) {
        rememberMissingCollection(collection)
        return null
      }
      throw new Error(formatPbError(err, `Could not load ${collection}`))
    } finally {
      inflightLists.delete(collection)
    }
  })()

  inflightLists.set(collection, pending)
  return pending
}

async function tryPbCreate(collection: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (isKnownMissingCollection(collection)) return null
  try {
    const pb = getPocketBase()
    const created = await pb.collection(collection).create({
      ...body,
      organization_id: requireOrganizationId(),
    })
    return created as unknown as Record<string, unknown>
  } catch (err) {
    if (isMissingCollection(err)) {
      rememberMissingCollection(collection)
      return null
    }
    throw new Error(formatPbError(err, `Could not create ${collection}`))
  }
}

async function tryPbUpdate(collection: string, id: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (isKnownMissingCollection(collection)) return null
  try {
    const pb = getPocketBase()
    const updated = await pb.collection(collection).update(id, body)
    return updated as unknown as Record<string, unknown>
  } catch (err) {
    if (isMissingCollection(err)) {
      rememberMissingCollection(collection)
      return null
    }
    throw new Error(formatPbError(err, `Could not update ${collection}`))
  }
}

async function tryPbDelete(collection: string, id: string): Promise<boolean> {
  if (isKnownMissingCollection(collection)) return false
  try {
    const pb = getPocketBase()
    await pb.collection(collection).delete(id)
    return true
  } catch (err) {
    if (isMissingCollection(err)) {
      rememberMissingCollection(collection)
      return false
    }
    throw new Error(formatPbError(err, `Could not delete ${collection}`))
  }
}

function mapActivity(r: Record<string, unknown>): DeskActivity {
  const directionRaw = r.direction ? String(r.direction) : ''
  const direction = directionRaw === 'in' || directionRaw === 'out' ? directionRaw : undefined
  return {
    id: String(r.id),
    contact_id: String(r.contact_id ?? ''),
    deal_id: r.deal_id ? String(r.deal_id) : undefined,
    type: (String(r.type ?? 'note') as ActivityType) || 'note',
    subject: String(r.subject ?? ''),
    body: r.body ? String(r.body) : undefined,
    occurred_at: String(r.occurred_at ?? r.created ?? new Date().toISOString()),
    created: r.created ? String(r.created) : undefined,
    direction,
  }
}

export async function listActivities(): Promise<DeskActivity[]> {
  const remote = await tryPbList('activities')
  if (remote) return remote.map(mapActivity)
  return orgStore.list<DeskActivity>('activities')
}

export async function listActivitiesForContact(contactId: string): Promise<DeskActivity[]> {
  const all = await listActivities()
  return all.filter((a) => a.contact_id === contactId)
}

export async function createActivity(input: {
  contact_id: string
  deal_id?: string
  type: ActivityType
  subject: string
  body?: string
  occurred_at?: string
  direction?: 'in' | 'out'
}): Promise<DeskActivity> {
  const occurred_at = input.occurred_at ?? new Date().toISOString()
  const body = {
    contact_id: input.contact_id,
    deal_id: input.deal_id || '',
    type: input.type,
    subject: input.subject,
    body: input.body || '',
    occurred_at,
  }
  const remote = await tryPbCreate('activities', body)
  const created = remote
    ? mapActivity(remote)
    : orgStore.create<DeskActivity>('activities', {
        id: newId(),
        contact_id: input.contact_id,
        deal_id: input.deal_id,
        type: input.type,
        subject: input.subject,
        body: input.body,
        occurred_at,
        direction: input.direction,
        created: new Date().toISOString(),
      })
  // Desk-logged emails default to outbound (Sent folder) unless marked inbound
  if (input.direction === 'out' || (input.type === 'email' && input.direction !== 'in')) {
    markActivityOutbound(created.id)
  }
  return created
}

export async function updateActivity(
  id: string,
  patch: {
    contact_id?: string
    deal_id?: string | null
    type?: ActivityType
    subject?: string
    body?: string
    occurred_at?: string
    direction?: 'in' | 'out'
  },
): Promise<DeskActivity> {
  const body: Record<string, unknown> = {}
  if (patch.contact_id !== undefined) body.contact_id = patch.contact_id
  if (patch.deal_id !== undefined) body.deal_id = patch.deal_id || ''
  if (patch.type !== undefined) body.type = patch.type
  if (patch.subject !== undefined) body.subject = patch.subject
  if (patch.body !== undefined) body.body = patch.body
  if (patch.occurred_at !== undefined) body.occurred_at = patch.occurred_at

  const remote = await tryPbUpdate('activities', id, body)
  if (remote) {
    const updated = mapActivity(remote)
    if (patch.direction === 'out') markActivityOutbound(id)
    return updated
  }
  const localPatch: Partial<DeskActivity> = {}
  if (patch.contact_id !== undefined) localPatch.contact_id = patch.contact_id
  if (patch.deal_id !== undefined) localPatch.deal_id = patch.deal_id || undefined
  if (patch.type !== undefined) localPatch.type = patch.type
  if (patch.subject !== undefined) localPatch.subject = patch.subject
  if (patch.body !== undefined) localPatch.body = patch.body
  if (patch.occurred_at !== undefined) localPatch.occurred_at = patch.occurred_at
  if (patch.direction !== undefined) localPatch.direction = patch.direction
  const updated = orgStore.update<DeskActivity>('activities', id, localPatch)
  if (patch.direction === 'out') markActivityOutbound(id)
  return updated
}

export async function deleteActivity(id: string): Promise<void> {
  const ok = await tryPbDelete('activities', id)
  if (!ok) orgStore.remove('activities', id)
}

function mapCampaign(r: Record<string, unknown>): DeskCampaign {
  let audience_ids: string[] = []
  if (Array.isArray(r.audience_ids)) audience_ids = r.audience_ids.map(String)
  else if (typeof r.audience_ids === 'string') {
    try {
      audience_ids = JSON.parse(r.audience_ids) as string[]
    } catch {
      audience_ids = []
    }
  }
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    status: (String(r.status ?? 'draft') as CampaignStatus) || 'draft',
    audience_ids,
    subject: r.subject ? String(r.subject) : undefined,
    body: r.body ? String(r.body) : undefined,
    channel: (String(r.channel ?? 'email') as CampaignChannel) || 'email',
    stats_sent: Number(r.stats_sent ?? 0),
    stats_opened: Number(r.stats_opened ?? 0),
    stats_clicked: Number(r.stats_clicked ?? 0),
    created: r.created ? String(r.created) : undefined,
  }
}

export async function listCampaigns(): Promise<DeskCampaign[]> {
  const remote = await tryPbList('campaigns')
  if (remote) return remote.map(mapCampaign)
  return orgStore.list<DeskCampaign>('campaigns')
}

export async function createCampaign(input: {
  name: string
  status?: CampaignStatus
  audience_ids?: string[]
  channel?: CampaignChannel
  subject?: string
  body?: string
}): Promise<DeskCampaign> {
  const payload = {
    name: input.name,
    status: input.status ?? 'draft',
    audience_ids: input.audience_ids ?? [],
    channel: input.channel ?? 'email',
    subject: input.subject ?? '',
    body: input.body ?? '',
    stats_sent: 0,
    stats_opened: 0,
    stats_clicked: 0,
  }
  const remote = await tryPbCreate('campaigns', {
    ...payload,
    audience_ids: JSON.stringify(payload.audience_ids),
  })
  if (remote) return mapCampaign(remote)
  return orgStore.create<DeskCampaign>('campaigns', {
    id: newId(),
    ...payload,
    created: new Date().toISOString(),
  })
}

export async function updateCampaign(id: string, patch: Partial<DeskCampaign>): Promise<DeskCampaign> {
  const body: Record<string, unknown> = { ...patch }
  if (patch.audience_ids) body.audience_ids = JSON.stringify(patch.audience_ids)
  const remote = await tryPbUpdate('campaigns', id, body)
  if (remote) return mapCampaign(remote)
  return orgStore.update<DeskCampaign>('campaigns', id, patch)
}

export async function deleteCampaign(id: string): Promise<void> {
  const ok = await tryPbDelete('campaigns', id)
  if (!ok) orgStore.remove('campaigns', id)
}

/** True when the companion Resend mail service base URL is configured. */
export function isCampaignMailLive(): boolean {
  return Boolean((import.meta.env.VITE_CAMPAIGN_MAIL_URL as string | undefined)?.trim())
}

function campaignMailBaseUrl(): string {
  return (import.meta.env.VITE_CAMPAIGN_MAIL_URL as string | undefined)?.trim().replace(/\/$/, '') || ''
}

export async function sendCampaignEmail(id: string): Promise<CampaignSendSummary> {
  const mailUrl = campaignMailBaseUrl()
  if (mailUrl) {
    const pb = getPocketBase()
    const token = pb.authStore.token
    if (!token) throw new Error('Sign in to send campaign email')

    const res = await fetch(`${mailUrl}/campaigns/${encodeURIComponent(id)}/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    const raw = (await res.json().catch(() => ({}))) as {
      error?: string
      campaign?: Record<string, unknown>
      sent?: number
      skipped?: number
      errors?: string[]
      contactIds?: string[]
      mode?: string
    }
    if (!res.ok) {
      throw new Error(raw.error || `Mail service error (${res.status})`)
    }
    if (!raw.campaign) throw new Error('Mail service returned no campaign')
    const contactIds = Array.isArray(raw.contactIds) ? raw.contactIds.map(String) : []
    for (const contactId of contactIds) {
      await runAutomationsForTrigger('activity_logged', {
        campaign_id: id,
        contact_id: contactId,
      })
    }
    return {
      campaign: mapCampaign(raw.campaign),
      mode: 'live',
      sent: Number(raw.sent ?? 0),
      skipped: Number(raw.skipped ?? 0),
      errors: Array.isArray(raw.errors) ? raw.errors.map(String) : [],
      contactIds,
    }
  }

  // Offline / unset mail URL — activity + stats_sent mock (no open tracking)
  const campaigns = await listCampaigns()
  const campaign = campaigns.find((c) => c.id === id)
  if (!campaign) throw new Error('Campaign not found')
  if (!campaign.subject?.trim() || !campaign.body?.trim()) {
    throw new Error('Add a subject and body before marking sent')
  }
  if (campaign.audience_ids.length === 0) throw new Error('Pick at least one contact in the audience')

  const sent = campaign.audience_ids.length
  const updated = await updateCampaign(id, {
    status: 'completed',
    stats_sent: campaign.stats_sent + sent,
    channel: 'email',
  })

  for (const contactId of campaign.audience_ids) {
    await createActivity({
      contact_id: contactId,
      type: 'email',
      subject: `Campaign: ${campaign.name}`,
      body: campaign.subject,
      direction: 'out',
    })
    await runAutomationsForTrigger('activity_logged', {
      campaign_id: id,
      contact_id: contactId,
    })
  }

  return {
    campaign: updated,
    mode: 'mock',
    sent,
    skipped: 0,
    errors: [],
    contactIds: campaign.audience_ids,
  }
}

type FieldsBlob = DeskFormField[] | { fields: DeskFormField[]; settings?: DeskForm['settings'] }

function parseFieldsBlob(raw: unknown): { fields: DeskFormField[]; settings?: DeskForm['settings'] } {
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { fields: [] }
    }
  }
  if (Array.isArray(parsed)) {
    return { fields: parsed as DeskFormField[] }
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { fields?: unknown }).fields)) {
    const obj = parsed as { fields: DeskFormField[]; settings?: DeskForm['settings'] }
    return { fields: obj.fields, settings: obj.settings }
  }
  return { fields: [] }
}

function serializeFieldsBlob(fields: DeskFormField[], settings?: DeskForm['settings']): string {
  if (settings !== undefined) {
    return JSON.stringify({ fields, settings } satisfies FieldsBlob)
  }
  return JSON.stringify(fields)
}

function mapForm(r: Record<string, unknown>): DeskForm {
  const { fields, settings } = parseFieldsBlob(r.fields_json ?? r.fields)
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    fields,
    settings,
    status: (String(r.status ?? 'draft') as 'draft' | 'live') || 'draft',
    created: r.created ? String(r.created) : undefined,
  }
}

export async function listForms(): Promise<DeskForm[]> {
  const remote = await tryPbList('forms')
  if (remote) return remote.map(mapForm)
  return orgStore.list<DeskForm>('forms')
}

export async function createForm(input: {
  name: string
  fields?: DeskFormField[]
  settings?: DeskForm['settings']
  status?: 'draft' | 'live'
}): Promise<DeskForm> {
  const fields = input.fields ?? [
    { id: newId(), label: 'Name', type: 'text' as const, required: true },
    { id: newId(), label: 'Email', type: 'email' as const, required: true },
  ]
  const settings = input.settings
  const remote = await tryPbCreate('forms', {
    name: input.name,
    fields_json: serializeFieldsBlob(fields, settings),
    status: input.status ?? 'draft',
  })
  if (remote) return mapForm(remote)
  return orgStore.create<DeskForm>('forms', {
    id: newId(),
    name: input.name,
    fields,
    settings,
    status: input.status ?? 'draft',
    created: new Date().toISOString(),
  })
}

export async function updateForm(id: string, patch: Partial<DeskForm>): Promise<DeskForm> {
  const body: Record<string, unknown> = {}
  if (patch.name !== undefined) body.name = patch.name
  if (patch.status !== undefined) body.status = patch.status

  let storePatch = patch
  if (patch.fields !== undefined || patch.settings !== undefined) {
    const local = orgStore.list<DeskForm>('forms').find((f) => f.id === id)
    const fields = patch.fields ?? local?.fields ?? []
    const settings = patch.settings !== undefined ? patch.settings : local?.settings
    body.fields_json = serializeFieldsBlob(fields, settings)
    storePatch = { ...patch, fields, settings }
  }

  const remote = await tryPbUpdate('forms', id, body)
  if (remote) return mapForm(remote)
  return orgStore.update<DeskForm>('forms', id, storePatch)
}

export async function deleteForm(id: string): Promise<void> {
  const ok = await tryPbDelete('forms', id)
  if (!ok) orgStore.remove('forms', id)
}

function mapSubmission(r: Record<string, unknown>): DeskFormSubmission {
  let payload: Record<string, string> = {}
  const raw = r.payload_json ?? r.payload
  if (typeof raw === 'string') {
    try {
      payload = JSON.parse(raw) as Record<string, string>
    } catch {
      payload = {}
    }
  } else if (raw && typeof raw === 'object') {
    payload = raw as Record<string, string>
  }
  return {
    id: String(r.id),
    form_id: String(r.form_id ?? ''),
    contact_id: r.contact_id ? String(r.contact_id) : undefined,
    payload,
    created: r.created ? String(r.created) : undefined,
  }
}

export async function listFormSubmissions(formId?: string): Promise<DeskFormSubmission[]> {
  const remote = await tryPbList('form_submissions')
  const all = remote ? remote.map(mapSubmission) : orgStore.list<DeskFormSubmission>('form_submissions')
  return formId ? all.filter((s) => s.form_id === formId) : all
}

export async function submitForm(input: {
  form_id: string
  payload: Record<string, string>
  contact_id?: string
}): Promise<DeskFormSubmission> {
  const remote = await tryPbCreate('form_submissions', {
    form_id: input.form_id,
    contact_id: input.contact_id || '',
    payload_json: JSON.stringify(input.payload),
  })
  const row: DeskFormSubmission = remote
    ? mapSubmission(remote)
    : orgStore.create<DeskFormSubmission>('form_submissions', {
        id: newId(),
        form_id: input.form_id,
        contact_id: input.contact_id,
        payload: input.payload,
        created: new Date().toISOString(),
      })

  if (input.contact_id) {
    await createActivity({
      contact_id: input.contact_id,
      type: 'note',
      subject: 'Form submission',
      body: JSON.stringify(input.payload),
    })
  }
  await runAutomationsForTrigger('form_submitted', { form_id: input.form_id, contact_id: input.contact_id || '' })
  return row
}

function mapThread(r: Record<string, unknown>): DeskChatThread {
  const labelRaw = r.label_ids
  let label_ids: string[] | undefined
  if (Array.isArray(labelRaw)) label_ids = labelRaw.map(String)
  else if (typeof labelRaw === 'string' && labelRaw.trim()) {
    try {
      const parsed = JSON.parse(labelRaw) as unknown
      if (Array.isArray(parsed)) label_ids = parsed.map(String)
    } catch {
      label_ids = undefined
    }
  }
  return mergeChatThreadMeta({
    id: String(r.id),
    visitor_name: String(r.visitor_name ?? 'Visitor'),
    visitor_email: r.visitor_email ? String(r.visitor_email) : undefined,
    contact_id: r.contact_id ? String(r.contact_id) : undefined,
    status: (String(r.status ?? 'open') as 'open' | 'closed') || 'open',
    last_message_at: String(r.last_message_at ?? r.created ?? new Date().toISOString()),
    pinned: 'pinned' in r ? Boolean(r.pinned) : undefined,
    archived: 'archived' in r ? Boolean(r.archived) : undefined,
    draft_body: 'draft_body' in r ? (r.draft_body ? String(r.draft_body) : '') : undefined,
    agent_last_read_at: r.agent_last_read_at ? String(r.agent_last_read_at) : undefined,
    assignee_id: 'assignee_id' in r ? (r.assignee_id ? String(r.assignee_id) : '') : undefined,
    spam: 'spam' in r ? Boolean(r.spam) : undefined,
    trashed: 'trashed' in r ? Boolean(r.trashed) : undefined,
    label_ids,
    created: r.created ? String(r.created) : undefined,
  })
}

function mapMessage(r: Record<string, unknown>): DeskChatMessage {
  return {
    id: String(r.id),
    thread_id: String(r.thread_id ?? ''),
    sender: (String(r.sender ?? 'visitor') as 'visitor' | 'agent') || 'visitor',
    body: String(r.body ?? ''),
    created: String(r.created ?? new Date().toISOString()),
  }
}

export async function listChatThreads(): Promise<DeskChatThread[]> {
  const remote = await tryPbList('chat_threads')
  const threads = remote ? remote.map(mapThread) : orgStore.list<DeskChatThread>('chat_threads').map(mergeChatThreadMeta)
  return threads.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
}

export async function listChatMessages(threadId: string): Promise<DeskChatMessage[]> {
  const remote = await tryPbList('chat_messages')
  const all = remote ? remote.map(mapMessage) : orgStore.list<DeskChatMessage>('chat_messages')
  return all.filter((m) => m.thread_id === threadId).sort((a, b) => a.created.localeCompare(b.created))
}

export async function listAllChatMessages(): Promise<DeskChatMessage[]> {
  const remote = await tryPbList('chat_messages')
  return remote ? remote.map(mapMessage) : orgStore.list<DeskChatMessage>('chat_messages')
}

export async function createChatThread(input: {
  visitor_name: string
  visitor_email?: string
  contact_id?: string
  first_message: string
}): Promise<{ thread: DeskChatThread; message: DeskChatMessage }> {
  const now = new Date().toISOString()
  const remoteThread = await tryPbCreate('chat_threads', {
    visitor_name: input.visitor_name,
    visitor_email: input.visitor_email || '',
    contact_id: input.contact_id || '',
    status: 'open',
    last_message_at: now,
    pinned: false,
    archived: false,
  })
  const thread: DeskChatThread = remoteThread
    ? mapThread(remoteThread)
    : mergeChatThreadMeta(
        orgStore.create<DeskChatThread>('chat_threads', {
          id: newId(),
          visitor_name: input.visitor_name,
          visitor_email: input.visitor_email,
          contact_id: input.contact_id,
          status: 'open',
          last_message_at: now,
          pinned: false,
          archived: false,
          created: now,
        }),
      )

  const message = await postChatMessage({ thread_id: thread.id, sender: 'visitor', body: input.first_message })
  return { thread, message }
}

export async function updateChatThread(
  id: string,
  patch: Partial<
    Pick<
      DeskChatThread,
      | 'pinned'
      | 'archived'
      | 'draft_body'
      | 'agent_last_read_at'
      | 'contact_id'
      | 'status'
      | 'last_message_at'
      | 'assignee_id'
      | 'spam'
      | 'trashed'
      | 'label_ids'
    >
  >,
): Promise<DeskChatThread> {
  const body: Record<string, unknown> = { ...patch }
  if (patch.draft_body !== undefined) body.draft_body = patch.draft_body
  if (patch.label_ids !== undefined) body.label_ids = JSON.stringify(patch.label_ids)
  if (patch.assignee_id === undefined) {
    /* keep */
  } else if (!patch.assignee_id) {
    body.assignee_id = ''
  }
  const remote = await tryPbUpdate('chat_threads', id, body)
  const metaPatch: Parameters<typeof patchChatThreadMeta>[1] = {}
  if (patch.pinned !== undefined) metaPatch.pinned = patch.pinned
  if (patch.archived !== undefined) metaPatch.archived = patch.archived
  if (patch.draft_body !== undefined) metaPatch.draft_body = patch.draft_body
  if (patch.agent_last_read_at !== undefined) metaPatch.agent_last_read_at = patch.agent_last_read_at
  if (patch.assignee_id !== undefined) metaPatch.assignee_id = patch.assignee_id || null
  if (patch.spam !== undefined) metaPatch.spam = patch.spam
  if (patch.trashed !== undefined) metaPatch.trashed = patch.trashed
  if (patch.label_ids !== undefined) metaPatch.label_ids = patch.label_ids
  if (Object.keys(metaPatch).length > 0) patchChatThreadMeta(id, metaPatch)
  if (remote) return mapThread(remote)
  try {
    const updated = orgStore.update<DeskChatThread>('chat_threads', id, patch)
    return mergeChatThreadMeta(updated)
  } catch {
    const threads = await listChatThreads()
    const found = threads.find((t) => t.id === id)
    if (found) return mergeChatThreadMeta({ ...found, ...patch })
    throw new Error('Thread not found')
  }
}

export async function markThreadRead(id: string): Promise<DeskChatThread> {
  return updateChatThread(id, { agent_last_read_at: new Date().toISOString() })
}

export async function setThreadPinned(id: string, pinned: boolean): Promise<DeskChatThread> {
  return updateChatThread(id, { pinned })
}

export async function setThreadArchived(id: string, archived: boolean): Promise<DeskChatThread> {
  return updateChatThread(id, { archived })
}

export async function postChatMessage(input: {
  thread_id: string
  sender: 'visitor' | 'agent'
  body: string
}): Promise<DeskChatMessage> {
  const now = new Date().toISOString()
  const remote = await tryPbCreate('chat_messages', {
    thread_id: input.thread_id,
    sender: input.sender,
    body: input.body,
  })
  const message: DeskChatMessage = remote
    ? mapMessage(remote)
    : orgStore.create<DeskChatMessage>('chat_messages', {
        id: newId(),
        thread_id: input.thread_id,
        sender: input.sender,
        body: input.body,
        created: now,
      })

  const threads = await listChatThreads()
  const t = threads.find((x) => x.id === input.thread_id)
  if (t) {
    await tryPbUpdate('chat_threads', t.id, { last_message_at: now })
    try {
      orgStore.update<DeskChatThread>('chat_threads', t.id, { last_message_at: now })
    } catch {
      /* may only exist remotely */
    }
    if (input.sender === 'agent') {
      await updateChatThread(t.id, { draft_body: '', agent_last_read_at: now, last_message_at: now })
    } else {
      await updateChatThread(t.id, { last_message_at: now })
    }
  }

  if (input.sender === 'visitor' && t?.contact_id) {
    await createActivity({
      contact_id: t.contact_id,
      type: 'note',
      subject: 'Chat message',
      body: input.body,
    })
  }
  await runAutomationsForTrigger('chat_message', {
    thread_id: input.thread_id,
    contact_id: t?.contact_id || '',
  })
  return message
}

function mapAutomation(r: Record<string, unknown>): DeskAutomation {
  const { config, workflow } = parseConfigPayload(r.config_json ?? r.config)
  const trigger = (String(r.trigger ?? 'activity_logged') as AutomationTrigger) || 'activity_logged'
  const action = (String(r.action ?? 'create_activity') as AutomationAction) || 'create_activity'
  const ensured = workflow && workflow.nodes.length > 0 ? workflow : undefined
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    enabled: r.enabled !== false,
    trigger: ensured ? triggerFromWorkflow(ensured) || trigger : trigger,
    action: ensured ? primaryActionFromWorkflow(ensured) : action,
    config,
    workflow: ensured,
    created: r.created ? String(r.created) : undefined,
  }
}

function normalizeLocalAutomation(row: DeskAutomation): DeskAutomation {
  const workflow = ensureWorkflow(row)
  return {
    ...row,
    trigger: triggerFromWorkflow(workflow) || row.trigger,
    action: primaryActionFromWorkflow(workflow),
    workflow,
  }
}

export async function listAutomations(): Promise<DeskAutomation[]> {
  const remote = await tryPbList('automations')
  if (remote) return remote.map(mapAutomation)
  return orgStore.list<DeskAutomation>('automations').map(normalizeLocalAutomation)
}

export async function createAutomation(input: {
  name: string
  trigger: AutomationTrigger
  action?: AutomationAction
  config?: Record<string, string>
  workflow?: AutomationWorkflow
  enabled?: boolean
}): Promise<DeskAutomation> {
  const workflow =
    input.workflow ?? legacyToWorkflow(input.trigger, input.action ?? 'create_activity', input.config ?? {})
  const action = primaryActionFromWorkflow(workflow)
  const trigger = triggerFromWorkflow(workflow) || input.trigger
  const config = input.config ?? {}
  const config_json = serializeConfigPayload(config, workflow)
  const remote = await tryPbCreate('automations', {
    name: input.name,
    trigger,
    action,
    config_json,
    enabled: input.enabled ?? true,
  })
  if (remote) return mapAutomation(remote)
  return orgStore.create<DeskAutomation>('automations', {
    id: newId(),
    name: input.name,
    trigger,
    action,
    config,
    workflow,
    enabled: input.enabled ?? true,
    created: new Date().toISOString(),
  })
}

export async function updateAutomation(id: string, patch: Partial<DeskAutomation>): Promise<DeskAutomation> {
  const body: Record<string, unknown> = {}
  if (patch.name !== undefined) body.name = patch.name
  if (patch.enabled !== undefined) body.enabled = patch.enabled

  let nextWorkflow = patch.workflow
  let nextConfig = patch.config
  let nextTrigger = patch.trigger
  let nextAction = patch.action

  if (patch.workflow) {
    nextTrigger = triggerFromWorkflow(patch.workflow) || patch.trigger
    nextAction = primaryActionFromWorkflow(patch.workflow)
  }

  if (nextTrigger !== undefined) body.trigger = nextTrigger
  if (nextAction !== undefined) body.action = nextAction

  if (patch.workflow !== undefined || patch.config !== undefined) {
    const existing = (await listAutomations()).find((a) => a.id === id)
    const config = nextConfig ?? existing?.config ?? {}
    const workflow = nextWorkflow ?? existing?.workflow
    body.config_json = serializeConfigPayload(config, workflow)
  }

  const remote = await tryPbUpdate('automations', id, body)
  if (remote) return mapAutomation(remote)

  const localPatch: Partial<DeskAutomation> = { ...patch }
  if (nextTrigger !== undefined) localPatch.trigger = nextTrigger
  if (nextAction !== undefined) localPatch.action = nextAction
  if (patch.workflow !== undefined || patch.config !== undefined) {
    localPatch.config = nextConfig ?? patch.config
    localPatch.workflow = nextWorkflow ?? patch.workflow
  }
  return normalizeLocalAutomation(orgStore.update<DeskAutomation>('automations', id, localPatch))
}

export async function deleteAutomation(id: string): Promise<void> {
  const ok = await tryPbDelete('automations', id)
  if (!ok) orgStore.remove('automations', id)
}

async function applyContactTag(contactId: string, tag: string): Promise<void> {
  if (!contactId || !tag.trim()) return
  const trimmed = tag.trim()
  try {
    const pb = getPocketBase()
    const client = await pb.collection('clients').getOne(contactId)
    const tags = Array.isArray((client as { tags?: string[] }).tags)
      ? [...((client as { tags?: string[] }).tags as string[])]
      : []
    if (!tags.includes(trimmed)) tags.push(trimmed)
    await pb.collection('clients').update(contactId, { tags })
  } catch {
    await createActivity({
      contact_id: contactId,
      type: 'note',
      subject: `Tag: ${trimmed}`,
      body: `Automation would add tag “${trimmed}”`,
    })
  }
}

async function executeActionNode(
  kind: AutomationAction,
  data: Record<string, string | undefined>,
  ctx: Record<string, string>,
  automationName: string,
  trigger: AutomationTrigger,
): Promise<void> {
  const contactId = ctx.contact_id
  if (!contactId) return

  if (kind === 'create_activity') {
    await createActivity({
      contact_id: contactId,
      type: 'note',
      subject: brandedSubject(data.subject, data.appId, `Automation: ${automationName}`),
      body: data.body || `Triggered by ${trigger}`,
      deal_id: ctx.lead_id || undefined,
    })
    return
  }

  if (kind === 'notify') {
    await createActivity({
      contact_id: contactId,
      type: 'note',
      subject: brandedSubject(data.subject, data.appId, `Log note: ${automationName}`),
      body: data.message || data.body || 'Automation log note',
      deal_id: ctx.lead_id || undefined,
    })
    return
  }

  if (kind === 'update_contact_tag') {
    await applyContactTag(contactId, data.tag || 'automated')
  }
}

async function runWorkflow(
  automation: DeskAutomation,
  trigger: AutomationTrigger,
  ctx: Record<string, string>,
): Promise<void> {
  const workflow = ensureWorkflow(automation)
  const triggerNode =
    workflow.nodes.find((n) => n.type === 'trigger' && n.data.kind === trigger) ??
    workflow.nodes.find((n) => n.type === 'trigger')
  if (!triggerNode) return

  let queue = nextNodes(workflow, triggerNode.id)
  let steps = 0
  while (queue.length > 0 && steps < MAX_RUNNER_STEPS) {
    const node = queue.shift()!
    steps += 1

    if (node.type === 'action') {
      const kind = node.data.kind
      if (!kind || !isAutomationAction(kind)) {
        // Non-CRM placeholder (e.g. Zapier stub) — skip execution, continue graph
        queue.push(...nextNodes(workflow, node.id))
        continue
      }
      await executeActionNode(kind, node.data, ctx, automation.name, trigger)
      queue.push(...nextNodes(workflow, node.id))
      continue
    }

    if (node.type === 'condition') {
      const pass = evaluateCondition(node.data, ctx)
      queue.push(...nextNodes(workflow, node.id, pass ? 'true' : 'false'))
      continue
    }

    if (node.type === 'trigger') {
      queue.push(...nextNodes(workflow, node.id))
    }
  }
}

export async function runAutomationsForTrigger(
  trigger: AutomationTrigger,
  ctx: Record<string, string>,
): Promise<void> {
  const rules = (await listAutomations()).filter((a) => a.enabled && a.trigger === trigger)
  for (const rule of rules) {
    await runWorkflow(rule, trigger, ctx)
  }
}

/** Lightweight AI assist — rule-based suggestions from CRM context (Wave 9). */
export { buildAiSuggestionLines as buildAiSuggestions } from './ai-assist'
