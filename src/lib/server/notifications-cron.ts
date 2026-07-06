import { authenticateServerPocketBase } from './pocketbase-admin'
import { getAppNotificationsForOrg, sendPushNotificationForOrg } from './push'

export type NotificationType =
  | 'job_reminder'
  | 'morning_reminder'
  | 'follow_up'
  | 'invoice_overdue'
  | 'low_inventory'

export interface CronResult {
  created: number
  pushed: number
  pushFailed: number
  details: string[]
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return fmtDate(d)
}

function today(): string {
  return fmtDate(new Date())
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return fmtDate(d)
}

type Pb = Awaited<ReturnType<typeof authenticateServerPocketBase>>

async function notificationExists(
  pb: Pb,
  orgId: string,
  type: NotificationType,
  referenceId: string,
  scheduledFor: string,
): Promise<boolean> {
  const records = await pb.collection('notifications_log').getFullList({
    filter: `organization_id = "${orgId}" && type = "${type}" && reference_id = "${referenceId}" && scheduled_for = "${scheduledFor}"`,
    limit: 1,
  })
  return records.length > 0
}

async function createNotification(
  pb: Pb,
  orgId: string,
  type: NotificationType,
  referenceId: string,
  scheduledFor: string,
): Promise<boolean> {
  if (await notificationExists(pb, orgId, type, referenceId, scheduledFor)) return false

  await pb.collection('notifications_log').create({
    organization_id: orgId,
    type,
    reference_id: referenceId,
    scheduled_for: scheduledFor,
    status: 'pending',
  })
  return true
}

const typeToSetting: Record<NotificationType, keyof Awaited<ReturnType<typeof getAppNotificationsForOrg>>> = {
  job_reminder: 'job_reminder',
  morning_reminder: 'morning_reminder',
  follow_up: 'follow_up',
  invoice_overdue: 'invoice_overdue',
  low_inventory: 'low_inventory',
}

async function runNotificationsCronForOrg(
  pb: Pb,
  orgId: string,
  orgSlug: string,
): Promise<CronResult> {
  const settings = await getAppNotificationsForOrg(orgId)
  const result: CronResult = { created: 0, pushed: 0, pushFailed: 0, details: [] }

  const tmr = tomorrow()
  const td = today()
  const orgFilter = `organization_id = "${orgId}"`

  if (settings.job_reminder !== false) {
    const jobs = await pb.collection('jobs').getFullList({
      filter: `${orgFilter} && date = "${tmr}" && status = "scheduled"`,
      expand: 'client_id',
    })
    for (const job of jobs) {
      const created = await createNotification(pb, orgId, 'job_reminder', job.id, tmr)
      if (created) {
        result.created++
        const client = job.expand?.client_id as { name?: string } | undefined
        const push = await sendPushNotificationForOrg(orgId, {
          title: 'Job tomorrow',
          body: `${client?.name ?? 'Client'} — ${job.date}`,
          url: `/jobs/${job.id}`,
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
        result.details.push(`${orgSlug}: job_reminder ${job.id}`)
      }
    }
  }

  if (settings.morning_reminder !== false) {
    const jobs = await pb.collection('jobs').getFullList({
      filter: `${orgFilter} && date = "${td}" && (status = "scheduled" || status = "in_progress")`,
      expand: 'client_id',
    })
    for (const job of jobs) {
      const created = await createNotification(pb, orgId, 'morning_reminder', job.id, td)
      if (created) {
        result.created++
        const client = job.expand?.client_id as { name?: string } | undefined
        const push = await sendPushNotificationForOrg(orgId, {
          title: "Today's jobs",
          body: `${client?.name ?? 'Client'} scheduled today`,
          url: `/jobs/${job.id}`,
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
      }
    }
  }

  if (settings.follow_up !== false) {
    const cutoff = daysAgo(3)
    const jobs = await pb.collection('jobs').getFullList({
      filter: `${orgFilter} && date = "${cutoff}" && status = "completed"`,
      expand: 'client_id',
    })
    for (const job of jobs) {
      const created = await createNotification(pb, orgId, 'follow_up', job.id, td)
      if (created) {
        result.created++
        const client = job.expand?.client_id as { name?: string } | undefined
        const push = await sendPushNotificationForOrg(orgId, {
          title: 'Follow up',
          body: `Check in with ${client?.name ?? 'client'} — job 3 days ago`,
          url: `/jobs/${job.id}`,
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
      }
    }
  }

  if (settings.invoice_overdue !== false) {
    const cutoff = daysAgo(3)
    const invoices = await pb.collection('invoices').getFullList({
      filter: `${orgFilter} && (status = "sent" || status = "partial" || status = "overdue") && sent_at != "" && sent_at <= "${cutoff}"`,
    })
    for (const inv of invoices) {
      const created = await createNotification(pb, orgId, 'invoice_overdue', inv.id, td)
      if (created) {
        result.created++
        await pb.collection('invoices').update(inv.id, { status: 'overdue' })
        const push = await sendPushNotificationForOrg(orgId, {
          title: 'Invoice overdue',
          body: `${inv.invoice_number} — $${Number(inv.balance_due ?? inv.total).toFixed(2)} due`,
          url: `/jobs/${inv.job_id}`,
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
        result.details.push(`${orgSlug}: invoice_overdue ${inv.invoice_number}`)
      }
    }
  }

  if (settings.low_inventory !== false) {
    const supplies = await pb.collection('supplies').getFullList({
      filter: orgFilter,
    })
    for (const supply of supplies) {
      const qty = Number(supply.quantity_on_hand ?? 0)
      const threshold = Number(supply.reorder_threshold ?? 0)
      if (threshold <= 0 || qty > threshold) continue

      const created = await createNotification(pb, orgId, 'low_inventory', supply.id, td)
      if (created) {
        result.created++
        const push = await sendPushNotificationForOrg(orgId, {
          title: 'Low inventory',
          body: `${supply.name}: ${qty} ${supply.unit} on hand`,
          url: '/inventory',
        })
        result.pushed += push.sent
        result.pushFailed += push.failed
        result.details.push(`${orgSlug}: low_inventory ${supply.name}`)
      }
    }
  }

  const pending = await pb.collection('notifications_log').getFullList({
    filter: `${orgFilter} && status = "pending"`,
  })
  for (const entry of pending) {
    const settingKey = typeToSetting[entry.type as NotificationType]
    if (settingKey && settings[settingKey] === false) continue
    await pb.collection('notifications_log').update(entry.id, {
      status: 'sent',
      sent_at: new Date().toISOString().slice(0, 10),
    })
  }

  return result
}

export async function runNotificationsCronForOrganization(organizationId: string): Promise<CronResult> {
  const pb = await authenticateServerPocketBase()
  const org = await pb.collection('organizations').getOne(organizationId)
  return runNotificationsCronForOrg(pb, organizationId, String(org.slug ?? org.id))
}

export async function runNotificationsCron(): Promise<CronResult> {
  const pb = await authenticateServerPocketBase()
  const orgs = await pb.collection('organizations').getFullList()

  const combined: CronResult = { created: 0, pushed: 0, pushFailed: 0, details: [] }

  for (const org of orgs) {
    const orgResult = await runNotificationsCronForOrg(pb, org.id, String(org.slug ?? org.id))
    combined.created += orgResult.created
    combined.pushed += orgResult.pushed
    combined.pushFailed += orgResult.pushFailed
    combined.details.push(...orgResult.details)
  }

  return combined
}
