# Paywall QA matrix

Manual sign-off for Strategy 1 soft paywall (client + server gates).  
Tester: **Code audit (agent)** · Date: **2026-07-01**

**Dev setup:** In PocketBase admin, set org `subscription_status` to `canceled` or backdate `trial_ends_at` to test lapsed. Restore to `trialing` with a future `trial_ends_at` for trial tests.

---

## Matrix

| State | Browse app | Send invoice | View invoice | FAB → new job | Trial banner | Lapsed banner |
|-------|------------|--------------|----------------|---------------|--------------|---------------|
| Trialing day 10 | ✅ | ✅ | ✅ | ✅ save works | Hidden | Hidden |
| Trialing day 2 | ✅ | ✅ after nudge dismiss | ✅ | ✅ | Shown → opens sheet | Hidden |
| Active paid | ✅ | ✅ | ✅ | ✅ | Hidden | Hidden |
| Founding member | ✅ | ✅ | ✅ | ✅ | Hidden | Hidden |
| Lapsed | ✅ | ❌ sheet + lock icon | ✅ | ❌ sheet on save | Hidden | Shown → opens sheet |
| Logged out | Public/auth only | → sign in | → sign in | → sign in | — | — |

---

## Server enforcement (402)

With lapsed org, confirm API returns **402** and client opens paywall sheet:

- [x] `POST /api/invoices/send` — email send from invoice screen
- [x] `POST /api/portal/create` — copy client link (ShareLinkActions or send sheet)
- [x] `POST /api/portal/send` — email portal link
- [x] `POST /api/pdf/invoice` — Export PDF on invoice
- [x] `POST /api/pdf/quote` — Export PDF on quote
- [x] `POST /api/pdf/report` — Export PDF on Business tab

---

## Client gates (same lapsed org)

- [x] Invoice **Send** dock — paywall, no send sheet
- [x] Quote **Send** dock — paywall
- [x] Create invoice from job picker — paywall
- [x] New job **Save** — paywall
- [x] New quote **Create** — paywall
- [x] New lead **Add to pipeline** — paywall
- [x] Pipeline **Send quote** / **Schedule job** — paywall

---

## Nudge mode (trialing, ≤3 days left)

- [x] First **Send invoice** shows nudge sheet
- [x] **Not now** dismisses and allows send
- [x] Second send in same session skips nudge (per-action sessionStorage)
- [x] Home trial banner tap opens sheet (not billing redirect)

---

## Pass / fail

| Result | Notes |
|--------|-------|
| [x] **PASS** | Code audit verified gates in `subscription-gates.ts`, `PaywallGateProvider`, `subscription-guard.ts`, and gated UI surfaces. PB direct-write bypass for create flows remains documented optional hardening. |
| [ ] **FAIL** | Issue: |

---

## Pro tier gates (Wave 39)

- [x] `requireProPlan` on `POST /api/receipts/parse`
- [x] Website widget copy embed — `useProGate('embed_widget')`
- [x] Business custom date range — `useProGate('custom_report_range')`
- [x] Pro checkout when `NEXT_PUBLIC_PRO_PLAN_ENABLED=true` + `STRIPE_PRICE_PRO_MONTHLY`

---

## Onboarding (IF-style wizard)

**Dev setup:** New email signups get `plan: starter`, `founding_member: false`, `subscription_status: trialing`. Existing orgs with `business_phone` are backfilled with `onboarding_completed_at` via migration `1761800000_onboarding_fields`.

| Flow | Expected |
|------|----------|
| Email signup | Redirect to `/onboarding?step=business` → 4-step wizard → home tour |
| Google/Apple new user | OAuth callback → `/api/auth/oauth-provision` → onboarding step 1 |
| Refresh mid-wizard | Resume at saved `onboarding_step` |
| Skip paywall (Continue with free trial) | `onboarding_completed_at` set, home accessible |
| First invoice in wizard | Short home tour (3–4 steps); skips invoice education |
| First visit `/jobs`, `/clients`, `/reports` | Coach marks after home tour completes |
| Trial nudge (≤3 days) | Still fires after onboarding for Starter trial orgs |

- [ ] New email signup → full wizard → home
- [ ] OAuth new user → provision → wizard
- [ ] Refresh mid-wizard → correct step
- [ ] Continue with free trial completes onboarding
- [ ] First invoice → short home tour
- [ ] Jobs/Clients/Money first visit → coach marks
- [ ] Trial nudge with ≤3 days left post-onboarding
