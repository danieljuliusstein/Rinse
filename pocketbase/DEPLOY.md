# Phase 6 — Fly.io Deploy + CORS + HTTPS

Deploy PocketBase to [Fly.io](https://fly.io) with persistent storage and HTTPS (required for PWA + iOS + Web Push).

## Prerequisites

- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) installed and authenticated
- Next.js app deployed (Vercel, Fly, etc.) with HTTPS URL
- Domain optional (Fly provides `https://<app>.fly.dev`)

## 1. Create Fly app + volume

```bash
cd pocketbase
fly apps create detailing-pb   # or use fly launch
fly volumes create pb_data --region iad --size 1
```

## 2. Deploy PocketBase

```bash
fly deploy
```

Copy hooks into the volume on first deploy (or bake into image):

```bash
# Hooks ship from repo — mount or copy pb_hooks to /pb/pb_hooks on the machine
fly ssh console
mkdir -p /pb/pb_hooks
# upload jobs_update.pb.js, cron_notifications.pb.js
```

Alternatively extend `Dockerfile` to `COPY pb_hooks /pb/pb_hooks`.

## 3. Set secrets

```bash
fly secrets set \
  APP_CRON_URL=https://your-next-app.vercel.app \
  CRON_SECRET=your-random-secret
```

Use the same `CRON_SECRET` / `INTERNAL_API_SECRET` in your Next.js deployment.

## 4. First-time PocketBase setup

1. Open `https://detailing-pb.fly.dev/_/`
2. Create admin account
3. Create app user (`detailing@local`) with **Verified** enabled
4. **Settings → Import collections** → upload `pb_schema.json`
5. Set API rules (see `README.md`)

## 5. CORS (required for browser app)

In PocketBase admin → **Settings → Application**:

| Field | Value |
|---|---|
| **Allowed origins** | `https://your-app.vercel.app`, `http://localhost:3000` |

Add every origin where the Next.js PWA is hosted. PocketBase enforces HTTPS in production.

## 6. Configure Next.js production env

```env
NEXT_PUBLIC_PB_URL=https://detailing-pb.fly.dev
NEXT_PUBLIC_PB_EMAIL=detailing@local
NEXT_PUBLIC_PB_PASSWORD=your-app-user-password

# Server-side (API routes)
PB_URL=https://detailing-pb.fly.dev
PB_EMAIL=detailing@local
PB_PASSWORD=your-app-user-password

# Phase 5 automation
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=invoices@yourdomain.com
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@yourdomain.com
INTERNAL_API_SECRET=same-as-CRON_SECRET
```

## 7. HTTPS checklist

| Requirement | Fly.io |
|---|---|
| PocketBase HTTPS | Automatic (`force_https = true` in `fly.toml`) |
| Next.js HTTPS | Vercel/Fly automatic |
| PWA install on iOS | Both must be HTTPS |
| Web Push | Requires HTTPS + VAPID keys |

## 8. Scheduled notifications

**Option A — PocketBase cron hook** (`pb_hooks/cron_notifications.pb.js`):

Calls `GET /api/cron/notifications` on your Next.js app daily at 8:00 UTC.

**Option B — Vercel Cron** (`vercel.json`):

```json
{
  "crons": [{
    "path": "/api/cron/notifications",
    "schedule": "0 8 * * *"
  }]
}
```

Set `CRON_SECRET` header in Vercel cron config or use `INTERNAL_API_SECRET`.

## 9. Verify deployment

```bash
curl https://detailing-pb.fly.dev/api/health
```

From the app: Settings → Data backend should show **PocketBase**.

```bash
curl -H "x-api-secret: $CRON_SECRET" https://your-app.vercel.app/api/cron/notifications
```

## Generate VAPID keys

```bash
node scripts/generate-vapid-keys.mjs
```
