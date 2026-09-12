---
title: "feat: Resend campaign email send + open tracking"
date: 2026-07-26
type: feat
topic: resend-campaign-email
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
deepened: 2026-07-26
---

# feat: Resend campaign email send + open tracking

## Goal Capsule

**Objective.** Replace the mock campaign send with real Resend delivery and wire unique open events so Campaigns list metrics (`stats_sent`, `stats_opened`, open-rate bars) reflect actual email activity.

**Authority.** This plan; Product Contract below; existing Campaigns L2 spine in `docs/superpowers/specs/2026-07-25-crm-platform-waves-design.md` (send + Activities). Session-settled: Resend over SendGrid; server-side secrets; unique opens; keep orgStore mock when mail service unavailable.

**Stop when.** Send via Resend works for contacts with emails; Activities still log; opens increment `stats_opened` once per recipient; localStorage/offline path stays honest mock; no SendGrid, SMS/ads delivery, or general credentials platform.

**Execution profile.** Standard — new server surface + PB schema + client orchestration. Prefer smoke/runtime verification (Resend test addresses + webhook) over inventing a full test harness; extract pure helpers where idempotency matters.

---

## Product Contract

### Summary

Plan targets Resend-backed campaign send and unique-open tracking so the Campaigns metric strip and per-row open rates become truthful, while offline/orgStore mode keeps today’s activity-only mock.

### Problem Frame

Campaign “Send” today only bumps `stats_sent`, marks the campaign completed, and writes Activities — it never resolves contact emails or calls a provider. `stats_opened` is never written, so open-rate UI stays at zero. The desk app is a Vite SPA talking to PocketBase (`VITE_PB_URL`); there is no server route, hook, or secret store in-repo. Real delivery and open webhooks require a server-side Resend integration without putting `RESEND_API_KEY` in `VITE_*`.

### Requirements

- R1. Operator can send a campaign email through Resend to audience contacts that have email addresses.
- R2. Successful sends increment `stats_sent` by the number of emails actually accepted by Resend (not by raw audience size when some contacts lack email).
- R3. Each successful recipient still gets an Activity (`type: email`) and existing `activity_logged` automation trigger behavior.
- R4. Resend `email.opened` events increment `stats_opened` at most once per recipient per campaign (unique opens).
- R5. Campaigns list metric strip and open-rate bars read the updated fields without UI redesign.
- R6. API keys and webhook secrets live only server-side (never `VITE_` / client bundle).
- R7. When the mail service is unavailable or unset, send keeps the current local mock (Activities + `stats_sent`) and UI messaging stays honest that opens will not track.
- R8. Contacts without email are skipped with a clear partial-result summary (not a hard fail of the whole send if at least one recipient succeeded).

### Actors

- A1. Desk operator — composes and sends campaigns in Campaigns editor.
- A2. Campaign recipient — receives email; opening it (when tracking allowed) drives open stats.
- A3. Mail service — server process holding Resend credentials and webhook endpoint.
- A4. PocketBase — stores campaigns, campaign_sends, activities, contacts.

### Key Flows

- F1. Send: Editor Save+Send → client validates → mail service resolves audience emails → Resend send per recipient with tags → persist send rows + bump `stats_sent` → create Activities → toast summary.
- F2. Open: Recipient opens email → Resend webhook `email.opened` → verify signature → match send row by `email_id` / tags → if first open, set opened + increment campaign `stats_opened`.
- F3. Offline mock: No mail base URL / PB-only localStorage org → existing `sendCampaignEmail` stub path; `stats_opened` unchanged.

### Acceptance Examples

- AE1. Audience of 3 with 2 emails: Resend called twice; `stats_sent` += 2; toast notes 1 skipped; 2 Activities created.
- AE2. Same recipient opens twice: `stats_opened` increments once.
- AE3. Mail URL unset: send still logs Activities and bumps `stats_sent`; toast/copy does not claim Resend delivery or open tracking.
- AE4. Invalid webhook signature: no stats change; non-2xx or explicit reject per service convention without mutating PB.

### Success Criteria

- SC1. Real send path uses Resend; zeros for opened become non-zero after a tracked open in a test send.
- SC2. Unique-open semantics hold under duplicate webhooks.
- SC3. Secrets never appear in client env typings or built assets.

### Scope Boundaries

**In scope:** Resend send for campaigns, unique open tracking into `stats_opened`, `campaign_sends` (or equivalent) correlation rows, client orchestration + honest fallback, ops env/webhook docs.

**Out of scope:** SendGrid; SMS/ads delivery; HTML email designer; bounce/complaint dashboards; automations “app connect” credentials platform; redesign of Campaigns list/editor chrome beyond send messaging.

**Deferred to follow-up work:** Deliverability analytics (clicks, bounces); multi-tenant per-org Resend keys; PocketBase JSVM hooks as alternate host if Fly PB deploy becomes first-class in this repo.

