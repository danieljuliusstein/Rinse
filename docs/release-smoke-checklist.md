# Release smoke checklist (~15 minutes)

Run on **production build** or staging before tagging a release.  
Tester: _______________ · Date: _______________ · Build/version: _______________

Use Chrome desktop + one mobile pass (iOS Safari preferred).

---

## 1. Auth & shell (2 min)

- [ ] Open `/auth` — sign-in form renders, labels float on focus
- [ ] Submit empty form — validation prevents submit
- [ ] Wrong password — error appears and is announced (screen reader or visual)
- [ ] Sign in — lands on Home, bottom nav visible
- [ ] Press **Tab** once — skip link appears; activate → focus moves to main content

---

## 2. Home & navigation (2 min)

- [ ] Home KPIs load (or logged-out empty state)
- [ ] Tap **Pipeline** header icon → pipeline loads
- [ ] Tap **Messages** header icon → messages tabs work
- [ ] Bottom nav: Home → Jobs → Clients → Business → back to Home

---

## 3. Quick actions & job (3 min)

- [ ] Tap FAB (+) — quick menu opens with 6 actions
- [ ] Press **Escape** — menu closes
- [ ] FAB → **New job** (or `/jobs/new`) — create/save a test job
- [ ] Open job detail — photos row, directions link if address present
- [ ] Job timer start/stop (upcoming jobs only)

---

## 4. Invoices & money (3 min)

- [ ] `/invoices` — list loads, search/filter chips work
- [ ] Open an invoice — **Send** dock visible, More sheet opens
- [ ] `/reports` or Business tab — P&L hero renders, export buttons present

---

## 5. Clients & pipeline (2 min)

- [ ] `/clients` — list loads; import/export icons present
- [ ] Open a client — vehicles tab, map/directions if address
- [ ] `/pipeline` — stage stepper; **New lead** dock or empty CTA

---

## 6. Client booking (3 min)

- [ ] Open `/book/{your-slug}` (or demo slug)
- [ ] Step 1 — select package → Continue
- [ ] Step 2 — pick date + time slot (verify slots load)
- [ ] Step 3 — submit or review confirmation copy (do not need real booking in prod)

---

## 7. Settings & data (optional +2 min)

- [ ] Settings → Access — export JSON button works
- [ ] Settings → Billing — page loads without error

---

## 8. Paywall smoke (lapsed org, +3 min)

See **`docs/paywall-qa-matrix.md`** for full matrix. Quick pass:

- [ ] Lapsed org: app browses (no billing redirect wall)
- [ ] Lapsed banner visible; invoice **Send** shows lock + paywall sheet
- [ ] Settings → Billing reachable from banner or sheet

---

## Pass / fail

| Result | Notes |
|--------|-------|
| ☐ **PASS** — ship | |
| ☐ **FAIL** — block release | Issue: |

If fail, log issue in tracker and link PR fix before deploy.
