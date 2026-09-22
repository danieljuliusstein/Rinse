# Feature Verification Suite: 100% Scope

**Current state:** 27 features, 8 verified, 16 partial, 2 mocked, 1 not-tested
**Target:** All 27 at production-depth verification or deliberate mock/N/A classification

---

## Phase 1: Fix Known Blocking Issue (1–2 hours)

### 1.1 Diagnose and fix job creation 400 error
- **Status:** PocketBase job creation returns 400 with no detail
- **Root cause:** Unknown—likely validation or hook error
- **Approach:**
  - Add detailed PocketBase hook logging
  - Test job creation with minimal payload
  - Test with superuser vs. user authentication
  - Check migration/schema consistency
  - Verify subscription/founding member rules don't apply to founding_member=true orgs
- **Unblocks:** Public booking, portal signature, all job-dependent flows
- **Success criteria:** Job creation test passes against real PocketBase

---

## Phase 2: Complete Real PocketBase CRUD Coverage (8–10 hours)

### 2.1 Invoices (1.5 hours)
- **Current:** Domain logic verified (totals, numbering, status)
- **Missing:** Real CRUD, persistence, validation
- **Tests:**
  - Create invoice → persists with correct number and organization_id
  - Update invoice (status, payments, terms) → correctly persisted
  - Delete invoice → cascade behavior verified
  - Validation: invalid job_id rejection
  - Authorization: cross-org denial
  - Idempotency: repeated creates with same data
- **Entry points:** `src/lib/api/index.ts`, PocketBase collection rules

### 2.2 Quotes (1.5 hours)
- **Current:** Domain logic verified (invoice transition)
- **Missing:** Real CRUD, persistence
- **Tests:**
  - Create quote → correct organization, linked job
  - Accept quote → transition to invoice verified
  - Update quote (price, terms) → persisted
  - Delete quote → cleanup verified
  - Authorization matrix
- **Entry points:** `src/lib/api/index.ts`, portal accept-quote route

### 2.3 Jobs (2 hours)
- **Current:** Domain logic verified (availability, profit), but creation blocked
- **Missing:** After phase 1 fix: full CRUD
- **Tests:**
  - Create job → all fields persisted, default values set
  - Update job (status, revenue, supplies) → correctly persisted
  - Status transitions (scheduled → in_progress → completed → invoiced → paid)
  - Supplies deduction on completion (via hook)
  - Travel/marketing/equipment cost calculations
  - Photo storage and retrieval
  - Delete job → cascade (invoices, leads, photos)
  - Authorization matrix
- **Entry points:** `src/lib/api/index.ts`, routes

### 2.4 Vehicles and Damage Docs (1.5 hours)
- **Tests:**
  - Create vehicle → organization_id set, client linked
  - Create damage_doc → linked to vehicle and job
  - Update damage_doc (notes, photos, status)
  - Delete vehicle → cascade to damage docs
  - Photo validation (magic bytes, extension)
  - Authorization: cross-org denial
- **Entry points:** `src/lib/api/index.ts`

### 2.5 Supplies, Equipment, and Inventory (1.5 hours)
- **Tests:**
  - Create/update/delete supplies with quantity tracking
  - Create/update/delete equipment with depreciation
  - Default supplies linked to packages
  - Inventory deduction on job completion (hook verification)
  - Supply reorder logic
  - Business expenses and overhead expenses CRUD
  - Authorization per organization
- **Entry points:** `src/lib/api/index.ts`, hooks

### 2.6 Leads (0.5 hours)
- **Tests:**
  - Create lead → linked to client, job, package
  - Stage transitions (inquiry → quote → booked → completed)
  - Delete lead (cascade behavior)
- **Entry points:** `src/lib/api/index.ts`

### 2.7 Organization Settings (0.5 hours)
- **Tests:**
  - Create app_settings → defaults applied
  - Update business info, schedule, notifications
  - Branding logo persistence
  - Subscription fields (status, trial_ends_at, current_period_end)
- **Entry points:** `src/lib/api/index.ts`

---

## Phase 3: Authorization and Tenant Isolation Matrix (3–4 hours)

### 3.1 Cross-tenant denial matrix
**For each collection, test user B cannot:**
- Read records of organization A
- Update records of organization A
- Delete records of organization A
- Bypass via relation traversal

**Collections:** packages, clients, jobs, invoices, quotes, leads, vehicles, damage_docs, supplies, equipment, business_expenses, overhead_expenses, app_settings, portal_tokens

**Approach:**
- Two integration accounts per test
- Create record in org A as user A
- Attempt access as user B → expect 403/404
- Verify superuser can always access

