# Native marketing screenshots (waitlist / site)

Operator UI from **apps/mobile**. Customer booking + portal from **apps/api** (production: `app.rinsehq.com`).

## Product (already supported)

On a **scheduled** job in native, operators can:

1. **Create invoice** (no need to mark complete first)
2. **Share portal link** (invoice / appointment / full)
3. Client opens portal → **sign invoice** + pay online before the job starts

Marketing portal shot should use an invoice-scoped portal link so that story is visible.

## Shot list → waitlist features

| File | Source | Waitlist label |
|------|--------|----------------|
| `01-home.png` | Native `/` | hero + `feature-home` |
| `02-jobs.png` | Native `/jobs` | `feature-jobs` |
| `04-job-photos.png` | Native `/jobs/{id}/photos` | `feature-photos` |
| `08-booking-step1.png` | `https://app.rinsehq.com/book/{slug}` | `feature-booking` |
| `10-portal.png` | Live portal URL (JWT create) | `feature-portal` |
| `11-fab-menu.png` | Native FAB | optional |

Viewport: **390×844** @ `deviceScaleFactor: 3`.

## Prerequisites

```bash
cd apps/mobile
npm install
npm run visual-audit:install
```

`.env`:

- `EXPO_PUBLIC_PB_URL`
- `EXPO_PUBLIC_APP_API_URL` (default `https://app.rinsehq.com`)
- `EXPO_PUBLIC_TEST_EMAIL` / `EXPO_PUBLIC_TEST_PASSWORD`

Test org needs: jobs (with photos), clients, at least one invoice, booking-enabled org slug.

## Capture + export

```bash
npm run marketing:capture   # → marketing/raw/screenshots/
npm run marketing:export    # → marketing/export/waitlist/
```

```bash
PW_NO_SERVER=1 NATIVE_VISUAL_URL=http://127.0.0.1:8081 npm run marketing:capture
```

Copy `marketing/export/waitlist/` into the waitlist site assets.
