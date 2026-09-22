import { authenticateServerAdmin } from './pocketbase-admin'
export type Reservation = { id: string; plan: 'starter' | 'early'; provider: string; session_id: string; generation: number; expires_at: number }
export async function billingCommand<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const pb = await authenticateServerAdmin()
  return pb.send<T>('/api/rinse/billing', { method: 'POST', body })
}