### Dependencies

- Resend account with verified sending domain (or Resend onboarding domain for smoke).
- Deployable HTTPS endpoint for webhooks (companion mail service).
- PocketBase Admin access to add `campaign_sends` collection (and optional indexes).
- Existing `campaigns.stats_sent` / `stats_opened` fields (already in schema/docs).

### Outstanding Questions

- Q1 (deferred). Deploy host for the mail service (Fly app sibling vs other) — choose at implementation time; does not change API shape.
- Q2 (deferred). Whether opens should later write Activities — out of v1 (KTD9).

### Sources

- Session: Resend chosen over SendGrid; server-side keys; unique opens; keep mock offline.
- `src/lib/platform-api.ts` — `sendCampaignEmail` stub.
- `docs/superpowers/specs/pocketbase-platform-collections.md` — campaigns fields.
- Resend docs: send with tags; `email.opened` webhook; Svix verify via `resend.webhooks.verify`.
- PocketBase: external at `VITE_PB_URL` (see `.env.example`); no in-repo hooks today.

---

## Planning Contract

### Key Technical Decisions

- KTD1. Provider is Resend `(session-settled: user-directed — chosen over SendGrid: user asked to plan Resend after both were discussed)`.
- KTD2. Secrets and Resend calls run in a thin companion HTTP mail service (Node + Resend SDK), not in the Vite client and not as Vite middleware `(session-settled: user-approved — affirmed server-side secret path over client keys)`.
- KTD3. Open metric is unique recipients per campaign `(session-settled: user-approved — affirmed unique opens over total open events for open-rate honesty)`.
- KTD4. Offline / missing mail service keeps today’s activity-only mock `(session-settled: user-approved — affirmed mock fallback over requiring Resend for all sends)`.
- KTD5. Correlate sends with a new org-scoped `campaign_sends` collection (`campaign_id`, `contact_id`, `resend_email_id`, `to_email`, `opened_at` optional, `organization_id`) rather than only tagging — supports idempotent unique opens and audit. Tags on Resend send still carry `campaign_id` / `contact_id` as defense in depth.
- KTD6. Prefer companion service over PocketBase `pb_hooks` for v1 because this repo does not contain the Fly PB deploy (`detailing-pb.fly.dev`) and Resend’s official webhook verify path is Node/Svix-friendly; hooks remain a deferred alternate host.
- KTD7. Client detects live mail via a non-secret config such as `VITE_CAMPAIGN_MAIL_URL` (base URL only); never expose API keys. Auth to the mail service: prefer PocketBase auth bearer validated by the mail service (auth-refresh or record fetch) so only signed-in org members can trigger sends; shared static service token is acceptable only for local smoke, not production default.
- KTD8. Unique-open increment must be race-safe: update `campaign_sends` only when `opened_at` is empty (conditional update / compare-and-set), and increment `stats_opened` only when that update modified a row — so duplicate webhooks under concurrency cannot double-count.
- KTD9. System-wide impact is limited to Campaigns send path + new mail service + one PB collection; Money/Contacts/Calendar unchanged. Automations still fire only via existing Activity creation on send — opens do not emit Activities in v1.

### Assumptions

- Operator has or will create a Resend account and can set `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, and `RESEND_FROM`.
- PocketBase Admin can create collections; campaigns collection already has stats fields.
- HTML body can be a minimal wrap of the campaign `body` text for v1 (no rich composer).
- Mail service can reach the same PocketBase URL the SPA uses (Fly network / public HTTPS).

### High-Level Technical Design

```mermaid
sequenceDiagram
  participant Op as Operator
  participant UI as CampaignEditor
  participant API as platform-api
  participant Mail as Mail service
  participant R as Resend
  participant PB as PocketBase

  Op->>UI: Send
  UI->>API: sendCampaignEmail(id)
  alt mail URL configured
    API->>Mail: POST /campaigns/:id/send
    Mail->>PB: load campaign + contacts
    loop each email recipient
      Mail->>R: emails.send + tags
      R-->>Mail: email_id
      Mail->>PB: create campaign_sends
      Mail->>PB: create activity
    end
    Mail->>PB: stats_sent += accepted
    Mail-->>API: summary
  else offline mock
    API->>PB: stats_sent += audience size
    API->>PB: activities only
  end

  Note over R,Mail: Later
  R->>Mail: POST /webhooks/resend email.opened
  Mail->>Mail: verify Svix signature
  Mail->>PB: find campaign_sends by email_id
  alt first open
    Mail->>PB: opened_at set; stats_opened += 1
  end
