# Production deployment checklist

Use this when taking Atlas Detailing from local dev to a live operator + customer setup.

## Security Wave 0 — CI & branch protection

Automated checks live in `.github/workflows/`:

| Workflow | Purpose |
|----------|---------|
| **CI** (`ci.yml`) | Every PR/push: `npm ci`, `npm run build`, `npm test`, non-blocking `npm audit --production --audit-level=high` |
| **E2E** (`e2e.yml`) | Daily + manual: Playwright smoke + product tour (requires `PB_URL` secret) |

Dependabot (`.github/dependabot.yml`) opens weekly npm update PRs (max 10 open).

### Recommended branch protection (solo dev)

Configure at **GitHub → Settings → Branches → Add branch protection rule** for `main`:

1. **Require a pull request before merging** — you can self-merge your own PRs; this blocks direct pushes to `main`.
2. **Require status checks to pass before merging** — enable **CI / Build, test & audit** as a required check. E2E is scheduled daily (not a merge gate); re-run manually from Actions when needed.
3. **Do not require approving reviews** — leave “Required approving reviews” off (or set count to 0). Solo dev does not need a second reviewer.
4. **Block force pushes** and **Block deletion** of `main`.

Also enable **two-factor authentication** on GitHub, Vercel, Fly.io, and Stripe.

### Making npm audit blocking (later)

In `.github/workflows/ci.yml`, remove `continue-on-error: true` from the audit step. Re-run a PR to confirm failures surface as a red check, then ensure **Build, test & audit** stays in the required status checks list above.

## Security Wave 1 — JWT on sensitive routes

Operator-facing API routes no longer accept a client-bundle secret. Authenticated actions use the signed-in user’s **PocketBase JWT** (`Authorization: Bearer`).

| Route | Auth |
|-------|------|
| `POST /api/portal/create`, `POST /api/portal/send` | User JWT + org check |
| `POST/GET /api/backups/trigger` | User JWT + required `organizationId` query param |
| `POST /api/cron/notifications` (Settings manual run) | User JWT — org-scoped only |
| `POST /api/cron/notifications` (Vercel Cron / PB hook) | Server-only `CRON_SECRET` / `INTERNAL_API_SECRET` |
| `GET /api/debug/chunk-health` | Server-only secret |

**Remove from Vercel:** any client-exposed copy of `INTERNAL_API_SECRET` (pre–Wave 1; do not use `NEXT_PUBLIC_*` for secrets).

**Keep server-only:** `INTERNAL_API_SECRET` and `CRON_SECRET` (same value is fine) for scheduled cron and debug routes.

## Security Wave 2 — Superuser audit & admin backup

Full inventory: [`docs/SUPERUSER_PB_AUDIT.md`](./SUPERUSER_PB_AUDIT.md).

| Route | Auth | Scope |
|-------|------|-------|
| `POST/GET /api/backups/trigger` | Operator JWT | Single org (`organizationId` required) |
| `POST/GET /api/admin/backups/trigger` | Platform admin JWT **or** server secret | All tenants |

Set `PLATFORM_ADMIN_EMAILS` (comma-separated) for admin UI + full backup Path A. Path B uses `INTERNAL_API_SECRET` for CLI/DR only.

## Security Wave 3 — Server validation & PDF re-fetch

High-risk routes validate request bodies with Zod (`src/lib/validation/api-schemas.ts`, `parseJsonBody` in `src/lib/server/parse-body.ts`).

PDF export routes accept **IDs only** (`jobId` / `invoiceId` / `quoteId` / `range`) and re-fetch authoritative data from PocketBase with the user's org filter (`src/lib/server/pdf-data.ts`).

## Security Wave 4 — Portal token scope

Portal link **scope** must match the action:

| Action | Allowed scopes |
|--------|----------------|
| Stripe checkout (`/api/portal/[token]/checkout`) | `invoice`, `full`, `job` |
| Job photos (`streamPortalPhoto`) | `photos`, `full`, `job` |

Quote-only or photos-only tokens cannot checkout; invoice-only tokens cannot load photos. Helpers: `src/lib/server/portal-scope.ts`; tests: `portal-scope.test.ts`.

## Security Wave 5 — CSP Report-Only & HSTS

**Report-Only only** — violations are logged, nothing is blocked yet. Soak **1–2 weeks** on production, review Vercel function logs for `csp_violation` events, then switch to enforcing `Content-Security-Policy` (remove `-Report-Only` in `src/middleware.ts`).

