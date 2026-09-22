# Desktop signup, plan selection, and onboarding

Date: 2026-09-22
Status: Implemented locally; deployment and enablement pending
Scope: Desktop only (`rinse-desk`), plus narrowly required additive backend support. No mobile app changes.
Implementation branch: `codex/desktop-signup-onboarding`

## Outcome

Every new desktop organization sees a clear Free-versus-paid choice after authentication and required email verification, completes a short business setup, and enters the real dashboard with its plan and job allowance visible. Payment is optional. Free accounts have five active jobs from account creation; verified paid accounts have unlimited active jobs.

Use **Starter** as the paid name because that is the current product/billing policy. “Pro” in the request refers to this paid offering. Renaming the product is a separate coordinated change, not a new entitlement.

## Existing behavior and reusable pieces

- `src/App.tsx`: `Gate` checks authentication and email verification, then renders `DataProvider` and `Shell`. No persisted setup gate exists.
- `src/lib/onboarding-tour.ts`: tour completion is a browser-local flag. It is not business setup completion and does not follow an organization across devices.
- `src/lib/settings-api.ts`: desktop settings do not expose onboarding progress.
- `../rinse-api/src/lib/server/signup.ts`: email and OAuth provisioning seed Free organizations and settings with `onboarding_step: 1`. No trial is granted.
- Existing shared onboarding fields are consumed by other surfaces. Leave their values and semantics unchanged; desktop gets its own onboarding state.
- `src/components/settings/sections/BillingCard.tsx` already starts checkout and opens subscription management. The API owns pricing, offer eligibility, and paid activation.
- PocketBase job hooks already enforce the Free cap on creation and reactivation, including concurrent writes. This project surfaces that policy; it does not replace enforcement with a browser check.

## First-run experience

1. **Choose your plan.** Show Free ($0, up to five scheduled/in-progress jobs, invoices and customer payments) beside Starter (unlimited active jobs and paid tools). Fetch the current Early offer from the pricing API. Actions: “Continue with Free” and “Upgrade to Starter”; show the actual available price. No preselected purchase, credit-card requirement for Free, or implied trial. Recognized paid/Founding organizations see their current access and continue without another purchase.
2. **Business basics.** Prefill business name and known contact information from signup. Confirm business name and timezone; contact/address fields remain optional unless an existing operation requires them. Save actual organization settings with validation and retry support.
3. **Prepare your first job.** Let the user review/add a service and price, then optionally add a client. Allow “Do this later.” Do not create a fake job, invoice, or payment to finish setup; inspect seeded services to avoid duplicates.
4. **Ready to go.** Summarize the chosen plan and saved settings. Offer “Create your first job” and “Go to dashboard.” Paid users may optionally configure booking; Free users see booking as an upgrade feature, with no required dead-end step. Offer the existing product tour only after setup, as an optional separate action.

Keep the desktop layout consistent with existing desktop components. Include visible progress, Back, saved-state feedback, accessible focus management, and actionable errors. Preserve submitted values on network failures.

## State, routing, and compatibility

- Add an organization-scoped desktop onboarding read/update contract, exposed through the desktop settings adapter or a dedicated API. Track a desktop flow version, stable completed-step identifiers, plan-choice acknowledgment, and desktop completion timestamp server-side in dedicated fields or a dedicated record. A plan choice is a UX preference, never billing authority.
- Do not read or write shared `onboarding_step` or `onboarding_completed_at` to drive desktop setup. Desktop completion is independent of mobile completion. Prefill existing business data without changing another surface's onboarding status.
- Load onboarding state after auth/verification and before the normal desktop shell. Loading or read failure must not mark setup complete or silently bypass it. Provide retry.
- Save each step independently and make writes idempotent. Resume on refresh, browser restart, another desktop browser/device, or checkout return. Handle organization/account switches without leaking another organization's progress.
- Existing active organizations must not suddenly be locked into setup merely because desktop previously never wrote completion. Use the migration-defined cohort of new organizations; offer existing organizations an optional desktop setup checklist regardless of their signup surface. Do not blanket-backfill unfinished new accounts as complete.
- Keep setup completion and optional tour completion separate. Scope tour dismissal to organization/user if retained locally; do not rely on the current global browser key for onboarding.

## Checkout and cap integration

