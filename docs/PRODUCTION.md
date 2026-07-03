# Production deployment checklist

Use this when taking Atlas Detailing from local dev to a live operator + customer setup.

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
| `CRON_SECRET` | Protects `/api/cron/notifications` |
| `INTERNAL_API_SECRET` | Same value as `CRON_SECRET` (backup routes) |

Optional (client manual cron fallback):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_INTERNAL_API_SECRET` | Same secret for Settings → run notifications |

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
