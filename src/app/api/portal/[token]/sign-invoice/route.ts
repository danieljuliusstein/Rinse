import { NextResponse } from 'next/server'
import { saveInvoiceSignature } from '@/lib/server/invoice-signature'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { validatePortalToken } from '@/lib/server/portal-tokens'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const record = await validatePortalToken(token)
  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  const scopeOk =
    record.scope === 'invoice' || record.scope === 'full' || record.scope === 'job'
  if (!scopeOk) {
    return NextResponse.json({ error: 'Invalid link for invoice signature' }, { status: 400 })
  }

  let body: { signatureUrl?: string }
  try {
    body = (await request.json()) as { signatureUrl?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const signatureUrl = body.signatureUrl?.trim()
  if (!signatureUrl) {
    return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
  }

  try {
    const pb = await authenticateServerAdmin()
    let invoiceId: string | undefined

    if (record.job_id) {
      const job = await pb.collection('jobs').getOne(record.job_id)
      invoiceId = job.invoice_id ? String(job.invoice_id) : undefined
    }

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { signedAt } = await saveInvoiceSignature(invoiceId, signatureUrl)
    return NextResponse.json({ ok: true, signedAt })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not save signature' },
      { status: 500 },
    )
  }
}
