import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { assertSecureEnv, loadEnv } from './env.js'
import { takeToken } from './rate-limit.js'
import { sendCampaign } from './send.js'
import { handleResendWebhook, readWebhookHeaders } from './webhook.js'

const env = loadEnv()
assertSecureEnv(env)

const app = new Hono()

app.use(
  '*',
  cors({
    origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(',').map((s) => s.trim()),
    allowHeaders: [
      'Authorization',
      'Content-Type',
      'webhook-id',
      'webhook-timestamp',
      'webhook-signature',
      'svix-id',
      'svix-timestamp',
      'svix-signature',
    ],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
)

app.get('/health', (c) =>
  c.json({
    ok: true,
    mailConfigured: Boolean(env.resendApiKey && env.resendFrom && env.pbUrl),
    webhookConfigured: Boolean(env.resendWebhookSecret && env.pbUrl),
    localSendEnabled: Boolean(env.localSendToken),
    corsLocked: env.corsOrigin !== '*',
  }),
)

function clientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown'
}

app.post('/campaigns/:id/send', async (c) => {
  try {
    const ip = clientIp(c)
    const ipLimit = takeToken(`ip:${ip}`, env.ipSendLimit, env.ipSendWindowSec * 1000)
    if (!ipLimit.ok) {
      c.header('Retry-After', String(ipLimit.retryAfterSec))
      return c.json({ error: 'Too many send requests from this IP. Try again later.' }, 429)
    }

    const auth = c.req.header('Authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    const localOk = Boolean(env.localSendToken)
    const summary = await sendCampaign(env, c.req.param('id'), bearer || null, localOk)
    return c.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    const lower = message.toLowerCase()
    const status =
      lower.includes('unauthorized') || lower.includes('sign in')
        ? 401
        : lower.includes('too many') ||
            lower.includes('daily send') ||
            lower.includes('sent recently')
          ? 429
          : message.includes('required') || message.includes('Missing')
            ? 500
            : 400
    if (status === 429) {
      const wait = message.match(/(\d+)s/)?.[1]
      c.header('Retry-After', wait || '60')
    }
    return c.json({ error: message }, status)
  }
})

app.post('/webhooks/resend', async (c) => {
  try {
    const rawBody = await c.req.text()
    const headers = readWebhookHeaders(c.req.raw.headers)
    const result = await handleResendWebhook(env, rawBody, headers)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook failed'
    console.error('[campaign-mail] webhook error', message)
    return c.json({ error: message }, 401)
  }
})

console.log(
  `[campaign-mail] listening on 0.0.0.0:${env.port} cors=${env.corsOrigin} localSend=${Boolean(env.localSendToken)}`,
)
serve({ fetch: app.fetch, port: env.port, hostname: '0.0.0.0' })
