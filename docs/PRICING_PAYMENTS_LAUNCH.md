# Pricing, onboarding and payments launch policy

Implemented September 21–22, 2026. Code and local test results do not establish that live Stripe payments, payouts, or App Store subscriptions are operational.

## Product policy

`packages/core/src/pricing.ts` is the pricing/entitlement source for API, mobile, desktop and landing. The PocketBase JSVM mirror in `pb_hooks/pricing.js` is exercised against a real disposable PocketBase database by `scripts/test-pricing-pocketbase.sh`.

- Free: $0; clients, vehicle profiles, basic scheduling/notes, five active jobs, invoice creation, invoice PDFs, invoice delivery and invoice-only payment links.
- Active jobs are exactly `scheduled` and `in_progress`. Completed, invoiced, paid and cancelled jobs do not count. Creation and reopening are checked in a serialized database transaction, including server and public-booking writes.
- Starter: $6 USD/month. Unlimited active jobs and the existing full Starter feature set: booking, quotes, lead pipeline, full client portals, inventory, expenses, reports, receipt scanning, templates and auto-messages. Former Pro capabilities are included, not separately sold.
- Early: Starter at $3 USD/month for the first 100 qualifying paying organizations. One organization is the operator billing unit. A verified positive subscription payment consumes a permanent allocation; a waitlist entry or an abandoned checkout does not. One continuous subscription retains its Early price. Termination forfeits Early; resubscribing never automatically restores it. Previously consumed allocations are not recycled to make a misleading “first 100” claim.
- Founding: lifetime Starter at $0, personally granted by an authorized owner through the admin endpoint. No signup allocation. Maximum 20 non-internal organizations. Ordinary organization members cannot mutate billing fields or their tenant membership.
- New email and OAuth accounts start on Free, with booking disabled. No trial is seeded. A deliberate purchase enables paid access. Cancelling renewal preserves access through the paid period. Actual termination returns to Free, preserving all records; operators above five active jobs can edit/finish them but cannot create or reopen active work until below five.
- Paid access requires an active subscription and a future paid-through date. Past-due access falls back to Free while payment management remains available. Neither a customer ID nor an expired date grants paid access.

## Audit and route decisions

The original API billed Starter/Pro with launch coupons, mobile advertised $12/$6 and trials/vaults, desktop rejected Free invoice sharing, and landing advertised unrelated Starter/Pro/Scale tiers plus fictional destinations. Mobile referenced Apple confirmation and pricing APIs that did not exist. PocketBase allowed ordinary organization updates to billing fields and blocked Free job/invoice creation.

Customer web routes `/book/*`, `/portal/*`, `/embed/*`, legal pages, `/api/*`, administration and auth callbacks remain server workflows. `/billing/return` is a neutral provider return page, not an operator shell. Retired operator pages (`/settings`, `/jobs`, `/clients`, `/invoices`, `/quotes`, `/pipeline`, `/reports`, `/inventory`, `/supplies`, `/onboarding`, `/setup`, `/demo` and API root) redirect to the configurable marketing origin. No marketing CTA offers desktop signup. Desktop remains a legitimate authenticated existing workspace; its Account settings provide billing checkout/management. iOS internal `/settings/billing` remains a native screen, not a web destination.

Invoice-only access does not unlock full customer portals, quote PDFs or report PDFs. Portal token scope and linked client/job ownership are validated. Free invoices use the same connected operator payment flow as Starter.

## Stripe subscriptions

Checkout validates the configured Stripe recurring price against the shared USD cent amount, monthly interval, quantity and active state. No annual offer, trial, promotional-code field or launch coupon is applied.

PocketBase `/api/rinse/billing` is superuser-only and serializes reservations, provider binding, entitlement updates, processed event IDs and Founding grants. Concurrent checkout requests reuse an organization/generation and Stripe idempotency key. Stripe sessions expire after 30 minutes; reservations last 35 minutes to allow final events to arrive. Expiration events release unpaid reservations. Crashes/ambiguous provider errors retain reservations until expiry, avoiding a second payable session. Failed/abandoned reservations are excluded from availability after expiry. Allocation only happens after verified payment, not on subscription creation.

The platform webhook verifies the raw request signature using `STRIPE_OPERATOR_WEBHOOK_SECRET`, fetches current subscription state rather than trusting event snapshots, checks price identity and records processed events transactionally with entitlement writes. Separate provider identity and pending/active subscriptions guard against duplicate purchases. Cancel-at-period-end remains distinct from cancellation.

Billing portal must be configured for payment-method changes, cancellation and invoices only. Disable product switching, trials, discounts and annual plans. Set `STRIPE_BILLING_PORTAL_CONFIGURATION` to that configuration; it must not allow subscribing to a second product or switching into Early without eligibility checks.

