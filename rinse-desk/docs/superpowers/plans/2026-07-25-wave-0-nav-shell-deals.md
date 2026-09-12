# Wave 0 — Nav Shell + Deals Board Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the green sidebar with stub pages for new modules, rename Sales→Deals, and fix the board teleport by removing team filter tabs.

**Architecture:** Extend `PageId` and wire new pages in `App.tsx` Shell. Shared `ComingSoonPage` for stubs. Deals board shows all leads without Pre-Sales/Sales Team filtering.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, existing `DeskNavProvider` page state (no router).

## Global Constraints

- Keep Rinse green sidebar tokens (`colors.sidebarFrom` / `sidebarTo`).
- Do not redesign Deals cards or column rules (amount thresholds stay).
- Do not implement Activities/Campaigns/etc. beyond stubs.
- Rename `sales` → `deals` everywhere in navigation/types.
- No git commits if repo has no `.git` (workspace may be ungitted).

---

### Task 1: Extend PageId and create ComingSoonPage

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/pages/ComingSoonPage.tsx`

**Interfaces:**
- Produces: `PageId` union including `deals | activities | campaigns | forms | landing_pages | funnels | automations | chat` (no `sales`)
- Produces: `ComingSoonPage({ title, subtitle, wave })` component

- [ ] **Step 1: Update PageId in types.ts**

Replace:

```ts
export type PageId = 'dashboard' | 'sales' | 'money' | 'contacts' | 'calendar' | 'settings'
```

With:

```ts
export type PageId =
  | 'dashboard'
  | 'deals'
  | 'money'
  | 'contacts'
  | 'calendar'
  | 'activities'
  | 'campaigns'
  | 'forms'
  | 'landing_pages'
  | 'funnels'
  | 'automations'
  | 'chat'
  | 'settings'
```

- [ ] **Step 2: Create ComingSoonPage**

```tsx
import { Header } from '../App'

export default function ComingSoonPage({
  title,
  subtitle,
  wave,
}: {
  title: string
  subtitle: string
  wave: number
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title={title} subtitle={subtitle} />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
          <p className="text-xs text-gray-500 mb-4">{subtitle}</p>
          <p className="text-xs text-gray-400 rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6">
            Coming in Wave {wave}. This area is wired into navigation and will ship as a thin MVP next.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript sees new PageId**

Run: `pnpm exec tsc --noEmit` (expect errors until App.tsx updated — OK for now)

---

### Task 2: Wire sidebar, Shell pages, and rename sales→deals references

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/hooks/useCreateActions.ts`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/lib/settings-hub.ts` (if it references Sales/pipeline)

**Nav order:** Dashboard, Deals, Money, Contacts, Calendar, Activities, Campaigns, Forms, Landing Pages, Funnels, Automations, Chat, Settings

- [ ] **Step 1: Update NAV_ITEMS and pages map in App.tsx**

- Change `{ id: 'sales', label: 'Sales', ...}` to `{ id: 'deals', label: 'Deals', ...}` (keep chart/handshake-style icon or existing polyline icon).
- Add nav items with outline SVG icons for: activities (clock), campaigns (megaphone), forms (doc), landing_pages (browser), funnels (funnel), automations (bot/gear), chat (bubble).
- Import `ComingSoonPage` and map:

```tsx
deals: <SalesPipeline />,
activities: <ComingSoonPage title="Activities" subtitle="Timeline events on contacts" wave={1} />,
campaigns: <ComingSoonPage title="Campaigns" subtitle="Outreach lists and sends" wave={2} />,
forms: <ComingSoonPage title="Forms" subtitle="Capture leads with forms" wave={3} />,
landing_pages: <ComingSoonPage title="Landing Pages" subtitle="Hosted pages" wave={4} />,
funnels: <ComingSoonPage title="Funnels" subtitle="Multi-step journeys" wave={5} />,
automations: <ComingSoonPage title="Automations" subtitle="Triggers and actions" wave={8} />,
chat: <ComingSoonPage title="Chat" subtitle="Live visitor chat" wave={6} />,
```

- [ ] **Step 2: Replace setPage('sales') with setPage('deals')**

In `useCreateActions.ts` and `Dashboard.tsx`.

- [ ] **Step 3: Run build**

Run: `pnpm run build`  
Expected: success

---

### Task 3: Fix Deals board teleport (remove team filters)

**Files:**
- Modify: `src/pages/SalesPipeline.tsx`

- [ ] **Step 1: Remove team filter state and UI**

- Delete `activeFilter` state and default `'Sales Team'`.
- Delete `teamCounts` memo.
- Change `deals` memo to simply use all deals (still apply search filter in columns):

```tsx
const deals = allDeals
```

- Remove the Teams / Pre-Sales / Sales Team button group from the toolbar.
- Update Header to `title="Deals"` `subtitle="Pipeline · Opportunities"`.
- Optionally simplify breadcrumb from "Teams / Opportunities" to "Pipeline / Opportunities".

- [ ] **Step 2: Manual verify**

Drag a deal from New → Proposition and confirm it stays visible on the same board. Drag to Won — still visible.

- [ ] **Step 3: Build again**

Run: `pnpm run build`  
Expected: success

---

## Regression checklist (Wave 0 exit)

- [ ] Login still works
- [ ] Dashboard loads; “View All” deals navigates to Deals
- [ ] Deals board shows all stages; no team tabs; no teleport
- [ ] Money, Contacts, Calendar, Settings unchanged
- [ ] Every new nav stub renders ComingSoon with correct wave number
