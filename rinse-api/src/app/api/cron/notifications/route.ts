import { NextResponse } from 'next/server'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { runAutoMessagesCron, runAutoMessagesCronForOrg } from '@/lib/server/auto-messages'
import {
  runNotificationsCron,
  runNotificationsCronForOrganization,
} from '@/lib/server/notifications-cron'
import { authenticateRequestUser } from '@/lib/server/request-auth'

async function runCronForOrganization(organizationId: string) {
  const result = await runNotificationsCronForOrganization(organizationId)
  const messages = await runAutoMessagesCronForOrg(organizationId)
  return NextResponse.json({
    ok: true,
    scope: 'organization',
    organizationId,
    ...result,
    messagesSent: messages.sent,
    messagesFailed: messages.failed,
    details: [...result.details, ...messages.details],
  })
}

async function runCronForAllOrganizations() {
  const result = await runNotificationsCron()
  const messages = await runAutoMessagesCron()
  return NextResponse.json({
    ok: true,
    scope: 'all',
    ...result,
    messagesSent: messages.sent,
    messagesFailed: messages.failed,
    details: [...result.details, ...messages.details],
  })
}

export async function POST(request: Request) {
  const user = await authenticateRequestUser(request)
  if (user) {
    try {
      return await runCronForOrganization(user.organizationId)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Cron failed' },
        { status: 500 }
      )
    }
  }

  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    return await runCronForAllOrganizations()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Cron failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
