import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { enforceRateLimit } from '@/lib/server/rate-limit'
import { getClientIp } from '@/lib/server/client-ip'
import { deskCorsOptions, withDeskCors } from '@/lib/server/desk-cors'
export const OPTIONS = deskCorsOptions
export async function POST(request: Request) {
  const reply = (data: unknown, status = 200) => withDeskCors(NextResponse.json(data, { status }), request)
  const limited = await enforceRateLimit(`waitlist:${getClientIp(request)}`, { limit: 6, windowMs: 60000 }, 'waitlist')
  if (limited) return withDeskCors(limited, request)
  const raw = await request.text()
  if (raw.length > 4096) return reply({ error: 'Submission too large' }, 413)
  let body
  try { body = JSON.parse(raw) } catch { return reply({ error: 'Invalid submission' }, 400) }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['free', 'starter'].includes(body.interest)) return reply({ error: 'Enter a valid email and plan interest.' }, 400)
  try {
    const pb = await authenticateServerAdmin()
    const filter = pb.filter('email = {:email}', { email })
    try { await pb.collection('waitlist').create({ email, interest: body.interest, source: 'ios-landing', joined_at: new Date().toISOString() }) }
    catch (e) {
      // The unique index resolves concurrent duplicate submissions. Do not hide storage outages.
      const existing = await pb.collection('waitlist').getFirstListItem(filter).catch(() => null)
      if (!existing) throw e
      await pb.collection('waitlist').update(existing.id, { interest: body.interest })
    }
    return reply({ ok: true, message: 'You’re on the iOS waitlist. We’ve saved your plan interest. This does not reserve an Early subscription.' })
  } catch { return reply({ error: 'We couldn’t save your signup. Please try again.' }, 503) }
}
