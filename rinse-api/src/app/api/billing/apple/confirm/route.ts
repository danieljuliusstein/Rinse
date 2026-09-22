import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { syncApplePurchase } from '@/lib/server/apple-billing'
export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { signedTransaction } = await request.json()
    if (typeof signedTransaction !== 'string' || signedTransaction.length > 32000) throw new Error('Invalid transaction')
    return NextResponse.json(await syncApplePurchase(signedTransaction, auth.organizationId))
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Purchase verification failed' }, { status: 400 }) }
}
