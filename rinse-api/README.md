# Detailing App

Mobile-first PWA for a solo car detailing business — job tracking, profit calculation, invoices, inventory, and business KPIs.

## Features

- PIN authentication with 5-minute auto-lock
- Dashboard KPIs, jobs, clients, reports (P&L)
- Invoices with PDF + email (Resend)
- Inventory, overhead, job photos, service packages
- Client create/edit, invoices list, change PIN, logo upload
- Settings sync to PocketBase `app_settings` (notifications + business info)
- PocketBase backend with localStorage fallback + offline write queue
- Push notifications (job reminders, overdue invoices, low inventory)
- PocketBase backup export via API

## Getting started

```bash
cd detailing-app
npm install
cp .env.local.example .env.local   # edit with your values
npm run dev
```

Open http://localhost:3000. Set a 4-digit PIN on first launch.

## Environment variables

See `.env.local.example` for full list. Minimum for local dev:

```env
NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
NEXT_PUBLIC_PB_EMAIL=detailing@local
NEXT_PUBLIC_PB_PASSWORD=your-password
```

Phase 5 (optional):

```env
RESEND_API_KEY=re_xxxx
VAPID_PUBLIC_KEY=...          # npm run generate:vapid
VAPID_PRIVATE_KEY=...
INTERNAL_API_SECRET=random    # server-only: cron hooks + debug routes
```

## PocketBase (local)

Follow **`pocketbase/README.md`** — run server, import schema, create app user, set API rules.

```bash
npm run seed:packages
npm run seed:supplies
npm run generate:icons   # PWA icons (also committed under public/icons/)
```

Restart PocketBase after changing hooks in `pocketbase/pb_hooks/` (invoice numbers, inventory deduction, cron).

## Phase 5 — API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/invoices/send` | POST | Email invoice via Resend |
| `/api/backups/trigger` | POST | Download full PB backup JSON |
| `/api/push/vapid-key` | GET | VAPID public key for browser subscribe |
| `/api/push/subscribe` | POST/DELETE | Save/remove push subscription |
| `/api/cron/notifications` | GET/POST | Run notification checks (auth required) |

Protected routes require `x-api-secret` header (or Vercel `Authorization: Bearer`).

**Notification cron** checks: job reminders (tomorrow), morning reminder (today), follow-ups (3 days), invoice overdue, low inventory. Runs daily via Vercel cron (`vercel.json`) or PocketBase hook.

## Phase 6 — Production deploy

Deploy PocketBase to Fly.io: **`pocketbase/DEPLOY.md`**

```bash
cd pocketbase
fly volumes create pb_data --region iad --size 1
fly deploy
fly secrets set APP_CRON_URL=https://your-app.vercel.app CRON_SECRET=your-secret
```

Deploy Next.js to Vercel (or Fly) with production env:

```env
NEXT_PUBLIC_PB_URL=https://detailing-pb.fly.dev
```

Set **CORS** in PocketBase admin → Settings → Allowed origins: your app URL + `http://localhost:3000`.

HTTPS is required for PWA install on iOS and Web Push.

## Scripts

```bash
npm run dev
npm run build
npm run seed:packages   # optional: ORG_SLUG=your-slug npm run seed:packages
npm run backfill:package-names
npm run verify:cron
npm run verify:backend
```

Production deploy: see **[docs/PRODUCTION.md](docs/PRODUCTION.md)**.

## Project structure

```
src/
  app/api/          # Phase 5 server routes
  lib/server/       # PB admin, backup, push, cron
  lib/api/          # Data router (PB + local + offline queue)
  components/
pocketbase/
  pb_schema.json
  pb_hooks/         # Supply deduction + daily cron
  Dockerfile        # Phase 6 Fly.io
  fly.toml
  DEPLOY.md
```
