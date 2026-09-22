# Desktop onboarding rollout

## Deploy and enable

1. Deploy PocketBase migration `1762800000_desktop_onboarding.js` and the updated hooks together. The migration adds a server-only `desktop_onboarding` collection, an organization eligibility flag, and a checkout return-context field. Existing organizations stay exempt; organizations created after the migration become candidates.
2. Deploy the API with `DESKTOP_ONBOARDING_ENABLED=false` (also the default when unset). Configure `DESKTOP_APP_ORIGIN` as the exact desktop origin, e.g. `https://desk.rinsehq.com`. Only HTTPS origins or HTTP localhost are accepted; no paths, credentials, or arbitrary user redirects.
3. Deploy Desk. Its existing `VITE_APP_API_URL` must point to the updated API. No mobile release or configuration changes are required.
4. Confirm staging behavior, then set `DESKTOP_ONBOARDING_ENABLED=true` on the API. New candidate organizations see setup after authentication/email verification. Existing organizations can opt in from Settings → Account → Billing → Open desktop setup.

New accounts still start Free through the existing signup paths. Selecting a paid plan opens checkout; only verified provider entitlement removes the cap. Returning with a success URL does not grant access. Existing payable checkout sessions are reused, including their original return destination; if checkout was previously started elsewhere, return to the desktop tab and refresh the plan after payment.

Desktop completion lives in `desktop_onboarding`, independently of `app_settings.onboarding_step` and `onboarding_completed_at`. Business details and billing entitlements remain organization-wide. The optional product tour is separate from setup.

## Rollback

Set `DESKTOP_ONBOARDING_ENABLED=false` to bypass the desktop gate. Keep saved state and billing records. Do not roll back schemas while the deployed code or active checkout reservations still depend on them.

## Verification

Run unit checks:

```sh
npm run test:onboarding --prefix rinse-desk
npm run test:money-parity --prefix rinse-desk
npm test --prefix rinse-api -- src/lib/server/desktop-onboarding.test.ts src/lib/server/desktop-checkout.test.ts src/lib/server/desktop-checkout-route.test.ts src/lib/server/signup-pricing.test.ts src/lib/subscription.test.ts src/lib/server/billing-webhooks.test.ts
npm run build --prefix rinse-desk
npm run build --prefix rinse-api
```

The scripts below create test records. Use an **empty disposable local PocketBase**, never a production database. Apply repository migrations/hooks and create the test-only superuser `desktop-test@example.test` / `DesktopTestPassword123` before running them.

```sh
PB_TEST_URL=http://127.0.0.1:18099 node scripts/test-desktop-onboarding-pocketbase.mjs
```

For browser checks, start the API against that same disposable database with its superuser credentials, `DESKTOP_ONBOARDING_ENABLED=true`, and `DESKTOP_APP_ORIGIN=http://127.0.0.1:18443`. Start Desk with `VITE_PB_URL=http://127.0.0.1:18099`, `VITE_APP_API_URL=http://127.0.0.1:18080`, and `PORT=18443`. The script uses the installed Playwright Chromium and writes screenshots to `/tmp/rinse-desktop-plan.png` and `/tmp/rinse-desktop-ready.png`.

```sh
PB_TEST_URL=http://127.0.0.1:18099 API_TEST_URL=http://127.0.0.1:18080 DESK_TEST_URL=http://127.0.0.1:18443 node scripts/test-desktop-onboarding-browser.mjs
```

These browser checks use local test accounts and simulated server entitlement changes, not a live Stripe purchase. Verify the actual Stripe test-mode redirect and webhook configuration in staging before enabling production onboarding.
