# CRM Platform Waves — Design Spec

**Date:** 2026-07-25  
**Status:** Approved  
**Approach:** Spine then spokes (Approach A)

## Goal

Grow the desk CRM into a broader platform (Deals, Campaigns, Forms, Landing Pages, Funnels, Automations, Activities, Chat, later AI) without breaking Money, Contacts, Calendar, or Settings. Each wave ships polished UI + PocketBase persistence + a regression pass against everything already live.

## Settled decisions

| Decision | Choice |
|----------|--------|
| Existing areas | Keep Dashboard, Money, Contacts, Calendar, Settings |
| Sales / Deals | Rename Sales → Deals; keep kanban; no card/column redesign |
| Board filters | One board — remove Pre-Sales / Sales Team tabs (fixes teleport) |
| Sidebar look | Keep Rinse green gradient |
| Delivery shape | Shell first, then thin MVPs in dependency order |
| Activities | Timeline events (call, email, note, meeting) on Contact; Deal optional |
| Campaigns | Layered: L1 list/audience → L2 email send → L3 multi-channel |
| Forms / LP / Funnels | Independent modules; no hard coupling in early waves |
| Chat | Live visitor widget + agent inbox |
| Automations | Defer Zapier vs first-party until Wave 8 (`ce-pov`) |
| AI | After Chat / Activities / Automations (Wave 9) |
| Persistence | Extend existing PocketBase + `src/lib/api.ts` patterns |
| Wave done bar | Happy path + regression vs prior waves + visual polish |

## Integration spine

- Prefer link to **Contact** (and **Deal** when relevant) over duplicating people.
- Meaningful events (form submit, campaign send, chat message) should write an **Activity** once Activities exist.
- Never silently break Money / Calendar / Contacts / Deals.
- Stubs show intentional empty states with wave hints — not dead clicks.

```text
Contacts ──┬── Deals (board)
           ├── Activities ←── Campaigns / Forms / Chat (emit events)
           ├── Campaigns (audience = Contacts)
           ├── Forms / Landing Pages / Funnels (independent)
           └── Chat (threads ↔ Contact when identified)
                     └── Automations / AI (later)
```

## Wave map

| Wave | Focus | Exit gate |
|------|--------|-----------|
| **0** | Nav shell + stubs; Sales→Deals; one-board fix | All stubs reachable; teleport gone; core pages unchanged |
| **1** | Activities MVP + PB collection + API | Log/list/filter on Contact; optional Deal link |
| **2** | Campaigns L1 | CRUD campaign + Contact audience + status |
| **3** | Forms MVP | CRUD form + submissions → Contact + Activity |
| **4** | Landing Pages MVP | CRUD page record + preview shell |
| **5** | Funnels MVP | CRUD funnel record (loose; no hard coupling yet) |
| **6** | Chat | Agent inbox + embeddable widget; PB realtime |
| **7** | Campaigns L2 | Compose + send email; log Activities |
| **8** | Automations | `ce-pov` decision → first working path |
| **9** | Campaigns L3 + AI | Multi-channel placeholders + assist panel |

## Wave 0 detail

**Nav order (green sidebar):** Dashboard, Deals, Money, Contacts, Calendar, Activities, Campaigns, Forms, Landing Pages, Funnels, Automations, Chat, Settings

**PageId:** replace `sales` with `deals`; add `activities | campaigns | forms | landing_pages | funnels | automations | chat`

**Deals board:** Remove `activeFilter` / team tabs / filter that hides cards. Show all columns: New → Qualified → Proposition → Won. Keep amount thresholds and DnD/API.

**Stubs:** Title, one-line purpose, “Coming in Wave N” empty state.

## Superpowers workflow

Each wave: spec (if needed) → `writing-plans` → `subagent-driven-development` (or `executing-plans`) → `verification-before-completion` → `finishing-a-development-branch`. Use `systematic-debugging` on failures. Use `ce-pov` at Wave 8. Use `ce-compound` after non-obvious fixes.

## Out of scope (until named waves)

Purple sidebar; Segments / My Orders; merging Forms↔Funnels early; Automations/AI before Waves 8–9; redesigning Deals cards beyond team-tab fix.

## PocketBase collections (later waves)

Org-scoped collections following existing `listOrgRecords` / `requireOrganizationId` patterns:

- `activities` — Wave 1
- `campaigns` — Wave 2+
- `forms`, `form_submissions` — Wave 3
- `landing_pages` — Wave 4
- `funnels` — Wave 5
- `chat_threads`, `chat_messages` — Wave 6
- `automations` — Wave 8
