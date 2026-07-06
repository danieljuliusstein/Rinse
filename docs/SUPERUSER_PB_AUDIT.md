# Superuser PocketBase audit

Security Wave 2 inventory of `authenticateServerAdmin`, `authenticateServerPocketBase`, and server-side `authStore.save` usage.

**Legend**

| Classification | Meaning |
|----------------|---------|
| **user-scoped OK** | Uses `RequestAuthUser.pb` (JWT) or could; no superuser bypass needed |
| **must stay superuser** | Cross-tenant, public unauthenticated, or system path with no acting user |
| **fix needed** | Should migrate to user-scoped PB when a JWT is available (Wave 3+ backlog) |

---

## Allowed superuser / service-account exceptions

These paths are intentionally **not** user-scoped:

1. **Vercel / PocketBase cron** — all-org notifications, auto-messages, recurring jobs (`authenticateServerPocketBase` app user)
2. **Stripe webhooks** — invoice payments, Connect account sync (`authenticateServerAdmin` / app user via `invoices-server`)
3. **Platform admin** — `/api/admin/orgs`, `/api/admin/backups/trigger` (JWT path uses platform admin check; PB reads use superuser)
4. **Admin full backup (secret path)** — `POST /api/admin/backups/trigger` with `INTERNAL_API_SECRET` only (CLI/DR)
5. **Public portal (token in URL)** — validate/load portal data without operator JWT
6. **Public booking** — unauthenticated `/book` and `/api/public/*`
7. **Signup / OAuth provision** — create org + seed before user has tenant context

---

## Inventory table

### Operator-facing (Wave 2 migrated to user JWT)

| File | Function / route | Purpose | Classification |
|------|------------------|---------|----------------|
| `src/app/api/portal/create/route.ts` | `POST` | Create portal share token | **user-scoped OK** ✅ Wave 2 |
| `src/app/api/portal/send/route.ts` | `POST` | Email portal link | **user-scoped OK** ✅ Wave 2 |
| `src/app/api/backups/trigger/route.ts` | `POST` / `GET` | Org-scoped backup export | **user-scoped OK** ✅ Wave 2 |
| `src/lib/server/route-guard.ts` | `assertOrgAccess` | Verify client belongs to user org | **user-scoped OK** ✅ Wave 2 |
| `src/lib/server/portal-tokens.ts` | `createPortalToken` | Create token record | **user-scoped OK** when `pb` passed ✅ Wave 2 |

### PDF routes (Wave 3 — server re-fetch)

| File | Route | Purpose | Classification |
|------|-------|---------|----------------|
| `src/app/api/pdf/invoice/route.tsx` | `POST` | Render invoice PDF | **user-scoped OK** ✅ Wave 3 — IDs in body, data re-fetched via `pdf-data.ts` |
| `src/app/api/pdf/quote/route.tsx` | `POST` | Render quote PDF | **user-scoped OK** ✅ Wave 3 |
| `src/app/api/pdf/report/route.tsx` | `POST` | Render P&L report PDF | **user-scoped OK** ✅ Wave 3 — report computed server-side from org jobs |

### Cron & scheduled jobs

| File | Function | Purpose | Classification |
|------|----------|---------|----------------|
| `src/lib/server/notifications-cron.ts` | `runNotificationsCron`, `runNotificationsCronForOrganization` | Push + notification log for all orgs or one org | **must stay superuser** (all-org cron) / **user-scoped OK** (manual JWT org path uses same PB reads filtered by org) |
| `src/lib/server/auto-messages.ts` | `runAutoMessagesCron*`, `sendAutoMessage`, etc. | Resend templates on schedule | **must stay superuser** (all-org cron via app user) |
| `src/app/api/cron/notifications/route.ts` | `POST` | Cron entrypoint | **must stay superuser** (secret path) + JWT org-scoped path |
| `src/app/api/cron/recurring-jobs/route.ts` | `POST` | Expand recurring jobs | **must stay superuser** |
| `src/lib/server/recurring-jobs.ts` | `expandRecurringJobs` | Job expansion logic | **must stay superuser** |

### Stripe

| File | Function / route | Purpose | Classification |
|------|------------------|---------|----------------|
| `src/app/api/stripe/webhook/route.ts` | `POST` | Invoice checkout completed | **must stay superuser** (via `invoices-server` app user) |
| `src/app/api/stripe/operator-webhook/route.ts` | `POST` | Operator SaaS billing events | **must stay superuser** |
| `src/lib/server/stripe-connect.ts` | `syncConnectAccountToOrg`, etc. | Connect account metadata on org | **must stay superuser** |
| `src/lib/server/invoices-server.ts` | `getInvoiceServer`, `addPaymentServer` | Webhook invoice updates | **must stay superuser** (app user) |

### Platform admin

| File | Route | Purpose | Classification |
|------|-------|---------|----------------|
| `src/app/api/admin/orgs/route.ts` | `GET` | List all organizations | **must stay superuser** (after platform admin JWT gate) |
| `src/app/api/admin/orgs/[id]/route.ts` | `GET` / `PATCH` | Org detail + admin edits | **must stay superuser** |
| `src/app/api/admin/backups/trigger/route.ts` | `POST` / `GET` | Full cross-tenant backup | **must stay superuser** — Path A: platform admin JWT; Path B: `verifyApiSecret` only |