| Header | Where | Notes |
|--------|-------|-------|
| `Content-Security-Policy-Report-Only` | `src/middleware.ts` (production) | Path-specific `frame-ancestors` |
| `Strict-Transport-Security` | `src/middleware.ts` (production) | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy: frame-ancestors *` | `next.config.ts` | **Enforcing** — only `/book/*` and `/embed/*` (preserves iframe embed) |

**Customize before enforcing CSP:**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PB_URL` / `PB_URL` | PocketBase origin in `connect-src` and `img-src` |
| `BOOKING_ALLOWED_ORIGINS` | Comma-separated parent origins for `frame-ancestors` on book/embed (Report-Only); also used for public booking API CORS |

**TODO:** Add each customer marketing-site origin to `BOOKING_ALLOWED_ORIGINS` when they embed `/embed/book/{slug}` on WordPress or similar. Until then, enforcing `frame-ancestors` on book/embed still uses `*` via `next.config.ts`.

Violation reports: `POST /api/csp-report` (rate-limited, structured `console.info` log).

## Security Wave 7 — Durable rate limits, audit trail, upload validation

### Upstash Redis rate limiting

When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set on Vercel, signup, public booking, public read, and auth-adjacent routes use **Upstash** instead of per-instance in-memory counters (survives cold starts and scales horizontally).

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

Create a free Upstash Redis database at [upstash.com](https://upstash.com), copy REST credentials into Vercel env, redeploy.

**Verify durable limits:** From two different networks (or after a Vercel redeploy / cold start), send more than 5 signup POSTs to `/api/auth/signup` within an hour — the 6th should return **429** with `Retry-After`. Without Upstash, limits reset per server instance only.

Keying: **IP** for pre-auth routes (`signup`, `public-booking`, `public-read`); **userId** for authenticated routes (`send-email`, `push-subscribe`, `account-delete`).

### Audit log (structured `console.info`)

Events written to Vercel/Fly function logs — search for `"event":"admin_backup_triggered"` etc.

| Event | When |
|-------|------|
| `admin_backup_triggered` | Full backup via `/api/admin/backups/trigger` |
| `auth_failure` | Invalid Bearer JWT on admin backup (sample route) |
| `webhook_reject` | Stripe webhook signature missing/invalid |

Helper: `src/lib/server/audit-log.ts`

### Job photo upload validation

PocketBase hook `pocketbase/pb_hooks/jobs_photo_validate.pb.js` — on jobs create/update, rejects non-image uploads (JPEG/PNG/GIF/WebP magic bytes). Redeploy PocketBase after pulling hooks.

## 1. Deploy PocketBase (Fly.io)

PocketBase should already be on Fly at your `NEXT_PUBLIC_PB_URL`. If not, follow [`pocketbase/DEPLOY.md`](../pocketbase/DEPLOY.md).

After deploy:

1. Open PocketBase admin (`https://your-pb.fly.dev/_/`)
2. **Settings → Application** → add CORS allowed origins:
   - `https://your-app.vercel.app`
   - `http://localhost:3000`
3. Run migrations: `cd pocketbase && ./pocketbase migrate up`

## 2. Deploy Next.js (Vercel)

Connect the repo and set these environment variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PB_URL` | Public PocketBase URL |
| `PB_URL` | Same as above (server routes) |
| `PB_EMAIL` | PocketBase app user email |
| `PB_PASSWORD` | PocketBase app user password |
| `RESEND_API_KEY` | Invoice + portal email |
| `RESEND_FROM_EMAIL` | Verified sender domain |
| `VAPID_PUBLIC_KEY` | Web push (`npm run generate:vapid`) |
| `VAPID_PRIVATE_KEY` | Web push |
| `CRON_SECRET` | Protects `/api/cron/notifications` (Vercel Cron + PB hook) |
| `INTERNAL_API_SECRET` | Same value as `CRON_SECRET` (server-only cron/debug) |
| `UPSTASH_REDIS_REST_URL` | (Wave 7) Durable rate limits — Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | (Wave 7) Upstash REST token |

Optional (support):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Mailto target for Settings → Help & support |
| `NEXT_PUBLIC_APP_VERSION` | App version label (defaults to `package.json` version at build) |

Deploy. Note your production URL, e.g. `https://detailing-app.vercel.app`.

### Google & Apple sign-in (OAuth2)

In PocketBase admin → **Collections → users → Settings → OAuth2**:

1. Enable OAuth2 auth for the collection
2. Add providers:
   - **Google** — Client ID + secret from Google Cloud Console (OAuth consent + redirect URI)
   - **Apple** — Services ID, team ID, key ID, and private key from Apple Developer
3. Set redirect URLs (must match the app callback exactly):
   - `https://your-app.vercel.app/auth/oauth/callback`
   - `http://localhost:3000/auth/oauth/callback`

After OAuth login, new users without an `organization_id` are provisioned via `POST /api/auth/oauth-provision` (Starter trial org + seeded packages). They then enter the onboarding wizard at `/onboarding?step=business`.

Welcome screen for new visitors: `/welcome` → **Get started** → `/auth`.

## 3. Wire notification cron

Two triggers call `/api/cron/notifications` daily at 08:00 UTC:

- **Vercel Cron** — [`vercel.json`](../vercel.json) (sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set in Vercel)
- **PocketBase hook** — [`pocketbase/pb_hooks/cron_notifications.pb.js`](../pocketbase/pb_hooks/cron_notifications.pb.js)

On Fly, set secrets:

```bash
fly secrets set \
  APP_CRON_URL=https://your-app.vercel.app \
  CRON_SECRET=your-long-random-secret
```

Use the **same** `CRON_SECRET` in Vercel env vars.

Verify:

```bash
APP_URL=https://your-app.vercel.app \
CRON_SECRET=your-long-random-secret \
node scripts/verify-cron.mjs
```

Or run the full walkthrough:

```bash
APP_URL=https://your-app.vercel.app node scripts/qa-walkthrough.mjs
```

## 4. Seed packages (per org)

Default packages: Basic Wash $80, Full Detail $320, Paint Correction $450, Ceramic Coat $800.

```bash
ORG_SLUG=atlas-detailing \
PB_URL=https://your-pb.fly.dev \
PB_EMAIL=... PB_PASSWORD=... \
npm run seed:packages
```

Rename legacy `Paint Correct` if needed:

```bash
ORG_SLUG=atlas-detailing node scripts/backfill-package-names.mjs
```

Confirm prices in the app: **Settings → Service packages**.

## 5. Operator go-live setup

In **Settings**:

1. Upload **logo** and set **business name**
2. Fill **phone**, **email**, **address**
3. Set **invoice terms footer** (default: “Due on receipt. Thank you for your business.”)
4. Enable **push notifications** on your phone
5. Copy **booking link** and share it

## 6. Manual QA (15 minutes)

| Step | Check |
|------|-------|
| 1 | Settings → Save logo + business name |
| 2 | Open a **client portal** link → logo, name, terms in footer |
| 3 | Open `/book/{your-slug}` → logo + business name in header |
| 4 | Send a test **invoice PDF** → logo + terms appear |
| 5 | Book a test appointment → job shows on Home |
| 6 | Settings → Advanced → **Run notifications** (or wait for 08:00 UTC cron) → push received |
| 7 | `npm run test:isolation` against production PB |

## 7. Post-launch

- Monitor Vercel function logs for cron 401s (wrong `CRON_SECRET`)
- Monitor Resend dashboard for invoice email delivery
- Re-run `npm run verify:backend` after schema changes

## Phase 2 features

### Stripe (portal pay online)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Server-side Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Verifies `POST /api/stripe/webhook` |

Webhook endpoint: `https://your-app.vercel.app/api/stripe/webhook` — subscribe to `checkout.session.completed`.

Clients open the portal invoice link and click **Pay online** to complete Checkout; payments are recorded on the invoice automatically.

### Auto-messages (email)

Auto-messages send **email only** via Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`). Clients need an email on file.

Templates live in PocketBase `app_settings.auto_messages`. Sent messages log to `sent_messages`. The daily cron (`/api/cron/notifications`) runs appointment reminders, completion emails, review requests, and 30-day follow-ups.

To **text a client manually**, use the **Text** button on their profile (opens your phone’s Messages app — no API cost).

Optional: `NEXT_PUBLIC_REVIEW_URL` for review-request template links.

### Lead pipeline

Operators open **Lead pipeline** from the home header (funnel icon) at `/pipeline`.

- **Mobile stepper tabs:** Inquiry → Quoted → Ready to schedule
- **Single-column list** per active tab (not a desktop kanban)
- **Website bookings** (`lead_source: website`) land in **Inquiry**
- **Quote accepted** moves the lead to **Ready to schedule**; convert from there to create a scheduled job

### Marketing website → booking

The marketing site (`detailing-website`) links to the operator app:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_API_URL` | Operator app URL (e.g. `https://detailing-app.vercel.app`) |
| `NEXT_PUBLIC_BOOKING_SLUG` | Org slug for `/book/{slug}` |

`/book` on the marketing site redirects to `{APP_URL}/book/{slug}`.