- Reuse `/api/billing/pricing`, `/api/billing/checkout`, and subscription refresh. Confirm that billing return routes restore the desktop onboarding context; add a validated destination/context mechanism if current deployment routes return to another surface. Never accept arbitrary redirect URLs.
- Persist progress before leaving for checkout. On return, refresh server entitlement and display payment pending until confirmed. A success query parameter alone must never grant paid access.
- Cancellation/failure lets the user retry or continue Free. Delayed payment confirmation must not strand setup, and choosing Free must never downgrade an already-paid account.
- Display Free usage such as “3 of 5 active jobs” on the dashboard and job creation flow. Explain which statuses count and that finishing/canceling work frees a slot. At the cap, offer an upgrade or a route to existing jobs.
- Refresh after job mutations and billing changes; translate the database cap rejection into an actionable message, including concurrent/stale-count failures. Paid accounts must not show a Free quota or be blocked by a stale local count.

## Delivery sequence

1. **State and rollout:** persistence/migration, typed adapter, organization scoping, isolation from existing onboarding state, and desktop entry gate.
2. **Plan and billing:** first-run chooser, dynamic offer display, desktop checkout return/resume, cancellation and pending states.
3. **Business setup:** saved business basics, optional service/client setup, completion and dashboard handoff.
4. **Usage and tour:** active-job allowance, cap-error upgrade path, optional post-setup tour.
5. **Verification and rollout:** exercise new and existing account cohorts in staging, confirm deployed hooks and billing configuration, then enable for new accounts.

## Acceptance checks

- Email signup reaches plan selection after verification; new Google/Apple accounts reach it after provisioning. Both begin Free without a trial.
- Continue Free completes setup without checkout; database rejects a sixth active job. Completing/canceling work permits a replacement; reopening at the cap is rejected.
- Verified Starter/Early/Founding access permits more than five active jobs and removes quota UI. Expiration/downgrade retains existing records and reinstates new-activation limits.
- Checkout success, cancel, failure, delayed webhook, duplicate clicks, and browser return all preserve progress and correct entitlements.
- Refresh, desktop cross-device resume, account switching, and read/write failures behave predictably without duplicate records.
- Desktop setup does not modify shared onboarding progress or completion fields, and additive backend changes preserve existing callers and default checkout return behavior. No mobile source, configuration, or tests are changed.
- Existing desktop users are not forcibly interrupted; new users cannot accidentally bypass the setup gate through ordinary navigation.
- The tour is optional and independent; its demonstration data never becomes setup data.
- Keyboard/screen-reader navigation, desktop viewport behavior, and errors are verified in the actual flow.

## Boundaries

The mobile app is explicitly out of scope: no mobile screens, routing, onboarding, billing flows, state migrations, or cross-surface completion synchronization. Backend work is limited to additive support required by desktop; existing mobile-facing contracts remain unchanged. Normal organization business data and verified billing entitlements remain shared as today.

No changes to the five-job policy, payment verification authority, paid naming, photo limits, or unrelated feature entitlements. Legacy Pro subscriber reconciliation remains a separate prerequisite if such live accounts exist. Implementation is present on the branch. No production data or deployment configuration was changed.

## Implementation work packages

### 1. Persist desktop progress and determine eligibility

**Files:** new PocketBase migration under `pocketbase/pb_migrations/`; new `rinse-api/src/lib/server/desktop-onboarding.ts`; new `rinse-api/src/app/api/desktop/onboarding/route.ts`; new `rinse-desk/src/lib/desktop-onboarding-api.ts` and `desktop-onboarding.ts`.

- Create a dedicated `desktop_onboarding` collection with a unique organization relation, version, completed-step identifiers, plan-choice acknowledgment, and completion timestamp. Keep direct collection access server-only; authenticated API operations derive the organization from the session, never a client-supplied organization ID.
- Use stable steps `plan`, `business`, `prepare`, and `ready`. Record an explicit skip for optional preparation. Completion requires plan acknowledgment and saved business basics, not a purchase. Selecting an upgrade records intent; acknowledgment occurs on verified access or explicit Continue Free, not merely opening checkout.
- Gate rollout with `DESKTOP_ONBOARDING_ENABLED`. The migration adds a false-by-default organization candidate flag; a model create hook marks subsequently created organizations as candidates. Existing organizations are exempt and can opt in through Settings. Freeze eligibility in the dedicated progress record when initializing it. This avoids relying on historical creation timestamps absent from some organization schemas. Do not infer eligibility from missing mobile completion fields, phone numbers, or a browser flag.
- GET returns eligibility, progress, and existing business details. POST accepts only validated desktop progress operations (matching existing Desk CORS methods). Merge completed steps under a transaction so retries or two desktop sessions cannot regress completion. Make business saves and progress advancement recoverable: only advance after successful persistence.
- Keep the existing signup functions unchanged. Initialize desktop progress lazily on the first authenticated desktop visit, including OAuth accounts.
- Add a strict business-settings read for this flow: the existing `loadAppSettings()` returns defaults on failure, which must not be mistaken for a successfully loaded empty business. Use partial updates for onboarding-owned fields so stale defaults cannot overwrite unrelated settings.