```

### Sequencing

1. Schema + docs (`campaign_sends`) so webhook and send have a write target.
2. Mail service send endpoint + Resend.
3. Webhook unique-open handler.
4. Client orchestration + editor messaging + fallback.
5. Ops runbook (env, domain, Resend webhook subscription).

### Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| API key in client | Only `VITE_CAMPAIGN_MAIL_URL`; keys server-only |
| Duplicate open webhooks | `opened_at` gate before increment |
| Contacts without email | Skip + partial toast (R8 / AE1) |
| PB Fly unreachable from mail service | Document network/URL; fail send with clear alert |
| Open tracking blocked by clients | Document limitation; metric is best-effort |
| No test runner in repo | Smoke with Resend test addresses; pure helper tests optional if vitest added |
| Concurrent duplicate open webhooks | Conditional `opened_at` update before increment (KTD8) |
| Unauthenticated public send URL | Require PB bearer (or documented local-only token) (KTD7) |
| Org isolation bug (send wrong org campaign) | Mail service scopes all PB queries by campaign `organization_id` matching the caller’s org |

### Alternatives Considered

| Approach | Why not for v1 |
|----------|----------------|
| SendGrid | User chose Resend |
| PocketBase JSVM hooks only | Repo doesn’t own PB deploy; weaker Resend SDK/verify ergonomics |
| Client-side Resend | Exposes secrets; rejects R6 |
| Resend Broadcasts API | Campaigns already modeled as Desk entities with Contact audience; transactional send-per-recipient fits current Activity spine |

---

## Implementation Units

### U1. PocketBase `campaign_sends` schema + docs

**Goal.** Persist per-recipient Resend message ids for open correlation and unique-open gating.

**Requirements.** R4, R5; KTD5

**Dependencies.** None

**Files.**
- `docs/superpowers/specs/pocketbase-platform-collections.md` (modify)
- `src/lib/types.ts` (modify — `DeskCampaignSend` type)
- Optional: Admin checklist note in `docs/superpowers/plans/` or short ops section consumed by U5

**Approach.** Document and type an org-scoped collection: `organization_id`, `campaign_id`, `contact_id`, `resend_email_id` (unique), `to_email`, `opened_at` (optional datetime), `created`. Index/uniqueness on `resend_email_id`. Do not change list UI in this unit.

**Patterns to follow.** Existing campaigns/activities field docs in `pocketbase-platform-collections.md`; `mapCampaign` style mappers later in U4.

**Test scenarios.**
- Happy: type fields cover correlation + `opened_at` null vs set.
- Edge: document uniqueness expectation on `resend_email_id`.

**Verification.** Spec lists collection; TypeScript type compiles; Admin can create collection from the doc.

---

### U2. Campaign mail service — send via Resend

**Goal.** Server endpoint that sends campaign emails through Resend and records sends + Activities + `stats_sent`.

**Requirements.** R1–R3, R6, R8; KTD1, KTD2, KTD5, KTD7

**Dependencies.** U1

**Files.**
- `server/campaign-mail/` (create — package root: entry, routes, env)
- `server/campaign-mail/package.json` (create)
- `server/campaign-mail/README.md` (create — local run; secrets named, not valued)

**Approach.** Small Node service (Hono or Express) with `POST /campaigns/:id/send`. Load campaign and resolve contact emails from PocketBase (service role or forwarded user token). Skip missing emails. For each recipient: `resend.emails.send` with `from` = `RESEND_FROM`, subject/body from campaign, tags `campaign_id` + `contact_id` (+ org if useful). Persist `campaign_sends` with returned `email_id`. Create Activity matching today’s subject shape (`Campaign: {name}`). Increment `stats_sent` by accepted count; set status `completed` (preserve current behavior) or keep `active` if partial — prefer `completed` when any send succeeded and document if partial leaves `active` (pick one and stick to it: **completed when ≥1 accepted**). Return JSON summary `{ sent, skipped, errors[] }` for the client toast.

**Execution note.** Smoke-first with Resend’s test/onboarding from-address before wiring the SPA.

**Patterns to follow.** Activity payload shape from current `sendCampaignEmail`; org scoping via `organization_id`.

**Test scenarios.**
- Happy: two emailed contacts → two Resend calls (mocked HTTP) → two `campaign_sends` → `stats_sent` += 2.
- Edge: one missing email → skipped count 1; still succeeds.
- Error: Resend 4xx/5xx for one recipient → that recipient failed; others still attempted; summary lists failure.
- Error: missing `RESEND_API_KEY` → service fails closed with clear error (no partial silent mock).

**Verification.** Local curl against service with test campaign produces Resend dashboard messages and PB rows.

---

### U3. Resend webhook — unique opens

**Goal.** Verify `email.opened` and increment `stats_opened` once per `campaign_sends` row.

**Requirements.** R4, R5, R6; AE2, AE4; KTD3, KTD5

**Dependencies.** U1, U2

**Files.**
- `server/campaign-mail/` (modify — webhook route + verify)
- Pure helper module under `server/campaign-mail/` for “should increment?” if extracted

**Approach.** `POST /webhooks/resend`: read raw body; `resend.webhooks.verify` with `RESEND_WEBHOOK_SECRET` and Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`). On `email.opened`, find `campaign_sends` by `data.email_id`. If missing, no-op 200 (ignore unrelated emails). Apply KTD8: conditional set of `opened_at` only when empty; increment parent `stats_opened` only if that write succeeded. Ignore other event types with 200. Do not create Activities on open (KTD9).

