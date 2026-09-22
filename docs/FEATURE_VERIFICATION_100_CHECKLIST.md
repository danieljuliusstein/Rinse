# Feature Verification 100% Completion Checklist

## Overview
- **Current:** 8 verified, 16 partial, 2 mocked, 1 not-tested = 27 features inventoried
- **Target:** 27 verified, 0 partial, 0 mocked, 0 not-tested
- **Method:** 253 tests across 8 phases, ~36 hours work
- **Status:** Test infrastructure complete, ready for implementation

---

## PHASE 1: Fix Job Creation Blocking Issue (1-2h)

### Tests
- [ ] Organization fixture is founding_member=true
- [ ] Can create package in organization
- [ ] Can create client in organization
- [ ] **Minimal job creation with required fields** ← CURRENTLY FAILING
- [ ] Job creation with optional fields
- [ ] Subscription guard hook doesn't reject founding_member
- [ ] Tenant isolation rules allow own-org job creation

### Success Criteria
- [ ] Job creation test passes against real PocketBase
- [ ] Public booking test unskipped and passing
- [ ] Error diagnosis complete (hook issue vs. schema issue)
- [ ] Fix applied and validated

### Files to Update
- [ ] `src/feature-verification/phase-1-job-diagnostic.test.ts` (implement all tests)
- [ ] `src/feature-verification/pocketbase-integration.test.ts` (unskip booking test)
- [ ] `pocketbase/pb_hooks/00_subscription_guard.pb.js` (if hook is issue)

### Track Progress
```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE task_id = 'phase-1-job-creation';
UPDATE feature_100_scope SET status = 'done', completed_at = CURRENT_TIMESTAMP WHERE task_id = 'phase-1-job-creation';
```

---

## PHASE 2: Complete CRUD Coverage for Core Collections (8-10h)

### 2.1 Invoices (12 tests) ← START HERE
- [ ] Create invoice with valid data
- [ ] Update invoice status to sent
- [ ] Update invoice with payment
- [ ] Delete invoice cascades correctly
- [ ] Invoice validation: invalid job_id rejected
- [ ] Invoice number uniqueness within organization
- [ ] Invoice totals validation
- [ ] Invoice status transition validation
- [ ] Invoice cross-org denial
- [ ] Invoice line items CRUD
- [ ] Invoice tax and discount application
- [ ] Invoice signature persistence

**Success:** All 12 passing, invoices fully verified

### 2.2 Quotes (8 tests)
- [ ] Create quote linked to job
- [ ] Accept quote transitions to invoice
- [ ] Update quote price
- [ ] Delete quote
- [ ] Quote expiration validation
- [ ] Quote cross-org denial
- [ ] Quote number uniqueness
- [ ] Quote line items and totals

**Success:** All 8 passing, quotes fully verified

### 2.3 Jobs (15 tests)
- [ ] Create job with minimal fields
- [ ] Create job with full optional fields
- [ ] Update job status through lifecycle (scheduled → in_progress → completed)
- [ ] Update job revenue and tip
- [ ] Delete job cascades to invoices/quotes
- [ ] Job validation: invalid package_id rejected
- [ ] Job validation: invalid vehicle_type rejected
- [ ] Job cross-org denial
- [ ] Job can link to damage_docs
- [ ] Job can link to photos
- [ ] Job date validation
- [ ] Job financial calculations correct
- [ ] Travel time/distance calculated
- [ ] Equipment depreciation calculated
- [ ] Full job lifecycle persisted

**Success:** All 15 passing, jobs fully verified

### 2.4 Vehicles & Damage Docs (8 tests)
- [ ] Create vehicle linked to client
- [ ] Create damage_doc linked to vehicle and job
- [ ] Update damage_doc notes
- [ ] Add photo to damage_doc (file upload)
- [ ] Delete vehicle cascades to damage_docs
- [ ] Damage doc status transitions
- [ ] Photo validation (magic bytes)
- [ ] Vehicle cross-org denial

**Success:** All 8 passing, vehicles verified