**Done when:** new eligible accounts resume persisted desktop state; existing organizations remain exempt; tenant isolation, retries, rollout-off behavior, and unchanged shared onboarding fields are covered by tests.

### 2. Add the desktop gate and setup shell

**Files:** `rinse-desk/src/App.tsx`; new `rinse-desk/src/components/onboarding/DesktopOnboardingGate.tsx`, `DesktopOnboardingFlow.tsx`, and step components; `rinse-desk/src/providers/AuthProvider.tsx` only if needed for account-change reset.

- Insert the gate after authentication/email verification and before the normal shell. Keep existing verification-link handling intact.
- Model loading, error, exempt, in-progress, and completed states explicitly. Retry failures without flashing the dashboard or treating failure as completion.
- Reset requests/state on organization change and ignore late responses from the previous organization. Use backend progress as the source of truth; URL parameters may request a step but cannot skip prerequisites.
- Build a desktop layout with progress navigation and existing desktop form/button primitives. Preserve form values on errors and focus the current step heading after navigation.
- Start with plan choice; business basics and optional preparation follow. Persist completion before mounting the dashboard.

**Done when:** fresh email/OAuth organizations enter the flow correctly, reload resumes it, and existing/completed accounts enter the normal app.

### 3. Wire plan choice and desktop checkout return

**Files:** new desktop plan step and `rinse-desk/src/lib/billing-checkout.ts`; `rinse-desk/src/lib/subscription.ts`; `rinse-api/src/app/api/billing/checkout/route.ts`; `rinse-api/src/lib/server/stripe.ts` or a dedicated return-destination helper; desktop return handling in `App.tsx`/onboarding gate.

- Fetch `/api/billing/pricing` for current offer display and reuse shared pricing constants for feature descriptions. Keep plan selection separate from entitlement writes.
- Add an optional, validated checkout context such as `desktop_onboarding`. Resolve it to a server-configured desktop origin and fixed return path/query; do not accept arbitrary callback URLs. Requests without context retain existing redirect behavior.
- Handle return through the desktop SPA entry point, preserving onboarding progress through auth/verification if necessary. Treat `success`/`cancel` as presentation hints only.
- Review the billing reservation/session reuse behavior before introducing different return URLs: repeated requests must reuse or safely recover an existing payable session, not create duplicate subscriptions. Cover an existing checkout opened from another surface without changing that surface's contract.
- On return, refresh entitlement with bounded polling and an explicit Retry action. Show pending confirmation accurately and allow continued Free use while confirmation is pending. Do not write a downgrade when Continue Free is chosen.
- Key desktop subscription caching by organization; the current module-level cache is not organization-keyed and returns cached data on errors. Provide a strict fresh-read path for billing confirmation and prevent stale paid/free state crossing accounts.

**Done when:** confirmed upgrades remove the cap, canceled/failed/pending payments retain correct access, and checkout calls without the new context behave exactly as before.

### 4. Finish business setup and dashboard handoff

**Files:** desktop step components; `rinse-desk/src/lib/settings-api.ts`; existing desktop service/client persistence adapters located during implementation; `rinse-desk/src/App.tsx`; `rinse-desk/src/lib/onboarding-tour.ts`.

- Prefill business name/contact details; require business name and valid timezone. Save through existing tenant-scoped persistence with narrow updates.
- Load existing services before offering creation. Reuse existing service/client operations and preserve their validation. Avoid duplicate records on double submission or retry; optional preparation can be skipped entirely.
- Keep booking configuration an optional link to the existing paid capability rather than expanding this delivery into a booking-setup redesign.
- Persist completion, then route to the real dashboard or existing job-creation action. Do not create records to demonstrate success.
- Replace automatic tour launch after setup with an explicit offer. Give tour dismissal its own organization/user-scoped key, preserving the ability to launch the tour later. Never mark desktop setup complete from a tour dismissal.

**Done when:** a user can reach a usable dashboard on Free without creating a job, entering payment details, or taking the tour.

### 5. Show the Free allowance and handle cap errors

