# Campaign mail service (Resend)

Companion HTTP service for Desk campaign send + unique open tracking. Secrets stay here — never in `VITE_*`.

## What it does

| Route | Purpose |
|-------|---------|
| `GET /health` | Liveness + config flags |
| `POST /campaigns/:id/send` | Send via Resend (Bearer = PocketBase user token) |
| `POST /webhooks/resend` | Resend `email.opened` → unique `stats_opened`; `email.clicked` → unique `stats_clicked` |

Flow: operator clicks **Send email** → desk SPA POSTs here → Resend delivers → rows in `campaign_sends` → webhook sets `opened_at` / `clicked_at` once and bumps campaign `stats_opened` / `stats_clicked` → Dashboard **Email Stats** / Campaigns list read those fields.

## Setup

```bash
cd server/campaign-mail
pnpm install
cp .env.example .env   # fill secrets
pnpm dev               # :8787 by default
```

In the desk app root `.env`:

```
VITE_CAMPAIGN_MAIL_URL=http://localhost:8787
```

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
| `PORT` | no | Default `8787` |
| `CORS_ORIGIN` | no | Default `*`; set desk origin in prod |
| `LOCAL_SEND_TOKEN` | no | Smoke bearer only; not for production |

## Smoke

```bash
curl -s localhost:8787/health
curl -s -X POST localhost:8787/campaigns/<CAMPAIGN_ID>/send \
  -H "Authorization: Bearer <PB_USER_TOKEN>"
```

With `VITE_CAMPAIGN_MAIL_URL` unset, the SPA keeps the old mock (activities + `stats_sent`, no opens).
