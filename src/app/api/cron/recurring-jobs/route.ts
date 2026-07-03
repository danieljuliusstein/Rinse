import { NextResponse } from 'next/server'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { runRecurringJobsCron } from '@/lib/server/recurring-jobs'

export async function POST(request: Request) {
  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    const result = await runRecurringJobsCron()
    return NextResponse.json({ ok: true, ...result })
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
