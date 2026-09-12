# Deploy cutover — domains

**Target**

| Host | Project | Role |
|------|---------|------|
| **`https://rinsehq.com`** | `apps/api` (Vercel) | API, book, portal, admin, privacy/terms |
| **`https://waitlist.rinsehq.com`** | `detailing-website` | Marketing / waitlist |
| PocketBase | Fly `detailing-pb` | Database |

Mobile: `EXPO_PUBLIC_APP_API_URL=https://rinsehq.com`

## Order of operations (DNS)

1. **Add `waitlist.rinsehq.com`** to the marketing Vercel project (`detailing-website`) and verify it loads.
2. **Redirect or move** any waitlist CTAs to `waitlist.rinsehq.com` (keep a temporary redirect from old marketing paths if needed).
3. **Point apex `rinsehq.com`** (and usually `www` → apex) at the **`apps/api`** Vercel project (Root Directory = `apps/api` if monorepo).
4. Optional: keep `app.rinsehq.com` as a CNAME to the same API project during transition, then drop it.

## Vercel — API (`apps/api`)

1. Root Directory: `apps/api` (or nested git remote for that app).
2. Domains: `rinsehq.com`, `www.rinsehq.com` (redirect www → apex).
3. Env: PB, Stripe, `PLATFORM_ADMIN_EMAILS`, `APPLE_*`, `NEXT_PUBLIC_APP_URL=https://rinsehq.com`.
4. Deploy production.

## Vercel — waitlist (`detailing-website`)

1. Domain: `waitlist.rinsehq.com` only (remove apex from this project after cutover).
2. Update any absolute links that assumed marketing lived on the apex.

## Mobile (EAS)

```bash
cd apps/mobile
npx eas env:create --name EXPO_PUBLIC_PB_URL --value https://detailing-pb.fly.dev --environment production
npx eas env:create --name EXPO_PUBLIC_APP_API_URL --value https://rinsehq.com --environment production
```

## Apple IAP / ASN

- Production + Sandbox: `https://rinsehq.com/api/billing/apple/notifications`

## Verify

| Check | Expect |
|-------|--------|
| `https://waitlist.rinsehq.com` | Marketing / waitlist |
| `https://rinsehq.com/` | API shell (or marketing redirect into product — not the old waitlist-only site) |
| `https://rinsehq.com/book/{slug}` | Booking |
| `https://rinsehq.com/portal/{token}` | Portal |
| `https://rinsehq.com/admin` | Admin |
| `https://rinsehq.com/privacy` | Privacy (use this URL in App Store Connect) |
| Mobile login | Against Fly PB + `rinsehq.com` API |

## Local

```bash
cd apps/api && npm run build && npm run dev
cd apps/mobile && # EXPO_PUBLIC_APP_API_URL=http://localhost:3000
```
