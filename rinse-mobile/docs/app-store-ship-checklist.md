# App Store ship checklist — rinse-mobile

Ordered checklist for first iOS App Store submission. Check boxes as you go.  
Owner: _______________ · Target submit: _______________

---

## 0. Billing — Path A (StoreKit) · chosen 2026-07-11

iOS upgrades use **StoreKit** (`expo-iap`); web/PWA keeps Stripe Checkout. Server verifies JWS and writes org entitlement.

| Surface | iOS behavior |
|---------|----------------|
| Onboarding plans | `startStarterUpgrade` → StoreKit → `POST /api/billing/apple/confirm` |
| Settings → Billing | Upgrade with Apple + Restore; manage → App Store subscriptions |
| Paywall sheet | Primary upgrades via StoreKit |

### Code (done)

- [x] Client purchase + restore (`src/lib/iap-purchase.ts`)
- [x] Server confirm + ASN V2 (`/api/billing/apple/*`)
- [x] PB fields `billing_provider`, `apple_original_transaction_id`
- [x] Replace Safari upgrade CTAs on iOS
- [x] Manage subscription → Apple Settings for apple-billed orgs

### Still required in App Store Connect / ops

- [ ] Create auto-renewable subscription **Starter** with product id `com.rinse.mobile.starter.monthly` (or set `EXPO_PUBLIC_IAP_STARTER_PRODUCT_ID` / `APPLE_IAP_STARTER_PRODUCT_ID` to match)
- [ ] Enable **In-App Purchase** capability on the App ID
- [ ] Set Vercel env: `APPLE_IAP_BUNDLE_ID`, `APPLE_IAP_STARTER_PRODUCT_ID`, `APPLE_APP_APPLE_ID`
- [ ] Run PB migration `1762700000_org_apple_iap_fields.js` on production PocketBase
- [ ] Configure ASN V2 URL: `https://rinsehq.com/api/billing/apple/notifications` (Production + Sandbox)
- [ ] Paid Apps Agreement + tax/banking complete in ASC (required before IAP works)
- [ ] TestFlight: purchase sandbox → confirm unlock → restore on second device/account edge cases

**Chosen path:** ☑ A · ☐ B · ☐ C  
**Date decided:** 2026-07-11

---

## 1. Apple Developer & identity

- [ ] Organization Apple Developer account ready (not personal if you need the org name on the listing)
- [ ] Finalize bundle ID (today: `com.rinse.mobile` in `app.config.ts` — replace if needed)
- [ ] App ID + Sign in with Apple capability enabled for that bundle ID
- [ ] Create App Store Connect app record; note **Apple ID**, **ASC App ID**, **Team ID**
- [ ] Fill `eas.json` → `submit.production.ios` (`REPLACE_WITH_*` placeholders)
- [ ] Register OAuth redirect `rinse://oauth/callback` in PocketBase + Google + Apple consoles

---

## 2. Assets & config