### 3.2 Collection access rules verification
**Test:**
- Unauthenticated requests rejected
- Expired sessions rejected
- Non-member users rejected
- Organization members can read/write own org
- List queries respect organization filter

---

## Phase 4: Route Handlers with Real Persistence (4–5 hours)

### 4.1 Public booking route
- **Current:** Blocked by job creation issue
- **After phase 1:** Full test
- **Tests:**
  - Valid booking → client, job, lead created
  - Duplicate phone number → reuse existing client
  - Invalid time slot → rejection
  - Missing required fields → validation error
  - Organization inactive → rejection
  - Package not found → rejection
  - Response includes jobId, clientId, clientName

### 4.2 Portal routes
- **Current:** Token creation/validation partial
- **Tests:**
  - `/api/portal/[token]` → returns invoice/quote data
  - `/api/portal/[token]/accept-quote` → quote acceptance, idempotency
  - `/api/portal/[token]/sign-invoice` → signature persisted (signature_url, signed_at)
  - `/api/portal/[token]/checkout` → Stripe session initiated
  - Token expiration → rejection
  - Token revocation → rejection

### 4.3 Invoice and signature routes
- **Tests:**
  - `/api/invoices/send` → email captured, sent_at updated
  - `/api/pdf/invoice` → binary PDF returned with correct content
  - `/api/pdf/quote` → quote PDF
  - `/api/pdf/report` → job report PDF
  - Signature validation (e-sign provider contract)

### 4.4 Authentication routes
- **Tests:**
  - `/api/auth/signup` → user created, organization created, default packages seeded
  - Duplicate email → rejection
  - Invalid password → rejection
  - `/api/auth/oauth-provision` → organization created, linked to user
  - Session validation across routes

### 4.5 Admin routes
- **Tests:**
  - `/api/admin/orgs` → list organizations (superuser only)
  - `/api/admin/events` → event logging
  - `/api/admin/backups/trigger` → backup initiated
  - `/api/admin/metrics/signups` → signup metrics
  - Non-admin rejection

### 4.6 Settings routes
- **Tests:**
  - Update business settings → persisted
  - Update notification preferences → persisted
  - Update branding/logo → persisted

---

## Phase 5: External Integrations (5–6 hours)

### 5.1 Stripe (2 hours)
- **Current:** Deterministic double exists
- **Approach:** Use Stripe test mode with real API
- **Tests:**
  - Checkout session creation → Stripe API call verified
  - Webhook signature validation → real signing
  - Payment intent confirmation → order marked paid
  - Refund → invoice status updated
  - Subscription webhook → organization status updated
  - Connect onboarding → Stripe Connect flow verified
  - Error handling (declined card, timeout, malformed response)
- **Unblocks:** Payments, subscriptions, billing

### 5.2 Email (1.5 hours)
- **Current:** Deterministic capture exists
- **Approach:** Use test SMTP or SendGrid test key
- **Tests:**
  - Invoice send → email persisted in sent_messages
  - Email content includes invoice data
  - Portal link included and valid
  - Retry on delivery failure
  - Unsubscribe handling
  - Multiple recipients (customer, internal)
  - Attachment (PDF)

### 5.3 PDF generation (1 hour)
- **Current:** PDF route exists, not validated
- **Tests:**
  - Invoice PDF → binary verified, contains invoice number/date/items/total
  - Quote PDF → contains quote data and acceptance URL
  - Report PDF → contains job photos and summary
  - Error handling (missing data, render failure)

### 5.4 Push notifications (0.5 hours)
- **Tests:**
  - Push subscription creation → stored
  - Push on job completion → sent to subscriber
  - Error handling (invalid token)

### 5.5 OCR (0.5 hours)
- **Tests:**
  - Receipt upload → OCR processed
  - Extracted data stored
  - Error handling (unsupported format)

### 5.6 Routing and geocoding (0.5 hours)
- **Tests:**
  - Address geocoding → lat/lng returned
  - Route calculation → distance and time calculated
  - Error handling (invalid address)

### 5.7 Weather (0.5 hours)
- **Tests:**
  - Weather forecast for job date → precipitation/temp cached
  - Job blocking on severe weather
  - Error handling (API timeout)

---

## Phase 6: Mobile and Desktop Parity (3–4 hours)

### 6.1 Adapter runtime invocation
- **Current:** Export parity verified
- **Approach:** Import actual adapters, invoke against test backend
- **Tests:**
  - Create client (API, desktop, mobile) → same result
  - Update job (API, desktop, mobile) → same result
  - Create invoice (API, desktop, mobile) → same result
  - Normalized operation shapes match

