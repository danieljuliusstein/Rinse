import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  escapeHtml,
  sanitizeEmailSubject,
  validatePortalEmailHref,
} from '@/lib/server/escape-html'
import { parseJsonBody } from '@/lib/server/parse-body'
import { assertOrgAccess, requireUser } from '@/lib/server/route-guard'
import { getAppBaseUrl, getRequestAppBaseUrl, resolveClientOrgId } from '@/lib/server/portal-tokens'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'
import { portalSendBodySchema } from '@/lib/validation/api-schemas'
import { deskCorsOptions, withDeskCors } from '@/lib/server/desk-cors'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function OPTIONS(request: Request) {
  return deskCorsOptions(request)
}

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return withDeskCors(auth, request)

  const parsed = await parseJsonBody(request, portalSendBodySchema)
  if (parsed instanceof NextResponse) return withDeskCors(parsed, request)

  const { to, clientName, businessName, portalUrl, subject, message, organizationId, clientId } =
    parsed.data

  let orgId = organizationId ?? ''
  if (clientId && !orgId) {
    orgId = await resolveClientOrgId(auth.pb, clientId)
  }
  if (!orgId) {
    orgId = auth.organizationId
  }

  const denied = await assertOrgAccess(auth, {
    organizationId: orgId,
    ...(clientId ? { clientId } : {}),
  })
  if (denied) return withDeskCors(denied, request)

  const premiumDenied = await requirePremiumSubscription(auth.pb, orgId)
  if (premiumDenied) return withDeskCors(premiumDenied, request)

  if (!resend) {
    return withDeskCors(NextResponse.json({ error: 'Email not configured' }, { status: 503 }), request)
  }

  const requestBase = await getRequestAppBaseUrl()
  const allowedOrigins = new Set([
    new URL(getAppBaseUrl()).origin,
    new URL(requestBase).origin,
  ])
  const safePortalHref = validatePortalEmailHref(portalUrl, [...allowedOrigins])
  if (!safePortalHref) {
    return withDeskCors(
      NextResponse.json({ error: 'Invalid portal URL' }, { status: 400 }),
      request,
    )
  }

  const safeClientName = escapeHtml(clientName ?? 'there')
  const safeBusinessName = escapeHtml(businessName)
  const safeMessage = escapeHtml(
    message ?? 'Here is your secure link to view your service details.',
  )
  const emailSubject = subject
    ? sanitizeEmailSubject(subject)
    : `Your link from ${sanitizeEmailSubject(businessName)}`

  try {
    const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

    const { error } = await resend.emails.send({
      from: `${businessName} <${from}>`,
      to: [to],
      subject: emailSubject,
      html: `
        <p>Hi ${safeClientName},</p>
        <p>${safeMessage}</p>
        <p><a href="${safePortalHref}">View your service portal</a></p>
        <p>— ${safeBusinessName}</p>
      `,
    })

    if (error) {
      return withDeskCors(
        NextResponse.json({ error: error.message }, { status: 500 }),
        request,
      )
    }

    return withDeskCors(NextResponse.json({ ok: true }), request)
  } catch (e) {
    return withDeskCors(
      NextResponse.json(
        { error: e instanceof Error ? e.message : 'Send failed' },
        { status: 500 },
      ),
      request,
    )
  }
}
