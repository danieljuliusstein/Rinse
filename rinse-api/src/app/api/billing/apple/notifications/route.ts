import { NextResponse } from 'next/server'
import { appleServices, syncApplePurchase } from '@/lib/server/apple-billing'
export async function POST(request: Request) {
  try {
    const { signedPayload } = await request.json()
    if (typeof signedPayload !== 'string' || signedPayload.length > 64000) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    let notification
    try { notification = await appleServices().verifier.verifyAndDecodeNotification(signedPayload) }
    catch { return NextResponse.json({ error: 'Unverified notification' }, { status: 400 }) }
    if (notification.data?.signedTransactionInfo) await syncApplePurchase(notification.data.signedTransactionInfo, undefined, notification.notificationUUID)
    return NextResponse.json({ received: true })
  } catch { return NextResponse.json({ error: 'Reconciliation failed; retry required' }, { status: 500 }) }
}