## Customer payments and responsibilities

The existing Accounts v1 integration now explicitly uses controller properties: `fees.payer=account`, `losses.payments=stripe`, `requirement_collection=stripe`, `stripe_dashboard.type=full`. Checkout creates **direct charges** using the connected account request option. No `application_fee_amount`, destination transfer or Rinse commission is set. Readiness checks reject account configurations with a different payer/liability arrangement.

Responsibilities checked against Stripe documentation:

- Operators pay Stripe processing fees on their direct charges. With “Stripe handles pricing,” Stripe publishes no additional account, payout-volume, tax-reporting or per-payout fees for the platform. Confirm the actual country and commercial account agreement before launch. [Connect pricing](https://stripe.com/connect/pricing)
- Refunds and disputes reduce the connected account’s balance; operators manage them in their full Stripe dashboard. Rinse also exposes an authenticated, account-scoped partial/full refund API with provider idempotency. Refunded processing fees are not assumed to be returned; actual Stripe pricing governs. [Direct charges/refunds](https://docs.stripe.com/connect/direct-charges?platform=web&ui=stripe-hosted)
- The chosen controller assigns connected-account payment losses to Stripe, unlike Express’s platform-loss configuration. This is not a claim that Rinse has no contractual obligations, no subscription processing costs, or no liability for charges on its own platform account. [Controller configuration](https://docs.stripe.com/connect/migrate-to-controller-properties), [charge responsibilities](https://docs.stripe.com/connect/integration-recommendations)
- Instant payouts, currency conversion, disputes and optional products may carry operator charges. Do not market payment processing or payouts as free.

The connected-account webhook uses its own `STRIPE_WEBHOOK_SECRET` and requires the verified `event.account`. It fetches the current charge using that account, checks currency and verifies invoice → organization → connected-account identity. A transaction records each charge once and reconciles its net refunded amount into the invoice; duplicate/concurrent events cannot double-credit it, and stale events cannot undo a refund. Payout status is visible through the account-status/payout APIs and Stripe dashboard, including pending verification. No live payout success is assumed from onboarding completion.

## Apple software subscriptions

StoreKit (`expo-iap`) purchases and restore remain native on iOS. Software features use IAP; physical detailing services use Stripe. This follows Apple's distinction between feature subscriptions and services consumed outside the app. There is no blanket Stripe subscription checkout redirect in iOS storefronts. Existing web subscriptions are managed in authenticated Desk settings; Apple subscriptions open Apple's management screen. [Apple review guidelines §3.1.1, §3.1.3(b), §3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/)

The prepare endpoint reserves the eligible SKU and supplies a stable per-organization UUID `appAccountToken`. The app fetches the eligible product and shows Apple's localized price before confirmation. Server confirmation uses Apple's official signed-data verifier, trusted root certificates, expected environment/bundle/app ID and current App Store Server API status. Restore cannot move a subscription to another organization. Signed server notifications handle renewal, cancellation, expiration and revocation; unfinished transactions are acknowledged only after server confirmation. [Apple server library](https://apple.github.io/app-store-server-library-node/)

Configure Starter and Early as monthly products at $6/$3 USD in one subscription group, with the same benefits. Disable family sharing and introductory free trials; preserve existing subscribers' prices when editing price schedules. App Store local-currency prices come from StoreKit, not a hard-coded USD billing promise.

Early reservations on Apple last 24 hours to accommodate purchase confirmation. A late/deferred Early transaction whose reservation has expired and whose capacity is no longer available must fail entitlement allocation and be handled by support/refund; it must never silently grant an extra Early seat. Verify delayed/Ask-to-Buy behavior in Sandbox before release. App Store subscriptions can be managed outside Rinse, so server conflict detection is the final entitlement boundary; a provider-side purchase completed after a conflicting subscription requires support/provider refund, not dual entitlements. Android purchase is intentionally unavailable until Play Billing is implemented; there is no Stripe substitute inside the Android purchase action.

## Waitlist and walkthrough

Public CTA: “Join the iOS waitlist.” `VITE_APP_STORE_URL` may switch the primary CTA to “Get the free app” only when it is an actual `https://apps.apple.com/…` listing. Free/Starter interest is durably stored in a locked PocketBase `waitlist` collection. Normalized email has a unique index; repeat signup updates interest without duplicate rows. Validation, rate limiting, honest storage failures and accessible status feedback are implemented. Waitlist signup never reserves Early capacity.

The five-step walkthrough uses isolated fictional data and local state only. Next/back, progress, replay, exit, arrow keys, focus trapping/restoration, reduced-motion support and touch targets follow the user-control principles in the [WAI carousel tutorial](https://www.w3.org/WAI/tutorials/carousels/). No email, account creation or payment call is made from the walkthrough. Hero composition and screenshot replacement remain deferred; see `ASSET_REFRESH_PLAN.md`.

## Required external setup and release checks

No Stripe or Apple billing credentials were available for this implementation's provider verification. Local mocked provider tests and real disposable PocketBase tests are not a live payment certification.

1. Deploy PocketBase migrations and all hooks together, using PocketBase 0.39.1. Preserve private collection API rules and persistent data volume/backups. Configure server-only `PB_URL`, `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`. Never expose superuser credentials via public environment names.
2. Configure `PLATFORM_ADMIN_EMAILS` with verified owner accounts for manual Founding assignment. POST/PATCH requests require a valid user token and verified allowlisted email. Do not use the ordinary organization update API for grants.
3. Configure Stripe **test mode** first: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER_MONTHLY` (600 USD cents), `STRIPE_PRICE_EARLY_MONTHLY` (300 USD cents), both monthly; `STRIPE_OPERATOR_WEBHOOK_SECRET`; `STRIPE_WEBHOOK_SECRET` for connected accounts; `STRIPE_BILLING_PORTAL_CONFIGURATION`. Subscribe platform events to checkout completed/expired, subscription changes/deletion, invoice paid/payment failed. Subscribe connected events to account updated, charge succeeded/refunded, checkout completed/async payment succeeded.
4. Choose and configure `STRIPE_CONNECT_COUNTRY` and `STRIPE_PAYMENT_CURRENCY` for a supported business configuration. USD is the current invoice amount/display model; other currencies require display and minor-unit support before enabling. Confirm full-dashboard direct-charge controller settings and Stripe-handled pricing in the platform dashboard. Complete representative test onboarding. Validate invoice success, failure, repeated webhook, refund, disputes and payout status. Disputes are managed in Stripe; payout outcomes require provider evidence.
5. Set `NEXT_PUBLIC_APP_URL` to the backend/customer HTTPS origin, `NEXT_PUBLIC_MARKETING_URL` to landing, `VITE_APP_API_URL` for landing/Desk and `EXPO_PUBLIC_APP_API_URL` for mobile. The landing deployment retains the `/api/*` proxy and routes legal pages to the backend. Verify deployed origins and redirects.
6. Configure `RESEND_API_KEY`, a verified `RESEND_FROM_EMAIL`, PocketBase auth-email delivery and optional Upstash shared rate limiting. Invoice email cannot deliver without a mail provider; waitlist storage itself does not require email sending.
7. Complete Apple contracts, tax/banking, bundle registration, subscription group/SKUs, localization, approved pricing and review. Set server `APPLE_ENVIRONMENT` (`Sandbox` first), `APPLE_BUNDLE_ID`, `APPLE_APP_ID` (Production), `APPLE_KEY_ID`, `APPLE_ISSUER_ID`, `APPLE_PRIVATE_KEY`, `APPLE_ROOT_CA_PATHS` (trusted DER roots), `APPLE_STARTER_PRODUCT_ID`, `APPLE_EARLY_PRODUCT_ID`. Set matching mobile `EXPO_PUBLIC_IAP_STARTER_PRODUCT_ID` and `EXPO_PUBLIC_IAP_EARLY_PRODUCT_ID`. Configure App Store Server Notifications V2 at `/api/billing/apple/notifications` for both environments. Test on an iOS development/TestFlight build; Expo Go cannot validate native IAP. Verify purchase, cancel, restore, renewal, expiration, revocation, delayed purchase and cross-provider conflicts.
8. Keep `VITE_APP_STORE_URL` unset until the approved public listing exists. No desktop signup destination is invented.

## Local verification commands

- `npm test --prefix rinse-api`: shared pricing, client gate parity, provider verification and existing API tests.
- `PB_TEST_BINARY=/path/to/pocketbase sh scripts/test-pricing-pocketbase.sh`: fresh local database; migrations, concurrency, Free invoice flow, downgrade, Early and Founding caps, authenticated internal endpoints, payment/refund idempotency.
- `node scripts/test-prelaunch.mjs`: requires local API on 3108, landing on 5008 and disposable PocketBase on 8099 with documented test credentials. Browser keyboard/touch, waitlist persistence and duplicate checks.
- `npm run build --prefix rinse-landing` and `npm run build --prefix rinse-desk`.

Final local verification: 65 API test files / 340 tests passed, landing and Desk production builds passed, fresh PocketBase concurrency/invariant tests passed, and desktop/touch browser checks passed. The API TypeScript check remains blocked by unrelated test-fixture types and concurrent deposit_amount changes. The mobile TypeScript check still reports React Native/Expo typing errors outside the billing changes (navigation safeAreaInsets, RefreshControl element types, StyleSheet and FlashList props). Production provider configuration and native App Store tests remain release prerequisites.