### 2.5 Supplies & Equipment (12 tests)
- [ ] Create supply with quantity tracking
- [ ] Create equipment with depreciation fields
- [ ] Update supply quantity_on_hand
- [ ] Default supplies linked to package
- [ ] Inventory deduction on job completion (hook)
- [ ] Supply reorder logic
- [ ] Create business expense
- [ ] Create overhead expense
- [ ] Expense recurrence handling
- [ ] Equipment cross-org denial
- [ ] Supply cross-org denial
- [ ] Cascade delete supply

**Success:** All 12 passing, supplies verified

### 2.6 Leads (5 tests)
- [ ] Create lead linked to client, job, package
- [ ] Lead stage transitions (inquiry → quote → booked → completed)
- [ ] Delete lead cascades
- [ ] Lead cross-org denial
- [ ] Lead listing filtered by organization

**Success:** All 5 passing, leads verified

### 2.7 Organization Settings (5 tests)
- [ ] Create app_settings with defaults
- [ ] Update business info (name, address, phone)
- [ ] Update subscription fields (status, trial_ends_at, current_period_end)
- [ ] Update branding (logo, colors, name)
- [ ] Settings cross-org denial

**Success:** All 5 passing, settings verified

### Track Progress
```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE phase = '2';
-- After each collection:
UPDATE feature_100_scope SET status = 'done' WHERE task_id = 'phase-2-invoices';
UPDATE feature_100_scope SET status = 'done' WHERE task_id = 'phase-2-quotes';
-- etc.
```

---

## PHASE 3: Cross-Tenant Authorization Matrix (3-4h)

### For each of 13 collections, test:
- [ ] User B cannot read User A record
- [ ] User B cannot update User A record
- [ ] User B cannot delete User A record
- [ ] User A lists only own records
- [ ] Superuser can always access
- [ ] Relation traversal blocked
- [ ] List rules filter by organization_id

**Collections to test:**
- [x] Packages (drafted)
- [x] Clients (drafted)
- [x] Jobs (drafted)
- [x] Invoices (drafted)
- [ ] Quotes
- [ ] Leads
- [ ] Vehicles
- [ ] Damage_docs
- [ ] Supplies
- [ ] Equipment
- [ ] Business_expenses
- [ ] Overhead_expenses
- [ ] Portal_tokens

**Success:** All 13 collections have full cross-tenant denial verified

### Track Progress
```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE phase = '3';
UPDATE feature_100_scope SET status = 'done' WHERE task_id = 'phase-3-cross-tenant';
```

---

## PHASE 4: Route Handlers with Real Persistence (4-5h)

### 4.1 Public Booking Route
- [ ] Valid booking creates job, client, lead
- [ ] Duplicate phone number reuses existing client
- [ ] Invalid time slot rejected
- [ ] Missing required fields validation
- [ ] Organization inactive rejected
- [ ] Package not found rejected
- [ ] Response includes jobId, clientId, clientName
- [ ] Booking persists all data to PocketBase

**Success:** Public booking fully end-to-end verified

### 4.2 Portal Routes
- [ ] GET /api/portal/[token] returns invoice/quote data
- [ ] POST /api/portal/[token]/accept-quote transitions to invoice
- [ ] POST /api/portal/[token]/sign-invoice persists signature (signature_url, signed_at)
- [ ] POST /api/portal/[token]/checkout initiates Stripe session
- [ ] Token expiration rejected
- [ ] Token revocation rejected
- [ ] Invalid token returns 404

**Success:** Portal routes fully verified

### 4.3 Invoice Routes
- [ ] POST /api/invoices/send captures email, updates sent_at
- [ ] GET /api/pdf/invoice returns binary PDF
- [ ] GET /api/pdf/quote returns quote PDF
- [ ] GET /api/pdf/report returns job report PDF
- [ ] PDF routes reject missing invoice

**Success:** Invoice/PDF routes verified

### 4.4 Authentication Routes
- [ ] POST /api/auth/signup creates user, organization, default packages
- [ ] Duplicate email rejected
- [ ] Invalid password rejected
- [ ] POST /api/auth/oauth-provision creates organization linked to user
- [ ] Session validation works across routes

**Success:** Auth routes verified

### 4.5 Admin Routes
- [ ] GET /api/admin/orgs returns organizations (superuser only)
- [ ] GET /api/admin/events returns events (superuser only)
- [ ] POST /api/admin/backups/trigger initiates backup (superuser only)
- [ ] GET /api/admin/metrics/signups returns metrics (superuser only)
- [ ] Non-admin rejection (403)

