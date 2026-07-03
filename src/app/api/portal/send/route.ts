import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { apiUnauthorized, verifyApiSecret } from '@/lib/server/api-auth'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  if (!verifyApiSecret(request)) return apiUnauthorized()

  try {
    const body = await request.json()
    const { to, clientName, businessName, portalUrl, subject, message, organizationId } = body

    if (!to || !portalUrl || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (organizationId) {
      const pb = await authenticateServerAdmin()
      const premiumDenied = await requirePremiumSubscription(pb, String(organizationId))
      if (premiumDenied) return premiumDenied
    }

    if (!resend) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
    }

    const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    const emailSubject = subject ?? `Your link from ${businessName}`

    const { error } = await resend.emails.send({
      from: `${businessName} <${from}>`,
      to: [to],
      subject: emailSubject,
      html: `
        <p>Hi ${clientName ?? 'there'},</p>
        <p>${message ?? 'Here is your secure link to view your service details.'}</p>
        <p><a href="${portalUrl}">View your service portal</a></p>
        <p>— ${businessName}</p>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Send failed' },
      { status: 500 }
    )
  }
}