**Patterns to follow.** Resend docs for verify-on-raw-body; never JSON-parse then re-stringify before verify.

**Test scenarios.**
- Happy: first open → `opened_at` set; `stats_opened` += 1.
- Edge: second open same `email_id` → no further increment.
- Error: bad signature → reject; no PB writes.
- Integration: open event for unknown `email_id` → 200, no campaign mutation.

**Verification.** Resend webhook dashboard delivery succeeds; duplicate events do not double-count.

---

### U4. Client orchestration + editor messaging + mock fallback

**Goal.** Route live sends through the mail service when configured; preserve mock otherwise; surface partial results.

**Requirements.** R2, R5, R7, R8; F3; AE1, AE3; KTD4, KTD7

**Dependencies.** U2, U3

**Files.**
- `src/lib/platform-api.ts` (modify — `sendCampaignEmail`)
- `src/pages/campaigns/CampaignEditor.tsx` (modify — toast/alert copy; optional skip hint)
- `src/vite-env.d.ts` (modify — `VITE_CAMPAIGN_MAIL_URL?`)
- `.env.example` (modify — document mail URL only)
- `src/lib/types.ts` (modify if send summary type shared)

**Approach.** If `VITE_CAMPAIGN_MAIL_URL` is set, `sendCampaignEmail` POSTs to the mail service with auth header derived from current PB session; apply returned campaign snapshot or refresh. If unset, keep existing stub (audience-length `stats_sent`, Activities, no opens). Editor toast: live path uses summary (`Sent N · skipped M`); mock path wording must not claim Resend/open tracking. Do not redesign list UI — it already binds stats fields.

**Patterns to follow.** Existing `toast` / `alert` / `busy` in CampaignEditor; `tryPb*` fallback mindset for honesty when offline.

**Test scenarios.**
- Happy: mail URL set → client calls service; UI shows sent/skipped.
- Edge: mail URL unset → stub path; opened stays 0.
- Error: service 5xx → `alert` with message; no silent success toast.
- Covers AE1 / AE3 at integration/smoke level.

**Verification.** Typecheck; manual send in preview with and without `VITE_CAMPAIGN_MAIL_URL`.

---

### U5. Ops runbook — Resend domain, webhook, deploy

**Goal.** Document how to configure Resend and deploy the mail service so opens actually arrive.

**Requirements.** R6; Dependencies section

**Dependencies.** U2, U3

**Files.**
- `server/campaign-mail/README.md` (modify)
- `docs/superpowers/specs/pocketbase-platform-collections.md` or short `docs/superpowers/specs/2026-07-26-resend-campaign-mail.md` (create) — webhook URL, events (`email.opened`), env names

**Approach.** List required env vars (`RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESEND_FROM`, PB URL/service auth). Steps: verify domain in Resend; create webhook pointing at public `/webhooks/resend`; subscribe to `email.opened`; set client `VITE_CAMPAIGN_MAIL_URL`. Note open-tracking limitations (image blockers). No secrets in git.

**Test expectation:** none — documentation/ops only.

**Verification.** Another operator can follow the README to a first tracked open without reading the plan.

---

## Verification Contract

- `pnpm exec tsc --noEmit` passes after client changes.
- Mail service boots locally and accepts a send against a test campaign.
- Resend dashboard shows outbound messages for live path.
- Opening a test email increments `stats_opened` once; duplicate webhook does not double-count.
- With `VITE_CAMPAIGN_MAIL_URL` unset, mock send still creates Activities and does not claim open tracking.
- Campaigns list strip reflects non-zero sent/opened after live path.

## Definition of Done

- All units U1–U5 complete per their verification.
- R1–R8 satisfied; session-settled KTDs honored.
- No Resend secrets in client bundle or `.env.example` values.
- Product Contract scope boundaries respected (no SendGrid, no SMS/ads, no editor redesign).

## Appendix

### Research notes

- Current stub: `src/lib/platform-api.ts` `sendCampaignEmail` — no contact email lookup, never writes `stats_opened`.
- UI already aggregates stats in `src/pages/campaigns/CampaignsList.tsx`.
- Institutional docs defer live credentials for Automations apps; this plan is a **campaign-specific** credentials slice, not the general app-connect platform.
- Resend: tags on send; `email.opened` includes `email_id` + tags; verify with raw body + Svix headers.
