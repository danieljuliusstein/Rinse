import { authenticateServerAdmin } from './pocketbase-admin'

const MAX_SIGNATURE_CHARS = 400_000

export function isValidSignatureDataUrl(value: string): boolean {
  if (!value.startsWith('data:image/png;base64,')) return false
  if (value.length > MAX_SIGNATURE_CHARS) return false
  return true
}

export async function saveInvoiceSignature(
  invoiceId: string,
  signatureUrl: string,
): Promise<{ signedAt: string }> {
  if (!isValidSignatureDataUrl(signatureUrl)) {
    throw new Error('Invalid signature image')
  }

  const pb = await authenticateServerAdmin()
  const invoice = await pb.collection('invoices').getOne(invoiceId)

  if (invoice.signature_url) {
    return { signedAt: String(invoice.signed_at ?? new Date().toISOString()) }
  }

  const signedAt = new Date().toISOString()
  await pb.collection('invoices').update(invoiceId, {
    signature_url: signatureUrl,
    signed_at: signedAt,
  })

  return { signedAt }
}