- [ ] Replace `assets/images/icon.png` with **1024×1024** square master (current file is 656×625)
- [ ] Wire splash in `app.config.ts` (`expo-splash-screen` + `splash-icon.png` already in package/assets)
- [ ] Align versions: `app.config.ts` `version` ↔ marketing story (`package.json` is `0.1.0` today)
- [ ] Confirm `ITSAppUsesNonExemptEncryption: false` still accurate
- [ ] Confirm camera / photo library usage strings match real features
- [ ] Privacy policy live at https://rinsehq.com/privacy (API host; waitlist is waitlist.rinsehq.com)
- [ ] Support URL + marketing URL ready for ASC (marketing: https://waitlist.rinsehq.com)

---

## 3. Auth (Guideline 4.8)

If Google login ships, Apple must work in production.

- [ ] PocketBase Apple OAuth provider configured for production
- [ ] TestFlight: Sign in with Apple end-to-end (`rinse://oauth/callback`)
- [ ] TestFlight: Google OAuth end-to-end
- [ ] TestFlight: email/password + forgot password
- [ ] Confirm production EAS env has **no** `EXPO_PUBLIC_TEST_EMAIL` / `EXPO_PUBLIC_TEST_PASSWORD`

---

## 4. Compliance already mostly done (verify)

- [ ] Account deletion: Settings → Data → Delete account works against production API
- [ ] Privacy screen opens; email `privacy@rinsehq.com` (or env override) reachable
- [ ] No ATT prompt needed (no tracking SDK / no `NSUserTrackingUsageDescription`) — re-check if you add analytics later
- [ ] Privacy Manifest UserDefaults reason still valid after dependency changes

---

## 5. Production build & TestFlight

```bash
cd apps/mobile
npx eas env:create --name EXPO_PUBLIC_PB_URL --value https://detailing-pb.fly.dev --environment production
npx eas env:create --name EXPO_PUBLIC_APP_API_URL --value https://rinsehq.com --environment production
npx eas build --profile production --platform ios
npx eas submit --profile production --platform ios
```

API + DNS (`rinsehq.com` = API, `waitlist.rinsehq.com` = marketing): see [`../../api/docs/DEPLOY_CUTOVER.md`](../../api/docs/DEPLOY_CUTOVER.md).

- [ ] Production EAS secrets set (`EXPO_PUBLIC_APP_API_URL` = **https://rinsehq.com**)
- [ ] Production build succeeds
- [ ] Install via TestFlight on a real device
- [ ] Smoke: login → home → create client/job → invoice path (per billing path) → settings → sign out
- [ ] Smoke: offline enqueue + sync (if shipping offline on)
- [ ] Smoke: paywall / free / trial behavior matches **chosen billing path** (no illegal checkout)

---

## 6. App Store Connect listing

- [ ] App name, subtitle, description, keywords
- [ ] Category (e.g. Business / Productivity)
- [ ] Age rating questionnaire
- [ ] Privacy nutrition labels (data collected: account, photos, etc.)
- [ ] iPhone screenshots (required sizes for current ASC requirements)
  - Prefer native captures: `npm run marketing:capture` (`docs/marketing-screenshots.md`)
  - Optional: frame under `marketing/export/`
- [ ] Optional preview video (`apps/api/marketing/scripts/video-operator.md` if present)
- [ ] Review notes: demo account credentials + any entitlement explanation
- [ ] Contact + export compliance answers

---

## 7. Soft / post-1.0 (not required to submit)

- [ ] Restore missing roadmap docs or keep this file as source of truth (`transition.md` / `native-execution.md` / `native-pwa-parity.md` are referenced but absent)
- [ ] Visual audit baselines (`docs/native-visual-audit.md`)
- [ ] Full onboarding psychology pass (`docs/onboarding-experience-sheet.md`)
- [ ] Path A StoreKit if you shipped Path C for v1
- [ ] Wire visual-audit to CI
- [ ] Android Play listing (out of scope for this iOS checklist)

---

## Code touchpoints (Path A)

| File | Role |
|------|------|
| `src/lib/iap-purchase.ts` | StoreKit purchase + restore |
| `src/lib/iap-products.ts` | Product id (`com.rinse.mobile.starter.monthly`) |
| `src/lib/billing-web.ts` | Manage → Apple vs Stripe |
| `app/settings/billing.tsx` | Upgrade / restore UI |
| `detailing-app/.../api/billing/apple/confirm` | Verify JWS + unlock org |
| `detailing-app/.../api/billing/apple/notifications` | ASN V2 renew/cancel |

---

## Pass / fail

| Gate | Status |
|------|--------|
| Billing path decided + implemented | ☑ Path A code · ☐ ASC product + env |
| ASC IDs + EAS submit filled | ☐ |
| Icon 1024² + splash | ☐ |
| TestFlight smoke passed (incl. IAP sandbox) | ☐ |
| Listing + screenshots | ☐ |
| **Ready to submit** | ☐ |
