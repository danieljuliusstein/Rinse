import webpush from 'web-push'
import { authenticateServerPocketBase } from './pocketbase-admin'

export interface PushSubscriptionJSON {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface StoredNotifications {
  job_reminder?: boolean
  morning_reminder?: boolean
  follow_up?: boolean
  invoice_overdue?: boolean
  low_inventory?: boolean
  push_subscriptions?: PushSubscriptionJSON[]
}

function ensureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@detailing.local'

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured')
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return { publicKey }
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null
}

async function getSettingsRecordForOrg(orgId: string) {
  const pb = await authenticateServerPocketBase()
  const records = await pb.collection('app_settings').getFullList({
    filter: `organization_id = "${orgId}"`,
    limit: 1,
  })
  return { pb, record: records[0] ?? null }
}

export async function getAppNotificationsForOrg(orgId: string): Promise<StoredNotifications> {
  try {
    const { record } = await getSettingsRecordForOrg(orgId)
    if (!record) return {}
    const notifications = record.notifications
    return (typeof notifications === 'object' && notifications !== null
      ? notifications
      : {}) as StoredNotifications
  } catch {
    return {}
  }
}

/** @deprecated Use getAppNotificationsForOrg */
export async function getAppNotifications(): Promise<StoredNotifications> {
  try {
    const pb = await authenticateServerPocketBase()
    const records = await pb.collection('app_settings').getFullList({ limit: 1 })
    if (records.length === 0) return {}
    const notifications = records[0].notifications
    return (typeof notifications === 'object' && notifications !== null
      ? notifications
      : {}) as StoredNotifications
  } catch {
    return {}
  }
}

export async function savePushSubscription(
  subscription: PushSubscriptionJSON,
  organizationId: string,
): Promise<void> {
  const { pb, record } = await getSettingsRecordForOrg(organizationId)
  if (!record) {
    throw new Error('App settings not found for organization')
  }

  const current: StoredNotifications =
    typeof record.notifications === 'object'
      ? (record.notifications as StoredNotifications)
      : {}

  const subs = current.push_subscriptions ?? []
  const exists = subs.some((s) => s.endpoint === subscription.endpoint)
  const push_subscriptions = exists ? subs : [...subs, subscription]

  await pb.collection('app_settings').update(record.id, {
    notifications: { ...current, push_subscriptions },
  })
}

export async function removePushSubscription(
  endpoint: string,
  organizationId?: string,
): Promise<void> {
  const pb = await authenticateServerPocketBase()

  if (organizationId) {
    const { record } = await getSettingsRecordForOrg(organizationId)
    if (!record) return
    const current = (record.notifications ?? {}) as StoredNotifications
    const push_subscriptions = (current.push_subscriptions ?? []).filter(
      (s) => s.endpoint !== endpoint,
    )
    await pb.collection('app_settings').update(record.id, {
      notifications: { ...current, push_subscriptions },
    })
    return
  }

  const records = await pb.collection('app_settings').getFullList()
  for (const record of records) {
    const current = (record.notifications ?? {}) as StoredNotifications
    const push_subscriptions = (current.push_subscriptions ?? []).filter(
      (s) => s.endpoint !== endpoint,
    )
    if (push_subscriptions.length !== (current.push_subscriptions ?? []).length) {
      await pb.collection('app_settings').update(record.id, {
        notifications: { ...current, push_subscriptions },
      })
    }
  }
}

export async function sendPushNotificationForOrg(
  organizationId: string,
  payload: { title: string; body: string; url?: string },
): Promise<{ sent: number; failed: number }> {
  ensureVapid()
  const settings = await getAppNotificationsForOrg(organizationId)
  const subs = settings.push_subscriptions ?? []

  let sent = 0
  let failed = 0

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        sub as webpush.PushSubscription,
        JSON.stringify(payload),
      )
      sent++
    } catch (err) {
      failed++
      const status = err && typeof err === 'object' && 'statusCode' in err
        ? (err as { statusCode: number }).statusCode
        : 0
      if (status === 404 || status === 410) {
        await removePushSubscription(sub.endpoint, organizationId)
      }
    }
  }

  return { sent, failed }
}

/** @deprecated Use sendPushNotificationForOrg */
export async function sendPushNotification(
  payload: { title: string; body: string; url?: string },
): Promise<{ sent: number; failed: number }> {
  ensureVapid()
  const settings = await getAppNotifications()
  const subs = settings.push_subscriptions ?? []

  let sent = 0
  let failed = 0

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        sub as webpush.PushSubscription,
        JSON.stringify(payload),
      )
      sent++
    } catch (err) {
      failed++
      const status = err && typeof err === 'object' && 'statusCode' in err
        ? (err as { statusCode: number }).statusCode
        : 0
      if (status === 404 || status === 410) {
        await removePushSubscription(sub.endpoint)
      }
    }
  }

  return { sent, failed }
}
