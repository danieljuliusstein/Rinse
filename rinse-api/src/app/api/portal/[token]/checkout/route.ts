import { NextResponse } from 'next/server'
import { portalScopeAllowsCheckout } from '@/lib/server/portal-scope'
import { validatePortalToken } from '@/lib/server/portal-tokens'
import { authenticateServerPocketBase } from '@/lib/server/pocketbase-admin'
import { resolveConnectDestination } from '@/lib/server/stripe-connect'
import { getStripe, isStripeConfigured, stripeAppOrigin } from '@/lib/server/stripe'

import type Stripe from 'stripe'

type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string; status: number }

async function createPortalCheckout(
  request: Request,
  token: string,
  tipParam?: number,
): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { ok: false, error: 'Online payments are not enabled', status: 503 }
  }

  const record = await validatePortalToken(token)
  if (!record) {
    return { ok: false, error: 'Invalid link', status: 404 }
  }

  if (!portalScopeAllowsCheckout(record.scope)) {
    return { ok: false, error: 'This link cannot be used for payment', status: 403 }
  }

  if (!record.job_id) {
    return { ok: false, error: 'Invalid link', status: 404 }
  }

  const stripe = getStripe()
  if (!stripe) {
    return { ok: false, error: 'Online payments are not enabled', status: 503 }
  }

  try {
    const pb = await authenticateServerPocketBase()
    const job = await pb.collection('jobs').getOne(record.job_id, { expand: 'invoice_id' })
    const inv =
      job.expand?.invoice_id ??
      (job.invoice_id ? await pb.collection('invoices').getOne(String(job.invoice_id)) : null)
    if (!inv) {
      return { ok: false, error: 'No invoice found', status: 404 }
    }

    const balanceDue = Number(inv.balance_due ?? 0)
    if (balanceDue <= 0 || inv.status === 'paid') {
      return { ok: false, error: 'Nothing to pay', status: 400 }
    }

    const orgId = String(inv.organization_id ?? '').trim()
    if (
      orgId !== String(record.organization_id) ||
      orgId !== String(job.organization_id) ||
      String(inv.job_id) !== String(job.id)
    ) {
      return { ok: false, error: 'Invoice ownership mismatch', status: 403 }
    }
    if (!orgId) {
      return { ok: false, error: 'Invalid invoice', status: 400 }
    }

    const connectAccountId = await resolveConnectDestination(orgId)
    if (!connectAccountId) {
      return {
        ok: false,
        error: 'Online payments are not set up for this business yet',
        status: 503,
      }
    }

    // Parse and validate tip
    let tip = tipParam ?? 0
    if (!tipParam) {
      const url = new URL(request.url)
      const rawTip = url.searchParams.get('tip')
      if (rawTip) tip = parseFloat(rawTip) || 0
    }
    if (isNaN(tip) || tip < 0) tip = 0
    tip = Math.round(tip * 100) / 100
    if (tip > 1000) tip = 1000

    const baseUrl = stripeAppOrigin(request)
    const portalUrl = `${baseUrl}/portal/${token}`

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: process.env.STRIPE_PAYMENT_CURRENCY?.trim() || 'usd',
          product_data: {
            name: `Invoice ${inv.invoice_number}`,
            description: 'Detailing service',
          },
          unit_amount: Math.round(balanceDue * 100),
        },
        quantity: 1,
      },
    ]

    if (tip > 0) {
      lineItems.push({
        price_data: {
          currency: process.env.STRIPE_PAYMENT_CURRENCY?.trim() || 'usd',
          product_data: {
            name: 'Tip / Gratuity',
            description: `Gratuity for detailing service (Invoice ${inv.invoice_number})`,
          },
          unit_amount: Math.round(tip * 100),
        },
        quantity: 1,
      })
    }

    const metadata: Record<string, string> = {
      invoice_id: String(inv.id),
      organization_id: orgId,
    }
    if (tip > 0) {
      metadata.tip_amount = String(tip)
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        payment_intent_data: { metadata },
        metadata,
        success_url: `${portalUrl}?paid=1`,
        cancel_url: portalUrl,
      },
      {
        stripeAccount: connectAccountId,
        idempotencyKey: `invoice:${inv.id}:${Math.round(balanceDue * 100)}:${Math.round(tip * 100)}:${Math.floor(Date.now() / 1800000)}`,
      },
    )

    if (!session.url) {
      return { ok: false, error: 'Could not start checkout', status: 500 }
    }

    return { ok: true, url: session.url }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Checkout failed',
      status: 500,
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const result = await createPortalCheckout(request, token)
  const portalUrl = `${new URL(request.url).origin}/portal/${token}`

  if (!result.ok) {
    return NextResponse.redirect(`${portalUrl}?pay_error=${encodeURIComponent(result.error)}`)
  }

  return NextResponse.redirect(result.url)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  let tipParam: number | undefined = undefined
  try {
    const body = (await request.json()) as { tip?: number }
    if (typeof body?.tip === 'number') tipParam = body.tip
  } catch {
    // empty or invalid JSON body
  }

  const result = await createPortalCheckout(request, token, tipParam)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ url: result.url })
}
