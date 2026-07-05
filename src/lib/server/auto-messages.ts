import { DEFAULT_AUTO_TEMPLATES, type AutoMessageTemplate } from '../messages'
import { authenticateServerPocketBase } from './pocketbase-admin'
import { createPortalToken, getAppBaseUrl } from './portal-tokens'
import { Resend } from 'resend'

export interface MessageSendContext {
  clientName: string
  clientEmail?: string
  packageName: string
  jobDate: string
  startTime?: string
  clientId: string
  organizationId: string
  jobId?: string
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtTime(t?: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h)) return t
  const d = new Date()
  d.setHours(h, m ?? 0, 0, 0)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export async function mergeTemplateBody(
  template: string,
  ctx: MessageSendContext,
  portalUrl?: string
): Promise<string> {
  const reviewLink = process.env.NEXT_PUBLIC_REVIEW_URL ?? 'https://g.page/review'
  return template
    .replace(/\{\{name\}\}/g, ctx.clientName.split(' ')[0] || ctx.clientName)
    .replace(/\{\{package\}\}/g, ctx.packageName)
    .replace(/\{\{time\}\}/g, fmtTime(ctx.startTime))
    .replace(/\{\{date\}\}/g, fmtDate(ctx.jobDate))
    .replace(/\{\{portal_link\}\}/g, portalUrl ?? `${getAppBaseUrl()}/portal`)
    .replace(/\{\{review_link\}\}/g, reviewLink)
}