**Success:** Admin routes verified

### 4.6 Settings Routes
- [ ] PATCH /api/settings/business updates and persists
- [ ] PATCH /api/settings/notifications updates and persists
- [ ] PATCH /api/settings/branding updates and persists

**Success:** Settings routes verified

### Track Progress
```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE phase = '4';
-- After each route group:
UPDATE feature_100_scope SET status = 'done' WHERE task_id = 'phase-4-public-booking';
-- etc.
```

---

## PHASE 5: External Integrations (5-6h)

### 5.1 Stripe Integration
- [ ] Checkout session created via Stripe API
- [ ] Webhook signature validated
- [ ] Payment intent confirmed → order marked paid
- [ ] Refund processed → invoice status updated
- [ ] Subscription webhook → organization status updated
- [ ] Connect onboarding flow verified
- [ ] Error handling (declined card, timeout, malformed)

**Success:** Stripe fully tested with real API (test mode)

### 5.2 Email Integration
- [ ] Invoice sent → email captured and persisted
- [ ] Email content includes invoice data
- [ ] Portal link included and valid
- [ ] Retry on delivery failure
- [ ] Unsubscribe handling
- [ ] Multiple recipients (customer, internal)
- [ ] Attachment (PDF)

**Success:** Email fully tested with provider

### 5.3 PDF Generation
- [ ] Invoice PDF binary verified
- [ ] PDF contains invoice number/date/items/total
- [ ] Quote PDF contains quote data and acceptance URL
- [ ] Report PDF contains job photos and summary
- [ ] Error handling (missing data, render failure)

**Success:** PDF generation verified with binary inspection

### 5.4 Push Notifications
- [ ] Push subscription creation stored
- [ ] Push on job completion sent to subscriber
- [ ] Error handling (invalid token)

**Success:** Push notifications verified

### 5.5 OCR
- [ ] Receipt upload → OCR processed
- [ ] Extracted data stored
- [ ] Error handling (unsupported format)

**Success:** OCR verified

### 5.6 Routing & Geocoding
- [ ] Address geocoding → lat/lng returned
- [ ] Route calculation → distance and time calculated
- [ ] Error handling (invalid address)

**Success:** Geocoding verified

### 5.7 Weather
- [ ] Weather forecast for job date cached
- [ ] Job blocking on severe weather verified
- [ ] Error handling (API timeout)

**Success:** Weather verified

### Track Progress
```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE phase = '5';
-- After each integration:
UPDATE feature_100_scope SET status = 'done' WHERE task_id = 'phase-5-stripe';
-- etc.
```

---

## PHASE 6: Mobile/Desktop Adapter Parity (3-4h)

### 6.1 Runtime Invocation & Comparison
- [ ] Import desktop adapter (from src/lib/desktop-adapter/)
- [ ] Import mobile adapter (from src/lib/mobile-adapter/)
- [ ] Create client operation via desktop
- [ ] Create client operation via mobile
- [ ] Normalized shapes match
- [ ] Update job operation via both
- [ ] Create invoice via both
- [ ] Results identical

**Success:** Adapter parity proven

### 6.2 Offline Behavior
- [ ] Mobile offline queue created
- [ ] Operations buffered locally
- [ ] Queue replayed on reconnect
- [ ] All operations persisted
- [ ] Conflict resolution converges

**Success:** Offline behavior verified

### 6.3 Mobile-Specific Operations
- [ ] Photo capture on job (camera integration)
- [ ] Location capture (GPS integration)
- [ ] Offline photo sync queued
- [ ] Photo sync replayed on reconnect

**Success:** Mobile parity verified

### Track Progress
```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE phase = '6';
UPDATE feature_100_scope SET status = 'done' WHERE phase = '6';
```

---

## PHASE 7: Server Hooks & Cron Jobs (2-3h)

### 7.1 Job Completion Hook
- [ ] Job status → completed
- [ ] Supplies used → quantity_on_hand decremented
- [ ] Idempotency → repeated update doesn't double-decrement

**Success:** Job hook verified