**Files:** `rinse-desk/src/pages/Dashboard.tsx`; desktop job creation/reactivation components and persistence adapter located during implementation; `rinse-desk/src/lib/subscription.ts`; new `rinse-desk/src/lib/job-allowance.ts` if a separate adapter is warranted.

- Query the organization-wide count of scheduled/in-progress jobs; do not derive allowance from a calendar date window, a paginated list, or tour data.
- Show quota only for confirmed Free/lapsed access. Render unavailable state on read failure rather than an invented zero or paid entitlement.
- Refresh after relevant mutations and confirmed billing changes. Permit normal edits of existing jobs over the limit; block only new activations as enforced by PocketBase.
- Translate the specific cap rejection into an upgrade/manage-jobs action without labeling all 403 responses as quota errors. Prefer a stable backend error identifier if an additive, backward-compatible response is needed.

**Done when:** Free sees accurate usage and an actionable sixth-job rejection; paid users do not see the Free quota; concurrent changes remain safely enforced by the database.

## Validation and release checklist

- Add a focused desktop onboarding Vitest config/script. The existing `vitest.money-parity.config.ts` includes only money tests; it will not discover new onboarding tests. Test state transitions, organization switching, strict error handling, quota status classification, and completion requirements rather than duplicating UI markup.
- Add API tests for authentication/tenant scoping, cohort eligibility, idempotent progress, validated checkout context, default redirect preservation, and provider confirmation. Before editing Next.js files, read the installed version's relevant guides as required by `rinse-api/AGENTS.md`.
- Run persistence checks against a disposable local PocketBase: apply the new migration, enforce unique progress per organization, reject cross-tenant access, and confirm desktop operations leave shared onboarding fields unchanged.
- Exercise desktop signup-to-dashboard and checkout-return paths in a browser with test accounts/provider fixtures; include verify-email, OAuth provisioning, refresh, cancellation, delayed confirmation, existing-account exemption, and optional tour. Do not purchase a live subscription for verification.
- Run the focused desktop tests and `npm run build --prefix rinse-desk`. Run relevant API signup, subscription, onboarding, and checkout tests; add an API production build when API routes change. Retain existing money-parity coverage when shared desktop adapters are touched. No mobile build, tests, source, or configuration changes are part of this delivery.
- Review the changed-file list before release: permitted areas are desktop plus narrowly required API/PocketBase additions and this plan. Confirm no mobile changes and no entitlement-policy changes.
- Deploy additive persistence/API support first, then desktop with the gate disabled. Verify the configured desktop return origin and migration-defined eligibility cohort in staging; enable onboarding only after the acceptance checks pass.
- Roll back the desktop gate using the enable flag while retaining saved progress and billing truth. Avoid destructive schema rollback or resetting user completion data.

Implementation order follows work packages 1–5. Each package should be a reviewable commit with its focused checks. The implementation is complete locally; deployment and live-account changes are not part of this pass.


## Implementation results (2026-09-22)

- Added the dedicated PocketBase collection/model hooks, verified-user API, transactional setup steps, and independent desktop gate.
- Added plan selection, current offer pricing, desktop checkout context/return feedback, narrow business saves, optional service/client creation, and real first-job handoff.
- Added organization-wide Free usage and cap messages, paid exemptions, organization-keyed entitlement caching, and optional organization/user-scoped tour completion.
- Existing organizations remain exempt even when they have no settings record. Optional setup prefills from the organization and creates settings only when the business step is saved.
- Scope adjustment: migration-defined eligibility replaces a timestamp cutoff because the existing organization schema does not guarantee a creation timestamp. The API uses POST for progress mutations to preserve existing CORS conventions.
- Validation: 25 relevant API unit tests, 8 desktop onboarding/entitlement tests, 3 existing money-parity tests, disposable PocketBase integration checks, and browser flow checks passed. Desktop and API production builds passed.
- Browser checks cover Free setup, page refresh, another-browser resume, real optional records, first-job form handoff, existing-account exemption, canceled checkout, forged success ignored, and confirmed paid access without Free quota UI. Stripe session creation/reuse is covered with mocked provider responses; no live purchase was made.
- The standalone desktop TypeScript check reports an existing unused `requiredEmailField` import in the installed `@rinse/core` dependency. No new desktop TypeScript errors were reported. Builds retain existing CSS import-order/chunk-size warnings.
- No files under `rinse-mobile` were modified.

See `../desktop-onboarding-rollout.md` for configuration and verification commands.
