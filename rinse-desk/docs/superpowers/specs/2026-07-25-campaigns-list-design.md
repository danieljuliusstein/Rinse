# Campaigns list + full-page editor

**Date:** 2026-07-25  
**Status:** Implemented  
**Reference:** Centra Hub–style campaign list (structure only); visual language stays Rinse / Contacts.

## Goal

Replace the current Campaigns master–detail layout with a Contacts-style **table list**, and open campaigns in a **full-page editor** (same shell, list replaced by editor). Borrow the screenshot’s information density and list affordances; do not clone Centra branding, A–Z bar, Look-in, view switchers, or right utility rail.

## Decisions

| Topic | Choice |
|--------|--------|
| Layout | Contacts-style table list (Approach 1) |
| Detail | Full-page editor within Campaigns (in-page view state) |
| Columns / model | Existing `DeskCampaign` fields only — no owner, code, dates, or campaign type |
| Toolbar | New + search + status pills + channel Filter — no A–Z / kanban / tree |
| Create | `+ New Campaign` creates a draft via API, then opens the editor |
| Scope | UI restructure only; no schema or API contract changes |

## Current state

- `src/pages/CampaignsPage.tsx` — left list + right form (master–detail)
- Model: `DeskCampaign` in `src/lib/types.ts` — `id`, `name`, `status`, `audience_ids`, `subject?`, `body?`, `channel`, `stats_sent`, `stats_opened`, `created?`
- CRUD / send: `platform-api.ts` (`listCampaigns`, `createCampaign`, `updateCampaign`, `deleteCampaign`, `sendCampaignEmail`)
- Shell: no react-router; `PageId` `'campaigns'` renders `CampaignsPage`
- Visual reference for list chrome: `src/pages/Contacts.tsx`

## Architecture

Single page entry with internal view state:

```
CampaignsPage
  view: 'list' | 'editor'
  selectedId: string | null
  ├── CampaignsList     (when view === 'list')
  └── CampaignEditor    (when view === 'editor' && selectedId)
```

- **New:** `createCampaign` → set `selectedId` → `view = 'editor'`
- **Open:** row name or edit icon → set `selectedId` → `view = 'editor'`
- **Back:** `view = 'list'`, clear `selectedId`, refresh list
- **Delete (list or editor):** confirm → delete → clear `selectedId`, `view = 'list'`, refresh
- No new `PageId`; sidebar stays on Campaigns for both views

### File structure

| File | Role |
|------|------|
| `src/pages/CampaignsPage.tsx` | Load/refresh, view state, create/open/back orchestration |
| `src/pages/campaigns/CampaignsList.tsx` | Toolbar + table |
| `src/pages/campaigns/CampaignEditor.tsx` | Form + Save / Send / Delete (from current right pane) |

Keep API usage in `platform-api`; do not change `DeskCampaign` or PocketBase collections for this work.

## List view

### Toolbar

- Primary: **+ New Campaign** (Rinse green), same pattern as Contacts “New contact”
- Search: filters by name and subject (case-insensitive)
- Status pills: All | Draft | Active | Paused | Completed
- Filter menu (Contacts-style): channel checkboxes — email / sms / ads / other (include in v1)
- Out of scope: Group By, A–Z letter bar, Look-in date picker, list/kanban/tree switchers, Centra right rail

### Table

| Column | Source | Notes |
|--------|--------|--------|
| Action | — | Edit (pencil) → editor; Delete (confirm) → stay on list |
| Name | `name` | Click → editor |
| Channel | `channel` | Pill |
| Status | `status` | Pill (Rinse green/gray; not Centra multi-color type badges) |
| Audience | `audience_ids.length` | Count |
| Sent | `stats_sent` | |
| Opened | `stats_opened` | |
| Created | `created` | Formatted date or — |

- No row checkboxes / bulk actions in v1
- Empty state: short message + New Campaign CTA
- Footer: show total matching count (e.g. “N campaigns”). No pagination in v1.

### Header

- `Header title="Campaigns"` with a short subtitle (e.g. outreach / email send), matching current page tone

## Editor view

- Replaces list in the main content area; sidebar still highlights Campaigns
- Top of content: **Back** control → list
- Form fields (unchanged from today): name, status, channel, email subject, email body, audience (Contacts checkboxes), stats line
- Actions: Save, Send email (L2), Delete
- Non-email channel: keep existing amber L3 note (channel tracked; send still uses subject/body)
- After delete from editor: return to list and refresh
- If selected campaign disappears after refresh: return to list

## Data & errors

- Continue `useData()` for contacts (audience), `useUi()` for `alert` / `toast`
- Load failures, create/save/send/delete failures: same alert messaging as today
- Success toasts on create/save/send as today
- No optimistic list mutations required; refresh after mutations is fine

## Out of scope

- New campaign fields (owner, code, start/end dates, campaign type)
- Centra visual clone (blue theme, Look-in, A–Z, view modes, right icon rail)
- Bulk select / bulk delete
- Separate `PageId` or DeskNav deep-link for editor (can add later like `openContact`)
- Kanban / tree views (even as stubs)

## Success criteria

1. Opening Campaigns shows a Contacts-style searchable, filterable table of existing campaigns
2. New Campaign creates a draft and lands on the full-page editor
3. Clicking a name or edit opens the full-page editor with current fields and actions
4. Back returns to the list; delete from list or editor ends on an updated list
5. Look and density match Rinse / Contacts, not Centra Hub branding
