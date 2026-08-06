import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { loadEnv } from './env.js'
import { sendCampaign } from './send.js'
import { handleResendWebhook, readWebhookHeaders } from './webhook.js'

const env = loadEnv()
const app = new Hono()

app.use(
  '*',
  cors({
    origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(',').map((s) => s.trim()),
    allowHeaders: ['Authorization', 'Content-Type', 'webhook-id', 'webhook-timestamp', 'webhook-signature', 'svix-id', 'svix-timestamp', 'svix-signature'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
)

app.get('/health', (c) =>
  c.json({
    ok: true,
    mailConfigured: Boolean(env.resendApiKey && env.resendFrom && env.pbUrl),
    webhookConfigured: Boolean(env.resendWebhookSecret && env.pbUrl),
  }),
)

app.post('/campaigns/:id/send', async (c) => {
  try {
    const auth = c.req.header('Authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    const localOk = Boolean(env.localSendToken)
    const summary = await sendCampaign(env, c.req.param('id'), bearer || null, localOk)
    return c.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    const status =
      message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('sign in')
        ? 401
        : message.includes('required') || message.includes('Missing')
          ? 500
          : 400
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

console.log(`[campaign-mail] listening on :${env.port}`)
serve({ fetch: app.fetch, port: env.port })
