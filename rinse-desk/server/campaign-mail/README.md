# Campaign mail service (Resend)

Companion HTTP service for Desk campaign send + unique open tracking. Secrets stay here — never in `VITE_*`.

## What it does

| Route | Purpose |
|-------|---------|
| `GET /health` | Liveness + config flags |
| `POST /campaigns/:id/send` | Send via Resend (Bearer = PocketBase user token) |
| `POST /webhooks/resend` | Resend `email.opened` → unique `stats_opened`; `email.clicked` → unique `stats_clicked` |

Flow: operator clicks **Send email** → desk SPA POSTs here → Resend delivers → rows in `campaign_sends` → webhook sets `opened_at` / `clicked_at` once and bumps campaign `stats_opened` / `stats_clicked` → Dashboard **Email Stats** / Campaigns list read those fields.

## Anti-abuse (defaults)

| Control | Default | Env |
|---------|---------|-----|
| CORS lock | required Desk origin | `CORS_ORIGIN` (use `ALLOW_INSECURE_CORS=1` only for local `*`) |
| Local smoke token | off | `ALLOW_LOCAL_SEND=1` + `LOCAL_SEND_TOKEN` |
| Per-IP send limit | 10 / 15 min | `SEND_IP_LIMIT`, `SEND_IP_WINDOW_SEC` |
| Per-campaign cooldown | 5 min | `SEND_CAMPAIGN_COOLDOWN_SEC` |
| Per-org daily sends | 20 | `SEND_ORG_DAILY_LIMIT` |
| Max audience / send | 500 | `SEND_MAX_AUDIENCE` |

Org API rules (PocketBase) are not set by this process — apply them with:

```bash
node scripts/ensure-org-api-rules.mjs           # dry-run
node scripts/ensure-org-api-rules.mjs --apply   # write
```

## Deploy (Fly.io)

App name: **`rinse-campaign-mail`** → `https://rinse-campaign-mail.fly.dev`

```bash
cd server/campaign-mail
fly auth login                    # once
fly apps create rinse-campaign-mail --org personal   # once (org may differ)
bash scripts/fly-set-secrets.sh   # pushes .env secrets (CORS → desk.rinsehq.com)
fly deploy
curl -s https://rinse-campaign-mail.fly.dev/health
```

(Avoid `pnpm run fly:*` if your pnpm version blocks on ignored build scripts — the bash/`fly` commands above are enough.)

Then:

1. **Vercel Desk** env: `VITE_CAMPAIGN_MAIL_URL=https://rinse-campaign-mail.fly.dev` → redeploy
2. **Resend webhook**: `https://rinse-campaign-mail.fly.dev/webhooks/resend` (`email.opened` + `email.clicked`)

## Setup

```bash
cd server/campaign-mail
pnpm install
cp .env.example .env   # fill secrets; set CORS_ORIGIN
pnpm dev               # :8787 by default
```

In the desk app root `.env` (local):

```
VITE_CAMPAIGN_MAIL_URL=http://localhost:8787
```

Production Desk origin for CORS: `https://desk.rinsehq.com` (set via `CORS_ORIGIN` on Fly).
App API lives at `https://rinsehq.com`; PocketBase remains on Fly (`PB_URL`).

Create the PocketBase `campaign_sends` collection from `docs/superpowers/specs/pocketbase-platform-collections.md`.

To add click-tracking fields on a live instance (idempotent):

```bash
cd server/campaign-mail
node scripts/ensure-click-schema.mjs
```

Full ops steps (domain, webhook, deploy): `docs/superpowers/specs/2026-07-26-resend-campaign-mail.md`.

## Env (server only)

| Variable | Required | Notes |
|----------|----------|--------|
| `PB_URL` | yes | Same PocketBase the SPA uses |
| `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` | yes | Superuser for writes + webhook |
| `RESEND_API_KEY` | yes | Send path |
| `RESEND_FROM` | yes | Verified sender, e.g. `Desk <onboarding@resend.dev>` for smoke |
| `RESEND_WEBHOOK_SECRET` | yes | From Resend webhook create response |
| `CORS_ORIGIN` | yes* | Desk origin(s); `*` only with `ALLOW_INSECURE_CORS=1` |
| `PORT` | no | Default `8787` |
| `ALLOW_LOCAL_SEND` / `LOCAL_SEND_TOKEN` | no | Smoke bearer only; not for production |
| `SEND_*` | no | See anti-abuse table |

## Smoke

```bash
curl -s localhost:8787/health
curl -s -X POST localhost:8787/campaigns/<CAMPAIGN_ID>/send \
  -H "Authorization: Bearer <PB_USER_TOKEN>"
```

With `VITE_CAMPAIGN_MAIL_URL` unset, the SPA keeps the old mock (activities + `stats_sent`, no opens).