### Public portal (client token, no operator JWT)

| File | Function / route | Purpose | Classification |
|------|------------------|---------|----------------|
| `src/lib/server/portal-tokens.ts` | `validatePortalToken`, `revokePortalToken` | Lookup token by opaque string | **must stay superuser** |
| `src/lib/server/portal-scope.ts` | `portalScopeAllowsCheckout`, `portalScopeAllowsPhotos` | Scope gates for checkout / photos (Wave 4) | **user-scoped OK** (pure helpers) |
| `src/lib/server/portal-data.ts` | `loadPortalData`, `streamPortalPhoto`, etc. | Portal page data | **must stay superuser** — photos gated by scope ✅ Wave 4 |
| `src/app/api/portal/[token]/checkout` | `GET` / `POST` | Stripe Checkout | **must stay superuser** — scope ∈ invoice/full/job ✅ Wave 4 |
| `src/app/api/portal/[token]/*` | various | Public portal actions | **must stay superuser** / app user |

### Public booking

| File | Function | Purpose | Classification |
|------|----------|---------|----------------|
| `src/lib/server/booking-public.ts` | `loadPublicBusiness`, `createPublicBooking`, etc. | `/book` + `/api/public/*` | **must stay superuser** |

### Auth & signup

| File | Function / route | Purpose | Classification |
|------|------------------|---------|----------------|
| `src/lib/server/signup.ts` | `provisionNewOrganization`, etc. | Create org on signup | **must stay superuser** |
| `src/lib/server/organization.ts` | org helpers | Cross-tenant org creation | **must stay superuser** |
| `src/lib/server/request-auth.ts` | `authenticateRequestUser` | `pb.authStore.save(token)` — user JWT | **user-scoped OK** |
| `src/lib/server/request-auth-loose.ts` | loose auth helper | `pb.authStore.save(token)` | **user-scoped OK** |
| `src/lib/pb-oauth.ts` | OAuth callback | `pb.authStore.save` client-side session | **user-scoped OK** (browser) |

### Billing (operator JWT present — backlog)

| File | Route | Purpose | Classification |
|------|-------|---------|----------------|
| `src/app/api/billing/checkout/route.ts` | `POST` | Stripe Checkout for plan | **fix needed** — has user JWT but uses `authenticateServerAdmin` for org Stripe fields (Wave 3+) |
| `src/app/api/billing/portal/route.ts` | `POST` | Stripe billing portal | **fix needed** — same |

### Other server modules

| File | Function | Purpose | Classification |
|------|----------|---------|----------------|
| `src/lib/server/push.ts` | push subscription helpers | Cron + subscribe routes | **must stay superuser** (cron) / mixed |
| `src/lib/server/weather-cache-store.ts` | geocode/forecast cache R/W | Weather readiness API | **fix needed** — uses admin for shared cache collection; could scope by org |
| `src/lib/server/account-delete.ts` | `deleteAccountAndOrg` | Hard delete org data | **must stay superuser** (destructive cross-collection) |
| `src/app/api/account/delete/route.ts` | `POST` | Account deletion entry | **must stay superuser** (delegates to above) |
| `src/lib/server/invoice-signature.ts` | portal invoice signing | Update invoice from portal token | **must stay superuser** (public portal) |
| `src/app/api/receipts/parse/route.ts` | `POST` | OCR receipt (Pro) | **fix needed** — uses app user; could use `auth.pb` (Wave 3+) |
| `src/lib/server/pocketbase-admin.ts` | `authenticateServerPocketBase`, `authenticateServerAdmin` | Factory functions | **must stay superuser** (definitions) |
| `src/lib/server/backup.ts` | `createPocketBaseBackup` | Export collections | **user-scoped OK** when `existingPb` passed; full export uses app user |

---

## Admin full backup route

**`POST /api/admin/backups/trigger`** — full cross-tenant export (no `organizationId` filter).

| Path | Auth | Callable from browser? |
|------|------|------------------------|
| **A** | Platform admin JWT (`PLATFORM_ADMIN_EMAILS`) | Yes — admin UI only |
| **B** | `INTERNAL_API_SECRET` / `CRON_SECRET` (`x-api-secret` or `Authorization: Bearer`) | **No** — CLI/scripts only |

Operator backup remains **`POST /api/backups/trigger?organizationId=…`** — org-scoped JWT only (Wave 1).

Audit log: structured `console.info` via `logAdminBackupTrigger()` in `src/lib/server/backup.ts`.

**CLI example (Path B):**

```bash
curl -X POST "https://your-app.vercel.app/api/admin/backups/trigger" \
  -H "x-api-secret: $INTERNAL_API_SECRET" \
  -o detailing-full-backup.json
```

---

## Wave 2 changes summary

- `portal/create`, `portal/send`, operator `backups/trigger`, and `assertOrgAccess` now use **`RequestAuthUser.pb`** instead of `authenticateServerAdmin`.
- `createPortalToken` accepts optional user-scoped `pb`; public token validation still uses superuser.
- New **`/api/admin/backups/trigger`** for full-tenant export with dual auth documented above.

---

## Next waves

| Wave | Target |
|------|--------|
| **5** | CSP Report-Only + report endpoint |
| **Backlog** | Billing routes, weather cache |

_Last updated: Security Wave 4_