### 7.2 Subscription Guard Hook
- [ ] Non-active subscription → create rejected
- [ ] Founding member → bypasses guard
- [ ] Trial not expired → allows creation
- [ ] Trial expired → rejects

**Success:** Subscription guard verified

### 7.3 Invoice Send Hook (if async)
- [ ] Invoice created → email queued
- [ ] Delivery verified

**Success:** Invoice send hook verified

### 7.4 Recurring Jobs Cron
- [ ] Anchor date set
- [ ] Cadence applied (daily, weekly, monthly)
- [ ] Jobs generated on schedule

**Success:** Recurring jobs verified

### 7.5 Notifications Cron
- [ ] Job reminders sent on schedule
- [ ] Morning summaries generated
- [ ] Overdue invoice alerts sent

**Success:** Notification cron verified

### Track Progress
```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE phase = '7';
UPDATE feature_100_scope SET status = 'done' WHERE phase = '7';
```

---

## PHASE 8: Complete Authorization Matrix (2-3h)

### Route Authorization Tests
- [ ] All routes tested with 5 permission levels:
  - [x] Unauthenticated → 401
  - [x] Expired token → 401
  - [x] Non-member → 403
  - [x] Wrong organization → 403 or 404
  - [x] Correct member → 200 or expected code
  - [x] Superuser → 200 or expected code

### Collection Access Rules
- [ ] List rule enforces organization_id filter
- [ ] View rule rejects cross-org reads
- [ ] Create rule enforces organization_id
- [ ] Update rule prevents cross-org updates
- [ ] Delete rule prevents cross-org deletes

### Success Criteria
- [ ] All 10+ routes tested
- [ ] All 13 collections tested
- [ ] All permission combinations verified
- [ ] No leaks or bypasses found

### Track Progress
```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE phase = '8';
UPDATE feature_100_scope SET status = 'done' WHERE phase = '8';
```

---

## FINAL VALIDATION (1-2h)

### Sanity Checks
- [ ] All test files in src/feature-verification/phase-*.test.ts
- [ ] All tests passing: `npm run verify:features:integration:local`
- [ ] JSON report shows 27 verified, 0 partial/mocked/not-tested
- [ ] Markdown report generated
- [ ] No skipped tests (except intentional mocks for external APIs)
- [ ] CI passes with full feature verification

### Report Generation
- [ ] `npm run verify:features:report` produces:
  - [x] test-results/feature-verification.json
  - [x] test-results/feature-verification.md
  - [x] test-results/mock-scan.txt (detects remaining mocks)

### Artifacts
- [ ] Session checkpoint created: "Feature verification 100% complete"
- [ ] PR summary with verification scope complete
- [ ] GitHub summary comment with test results

---

## Success Definition: 100% Complete

```json
{
  "summary": {
    "total_features": 27,
    "verified": 27,
    "partial": 0,
    "mocked": 0,
    "not_tested": 0,
    "total_tests": 253,
    "tests_passing": 253,
    "tests_skipped": 0
  },
  "phases": {
    "phase_1_job_creation": "✅ passing",
    "phase_2_crud": "✅ passing",
    "phase_3_authorization": "✅ passing",
    "phase_4_routes": "✅ passing",
    "phase_5_integrations": "✅ passing",
    "phase_6_parity": "✅ passing",
    "phase_7_hooks": "✅ passing",
    "phase_8_auth_matrix": "✅ passing"
  }
}
```

When all checkboxes are checked:
- ✅ Feature verification suite is 100% complete
- ✅ All Rinse capabilities are production-verified
- ✅ Ready for audit, certification, or release

---

## Quick Reference: Command Shortcuts

```bash
# Run deterministic tests (no PocketBase)
npm run verify:features

# Run full suite with local PocketBase
npm run verify:features:integration:local

# Run single phase
npm run verify:features:integration:local -- --grep "Phase 1"

# Generate reports
npm run verify:features:report

# Check progress
sqlite3 session.db "SELECT phase, COUNT(*) as tasks, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done FROM feature_100_scope GROUP BY phase;"
```

---

## Final Notes

- **This checklist is the source of truth for 100% completion**
- **Update it as each test is implemented**
- **Use SQL tracker for real-time progress visualization**
- **Commit completed phases as separate PRs for reviewability**
- **Each phase adds value independently; can release incrementally**
