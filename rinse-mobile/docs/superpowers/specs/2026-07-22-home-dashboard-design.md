# Home dashboard polish — design

**Date:** 2026-07-22  
**Surface:** `apps/mobile` operator Home (`app/(tabs)/index.tsx` + `src/components/home/*`)  
**Status:** Approved (conversation) — Wave 1 is the implementation target  
**Approach:** Three waves (visual → perf → Figma/features)

---

## Goal

Make Home feel like one coherent operator dashboard: clear hierarchy, useful empty states, consistent card chrome, and stable loading — without redesigning shell, nav, tokens lane, or inventing web UI.

## Non-goals

- New bottom tabs or dark theme
- Client-light / book / portal tokens
- Operator UI in `apps/api`
- Replacing `@rinse/core` types or duplicating validation in screen files
- Shipping MagicPath/shadcn DOM components into RN

## Constraints

- React Native primitives + `StyleSheet`; tokens from `src/theme/`
- Compose `src/components/ui/*` and existing `src/components/home/*`
- Respect `home_modules` prefs via `isHomeModuleEnabled` / `HOME_MODULE_DEFAULTS`
- iPhone-first; 44pt min taps; content max ~428 / frame 390
- Accent `#22c55e` only for primary CTAs (one green CTA per block where CTAs exist)

---

## Current architecture (keep)

| Piece | Role |
|-------|------|
| `app/(tabs)/index.tsx` | Orchestrates data load, module order, search mode |
| `src/lib/home-dashboard.ts` | Pure builders: today job, upcoming, inventory alert, search |
| `src/lib/settings-store.ts` | `HomeModulePrefs`, defaults, toggles |
| `src/components/home/*` | Presentational cards/sections |
| `BlockStagger` | List stagger on mount |
| `OperatorScreen` + `HomeGreetingHeader` | Shell + greeting / pipeline badge / search |

Data load today: parallel `listJobs` / `listInvoices` / `listLeads` / packages / supplies / settings / weather, each with a 12s timeout fallback. Calendar blocked dates load separately per month.

---

## Wave 1 — Visual system, section order, empty states

### 1. Visual / hierarchy

**Unify card chrome** across home modules:

- Shared surface: `colors.surface`, `radii` from theme tokens, consistent horizontal padding aligned with `OperatorScreen` content inset
- Prefer extracting a small shared home surface helper or constants in `src/components/home/` (e.g. `homeCardStyles`) rather than copy-pasting shadow/radius per card — only if 2+ cards diverge today
- Section labels stay uppercase muted via `HomeSection` / `AppText variant="sectionLabel"`
- Primary actions use existing green button patterns (`Button` primary or established home green pressables); secondary use `SecondaryButton` / ghost — never two competing greens in one card

**Motion:** Keep `BlockStagger`; re-index after any reorder so stagger still reads top→bottom. Honor reduced-motion if the codebase already gates it on `BlockStagger`; do not invent new motion archetypes in Wave 1.

### 2. Layout / default module order

**Product intent (scroll order when modules enabled):**

1. Sync / offline hint (if pending queue)
2. Profile completion nudge (if incomplete, non-screenshot)
3. CTA row (`cta_row`) — only when useful; keep default on
4. **Today’s jobs** (`today_jobs`) — promote earlier than today if currently below calendar/revenue
5. Job readiness / weather (`job_readiness`)
6. AR summary (`ar_alert`) — keep when open invoices matter; visually secondary to today when both present
7. Inventory alert (`inventory_alert`) — only when `buildInventoryAlert` returns data
8. Month calendar (`month_calendar`)
9. Also today / upcoming lists
10. Optional denser modules remain off by default: `invoice_month_carousel`, `revenue_chart`

**Default prefs** (`HOME_MODULE_DEFAULTS`): keep carousel and revenue chart **off**; keep today, calendar, upcoming, readiness, AR, inventory, CTA **on**. If Wave 1 reorders render only, do not change defaults unless product copy in Settings would become wrong — then update `HOME_MODULE_TOGGLES` labels only as needed.

**Implementation note:** Reorder JSX in `index.tsx` to match the list above. Do not hard-code “always show” for modules the user turned off.

### 3. Empty & loading states

| Situation | Behavior |
|-----------|----------|
| No job today | Keep `TodayJobCard` empty: muted icon + copy + single green **Schedule** CTA |
| No upcoming | Compact empty row or omit section when length 0 (current omit is fine); if we show the section, one line of muted copy — no second green CTA |
| Search no match | Keep existing `home.noMatch` caption |
| Zero revenue / empty carousel | Do not render carousel/chart when no data (already gated); no fake zeros charts |
| Full dashboard loading | Prefer header stable + `ScreenLoading variant="home"` (or section skeletons) over blank spinner that hides greeting — if greeting already mounts above loading, preserve that |
| Partial failure | Keep timeout fallbacks; surface a single error string only when the whole Promise.all path throws |

Copy: reuse / extend `home.*` i18n keys; no hardcoded English in new UI.

### 4. Figma alignment (Wave 1 light touch)

Use `docs/FIGMA_MAKE_CRM_PROMPT.md` as the visual contract. Wave 1 adjusts spacing/type on:

- `HomeGreetingHeader`
- `TodayJobCard`
- `HomeCtaRow`

to match shipped shell language (light bg `#f2f2f7`, green FAB/CTA). Full mockup pixel-pass is Wave 3 unless screenshots are attached during Wave 1.

### 5. Features in Wave 1

**None new.** Pipeline badge on header stays. No new widgets until Wave 3.

### 6. Perf (deferred to Wave 2 — document only here)

- Tighten or differentiate the 12s `withTimeout` fallbacks
- Avoid redundant `loadSettings()` on calendar month change when settings already in memory
- Prevent full-dashboard flash on `tick` refresh (keep previous data visible while refreshing)

Wave 1 may do **small** loading UX fixes that unblock empty-state work; deep fetch/cache work stays Wave 2.

---

## Wave 2 — Performance & loading (later plan)

- Refresh without full `loading=true` flash when data already present
- Cache settings for calendar/unblock flows
- Skeleton per major block (`ScreenSkeletons` / home variant) if not already sufficient
- Verify with device/web smoke + `npm run typecheck`

## Wave 3 — Figma parity + optional widgets (later plan)

- Diff attached Figma Make frames against Home
- Only add widgets that use existing APIs + `@rinse/core`
- `npm run visual-audit` snapshot update only when intentional

---

## Testing / verification (Wave 1)

1. `npm run typecheck`
2. Manual: Home with jobs today / no jobs / search match / no match / profile incomplete
3. Toggle modules in Settings → Home reflects prefs
4. Optional: `npm run visual-audit` if Home snapshots exist and layout shifted materially

## Files likely touched (Wave 1)

- `app/(tabs)/index.tsx` — module order, loading presentation
- `src/components/home/*.tsx` — chrome, empty states, hierarchy
- `src/theme/tokens.ts` or `colors` — only if shared spacing constants needed
- i18n locale files for any new `home.*` strings
- Possibly `src/lib/settings-store.ts` — only if default order documentation or toggle labels change

## Success criteria (Wave 1)

- [ ] Scroll order matches product intent when defaults are on
- [ ] Today empty + Schedule CTA remains clear and single-green
- [ ] Home cards share consistent radius/padding/surface
- [ ] User-disabled modules still hide
- [ ] Typecheck passes; no web primitives introduced