export async function loadAutoMessageTemplatesForOrg(orgId: string): Promise<AutoMessageTemplate[]> {
  const pb = await authenticateServerPocketBase()
  const orgEsc = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb.collection('app_settings').getFullList({
    filter: `organization_id = "${orgEsc}"`,
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
}

export async function saveAutoMessageTemplatesForOrg(
  orgId: string,
  templates: AutoMessageTemplate[]
): Promise<void> {
  const pb = await authenticateServerPocketBase()
  const orgEsc = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb.collection('app_settings').getFullList({
    filter: `organization_id = "${orgEsc}"`,
    limit: 1,
  })
  const payload = templates.map(({ id, enabled, emailBody }) => ({ id, enabled, emailBody }))
  if (records.length === 0) {
    await pb.collection('app_settings').create({
      organization_id: orgId,
      business_name: '',
      business_phone: '',
      business_email: '',
      business_address: '',
      invoice_terms_footer: '',
      notifications: {},
      auto_messages: payload,
    })
    return
  }
  await pb.collection('app_settings').update(records[0].id, { auto_messages: payload })
}

async function messageAlreadySent(
  orgId: string,
  templateId: string,
  referenceId: string
): Promise<boolean> {
  const pb = await authenticateServerPocketBase()
  const orgEsc = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const refEsc = referenceId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb.collection('sent_messages').getFullList({
    filter: `organization_id = "${orgEsc}" && template_id = "${templateId}" && reference_id = "${refEsc}"`,
    limit: 1,
  })
  return records.length > 0
}

async function logSentMessage(input: {
  organizationId: string
  clientId: string
  templateId: string
  preview: string
  body: string
  status: 'sent' | 'failed'
  error?: string
  referenceId: string
}): Promise<void> {
  const pb = await authenticateServerPocketBase()
  await pb.collection('sent_messages').create({
    organization_id: input.organizationId,
    client_id: input.clientId,
    template_id: input.templateId,
    channel: 'email',
    preview: input.preview.slice(0, 160),
    body: input.body,
    status: input.status,
    error: input.error ?? '',
    reference_id: input.referenceId,
    sent_at: new Date().toISOString().slice(0, 10),
  })
}

async function sendEmail(to: string, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Resend not configured' }
  const resend = new Resend(apiKey)
  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text: body,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function sendAutoMessage(
  template: AutoMessageTemplate,
  ctx: MessageSendContext,
  referenceId: string
): Promise<boolean> {
  if (!template.enabled) return false
  if (await messageAlreadySent(ctx.organizationId, template.id, referenceId)) return false

  const email = ctx.clientEmail?.trim()
  if (!email) {
    await logSentMessage({
      organizationId: ctx.organizationId,
      clientId: ctx.clientId,
      templateId: template.id,
      preview: '',
      body: '',
      status: 'failed',
      error: 'Client has no email on file',
      referenceId,
    })
    return false
  }

  let portalUrl: string | undefined
  if (ctx.jobId && template.emailBody.includes('{{portal_link}}')) {
    try {
      const { url } = await createPortalToken({
        clientId: ctx.clientId,
        scope: 'full',
        jobId: ctx.jobId,
      })
      portalUrl = url
    } catch {
      portalUrl = undefined
    }
  }

  const body = await mergeTemplateBody(template.emailBody, ctx, portalUrl)
  const result = await sendEmail(email, `${template.name} — ${ctx.packageName}`, body)

  await logSentMessage({
    organizationId: ctx.organizationId,
    clientId: ctx.clientId,
    templateId: template.id,
    preview: body.slice(0, 120),
    body,
    status: result.ok ? 'sent' : 'failed',
    error: result.error,
    referenceId,
  })

  return result.ok
}

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function runAutoMessagesCron(): Promise<{ sent: number; failed: number; details: string[] }> {
  const pb = await authenticateServerPocketBase()
  const orgs = await pb.collection('organizations').getFullList({ limit: 200 })
  let sent = 0
  let failed = 0
  const details: string[] = []

  const tomorrow = dateOffset(1)
  const yesterday = dateOffset(-1)
  const thirtyDaysAgo = dateOffset(-30)
  const today = dateOffset(0)

  for (const org of orgs) {
    const orgId = String(org.id)
    const templates = await loadAutoMessageTemplatesForOrg(orgId)
    const byId = Object.fromEntries(templates.map((t) => [t.id, t]))

    const orgEsc = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

    const reminderTemplate = byId.appointment_reminder
    if (reminderTemplate?.enabled) {
      const jobs = await pb.collection('jobs').getFullList({
        filter: `organization_id = "${orgEsc}" && date = "${tomorrow}" && status = "scheduled"`,
        expand: 'client_id,package_id',
      })
      for (const job of jobs) {
        const client = job.expand?.client_id
        const pkg = job.expand?.package_id
        if (!client) continue
        const ctx: MessageSendContext = {
          clientName: String(client.name ?? 'Client'),
          clientEmail: client.email ? String(client.email) : undefined,
          packageName: pkg ? String(pkg.name) : 'Detail',
          jobDate: String(job.date),
          startTime: job.start_time ? String(job.start_time) : undefined,
          clientId: String(client.id),
          organizationId: orgId,
          jobId: String(job.id),
        }
        const ok = await sendAutoMessage(reminderTemplate, ctx, `job:${job.id}:reminder`)
        if (ok) sent++
        else failed++
      }
    }

    const completionTemplate = byId.job_completion
    if (completionTemplate?.enabled) {
      const jobs = await pb.collection('jobs').getFullList({
        filter: `organization_id = "${orgEsc}" && status = "completed" && date = "${today}"`,
        expand: 'client_id,package_id',
      })
      for (const job of jobs) {
        const client = job.expand?.client_id
        const pkg = job.expand?.package_id
        if (!client) continue
        const ctx: MessageSendContext = {
          clientName: String(client.name ?? 'Client'),
          clientEmail: client.email ? String(client.email) : undefined,
          packageName: pkg ? String(pkg.name) : 'Detail',
          jobDate: String(job.date),
          startTime: job.start_time ? String(job.start_time) : undefined,
          clientId: String(client.id),
          organizationId: orgId,
          jobId: String(job.id),
        }
        const ok = await sendAutoMessage(completionTemplate, ctx, `job:${job.id}:complete`)
        if (ok) sent++
        else failed++
      }
    }

    const reviewTemplate = byId.review_request
    if (reviewTemplate?.enabled) {
      const jobs = await pb.collection('jobs').getFullList({
        filter: `organization_id = "${orgEsc}" && status = "completed" && date = "${yesterday}"`,
        expand: 'client_id,package_id',
      })
      for (const job of jobs) {
        const client = job.expand?.client_id
        const pkg = job.expand?.package_id
        if (!client) continue
        const ctx: MessageSendContext = {
          clientName: String(client.name ?? 'Client'),
          clientEmail: client.email ? String(client.email) : undefined,
          packageName: pkg ? String(pkg.name) : 'Detail',
          jobDate: String(job.date),
          clientId: String(client.id),
          organizationId: orgId,
          jobId: String(job.id),
        }
        const ok = await sendAutoMessage(reviewTemplate, ctx, `job:${job.id}:review`)
        if (ok) sent++
        else failed++
      }
    }

    const followTemplate = byId.follow_up
    if (followTemplate?.enabled) {
      const clients = await pb.collection('clients').getFullList({
        filter: `organization_id = "${orgEsc}"`,
      })
      for (const client of clients) {
        const clientId = String(client.id)
        const clientEsc = clientId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        const jobs = await pb.collection('jobs').getFullList({
          filter: `organization_id = "${orgEsc}" && client_id = "${clientEsc}" && status = "completed"`,
          sort: '-date',
          limit: 1,
          expand: 'package_id',
        })
        const lastJob = jobs[0]
        if (!lastJob || String(lastJob.date) > thirtyDaysAgo) continue
        const pkg = lastJob.expand?.package_id
        const ctx: MessageSendContext = {
          clientName: String(client.name ?? 'Client'),
          clientEmail: client.email ? String(client.email) : undefined,
          packageName: pkg ? String(pkg.name) : 'Detail',
          jobDate: String(lastJob.date),
          clientId,
          organizationId: orgId,
          jobId: String(lastJob.id),
        }
        const ok = await sendAutoMessage(followTemplate, ctx, `client:${clientId}:followup:${thirtyDaysAgo}`)
        if (ok) sent++
        else failed++
      }
    }
  }

  details.push(`Auto-messages: ${sent} sent, ${failed} failed/skipped`)
  return { sent, failed, details }
}

export async function listSentMessagesForOrg(orgId: string, limit = 50) {
  const pb = await authenticateServerPocketBase()
  const orgEsc = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb.collection('sent_messages').getFullList({
    filter: `organization_id = "${orgEsc}"`,
    sort: '-sent_at',
    limit,
    expand: 'client_id',
  })
  return records.map((r) => ({
    id: String(r.id),
    client_name: r.expand?.client_id?.name ? String(r.expand.client_id.name) : 'Client',
    preview: String(r.preview ?? ''),
    body: String(r.body ?? ''),
    channel: String(r.channel) as 'sms' | 'email',
    sent_at: String(r.sent_at ?? r.created ?? ''),
    status: String(r.status) as 'sent' | 'failed',
  }))
}
