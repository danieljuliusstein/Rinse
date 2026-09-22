import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { rejectOversizedBody } from '@/lib/server/request-body'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const tooLarge = rejectOversizedBody(request)
  if (tooLarge) return tooLarge

  const auth = await authenticateRequestUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = await enforceRateLimit(
    `invoice-send:${auth.userId}`,
    RATE_LIMITS.sendEmail,
    'send-email',
  )
  if (limited) return limited


  try {
    const body = await request.json()
    const { to, clientName, invoiceNumber, total, businessName, fromEmail, portalUrl } = body

    if (!to || !invoiceNumber || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const toEmail = String(to).trim().slice(0, 254)
    if (!EMAIL_RE.test(toEmail)) {
      return NextResponse.json({ error: 'Invalid recipient email' }, { status: 400 })
    }

    if (!resend) {
      return NextResponse.json(
        { error: 'Email not configured — set RESEND_API_KEY in .env.local' },
        { status: 503 }
      )
    }

    const from = process.env.RESEND_FROM_EMAIL ?? fromEmail ?? 'onboarding@resend.dev'
    const safeBusiness = String(businessName).slice(0, 120)
    const safeInvoice = String(invoiceNumber).slice(0, 64)
    const safeTotal = Number(total)
    const portal =
      typeof portalUrl === 'string' && portalUrl.startsWith('http') ? portalUrl.slice(0, 2048) : ''

    const { error } = await resend.emails.send({
      from: `${safeBusiness} <${from}>`,
      to: [toEmail],
      subject: `Invoice ${safeInvoice} from ${safeBusiness}`,
      html: `
        <p>Hi ${String(clientName ?? 'there').slice(0, 120)},</p>
        <p>Your invoice <strong>${safeInvoice}</strong> for <strong>$${Number.isFinite(safeTotal) ? safeTotal.toFixed(2) : '0.00'}</strong> is ready.</p>
        <p>Payment is due on receipt.</p>
        ${portal ? `<p><a href="${portal}">View your invoice online</a></p>` : ''}
        <p>— ${safeBusiness}</p>
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