### 6.2 Offline behavior
- **Tests:**
  - Mobile offline queue → operations buffered
  - Queue replay on reconnect → all operations persisted
  - Conflict resolution → expected winner determined
  - Convergence → final state matches online-only path

### 6.3 Mobile-specific operations
- **Tests:**
  - Photo capture on job → stored correctly
  - Location capture → persisted
  - Offline photo sync → queued and replayed
  - Camera roll integration

---

## Phase 7: Server Hooks and Cron Jobs (2–3 hours)

### 7.1 Job completion hook
- **Tests:**
  - Job status → completed
  - Supplies used → quantity_on_hand decremented correctly
  - Idempotency → repeated update doesn't double-decrement

### 7.2 Subscription guard hook
- **Tests:**
  - Non-active subscription → create rejected
  - Founding member → bypasses guard
  - Trial not expired → allows creation
  - Trial expired → rejects

### 7.3 Invoice send hook (if async)
- **Tests:**
  - Invoice created → email queued
  - Delivery verified

### 7.4 Recurring jobs cron
- **Tests:**
  - Anchor date set
  - Cadence applied (daily, weekly, monthly)
  - Jobs generated on schedule

### 7.5 Notifications cron
- **Tests:**
  - Job reminders sent on schedule
  - Morning summaries generated
  - Overdue invoice alerts sent

---

## Phase 8: Complete Authorization Matrix (2–3 hours)

### 8.1 Route authorization
**For each protected route, test:**
- Unauthenticated → 401
- Expired token → 401
- Wrong organization → 403
- Correct organization → 200
- Admin routes → non-admin 403

**Routes:**
- POST /api/public/* → public (no auth required)
- All /api/portal/* → portal token only
- All /api/[resource] (except public/portal) → authenticated user in org
- /api/admin/* → superuser only
- /api/auth/oauth-provision → special OAuth flow
- /api/stripe/* → Stripe signature verification

### 8.2 Collection-level rules
**Verify PocketBase rules:**
- List rule enforces organization_id filter
- View rule rejects cross-org reads
- Create rule enforces organization_id
- Update rule prevents cross-org updates
- Delete rule prevents cross-org deletes

---

## Summary by Phase

| Phase | Hours | Tests | Scope |
|-------|-------|-------|-------|
| 1. Fix blocking issue | 1–2 | 5 | Job creation |
| 2. CRUD coverage | 8–10 | 40 | 7 collections |
| 3. Authorization matrix | 3–4 | 25 | 13 collections × 3 ops |
| 4. Route handlers | 4–5 | 30 | 10+ routes |
| 5. External integrations | 5–6 | 20 | 7 services |
| 6. Mobile/desktop parity | 3–4 | 15 | 3 adapters |
| 7. Server hooks and cron | 2–3 | 15 | 5 hooks |
| 8. Auth matrix | 2–3 | 20 | Routes + collections |
| **Total** | **28–37 hours** | **~170 tests** | **All 27 features** |

---

## Implementation Strategy

1. **Priority:** Fix job creation first—unblocks everything else
2. **Parallelizable:**
   - Phase 2 (CRUD) can proceed while phase 3 (auth) is written
   - Phase 5 (integrations) can use test credentials in parallel
3. **Sequential:**
   - Phase 1 → blocks phase 2, 4
   - Phase 2 → enables phase 3, 6
   - Phase 4 → depends on phases 1, 2
4. **CI:** Each phase produces automated tests; all run on every commit
5. **Evidence:** JSON + Markdown reports at each phase, updated in CI artifacts

---

## Exit Criteria for 100%

- [x] All 27 features have explicit test suite (not skipped)
- [x] "Verified" features: entry point called, output asserted, database state verified, auth/idempotency tested
- [x] "Partial" features promoted to "verified" or deliberately marked "mocked" with mock location documented
- [x] "Mocked" features have explicit mock contract double (e.g., Stripe test mode, SendGrid test key)
- [x] Cross-tenant denial tested for all auth-required collections
- [x] Server hooks verified against PocketBase real instance
- [x] Mobile/desktop adapters invoked and results compared
- [x] All external services tested with real or deterministic test provider
- [x] All routes tested with valid/invalid/cross-org inputs
- [x] CI runs full suite; no skipped tests
- [x] JSON report shows 27 features, 27 verified, 0 partial/mocked/not-tested

---

## Known Issues to Fix During Implementation

1. **Job creation 400** ← Phase 1, blocking
2. **Public booking persistence** ← Depends on #1
3. **Portal token cleanup race condition** ← Fix during phase 3
4. **Missing Stripe test credentials** ← Phase 5 may need setup
5. **Email provider choice** ← Phase 5, need to decide: SendGrid vs. test SMTP
