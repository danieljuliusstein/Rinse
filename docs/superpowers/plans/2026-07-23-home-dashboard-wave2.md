# Home Dashboard Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Home from flashing a full skeleton on every `tick` refresh, reuse settings already loaded for calendar blocked-dates, and tighten fetch timeouts — without changing module order or chrome from Wave 1.

**Architecture:** Keep the existing parallel fetch in `app/(tabs)/index.tsx`. Gate full-screen `loading` to the first successful paint only. Persist `booking_schedule` (and related settings fields already set) in component state so `loadBlockedDates` does not call `loadSettings()` on every month change. Differentiate `withTimeout` budgets for core CRM data vs weather.

**Tech Stack:** Expo SDK 57, React Native, existing `loadSettings` / `getTimeBlocks` / `useDataRefresh` — no new networking libraries.

**Spec:** `docs/superpowers/specs/2026-07-22-home-dashboard-design.md` § Wave 2  
**Depends on:** Wave 1 shipped on `feat/home-dashboard-wave1`

## Global Constraints

- React Native primitives only — never `div` / `span` / `className`
- Tokens from `src/theme/` via `@/src/theme/colors`
- Do not change Wave 1 module scroll order or `HOME_MODULE_DEFAULTS`
- No new Home widgets (Wave 3)
- No `setInterval` sync loops
- Verification: `npm run typecheck` (file-scoped cleanliness; repo may have pre-existing failures)
- Commits: only when the user explicitly asks

---

## File map

| File | Responsibility |
|------|----------------|
| `app/(tabs)/index.tsx` | Soft refresh, settings/schedule cache, timeout budgets |
| `src/components/ui/ScreenSkeletons.tsx` | Optional: align Home skeleton block order with Wave 1 (today before calendar) |
| `docs/superpowers/plans/2026-07-23-home-dashboard-wave2.md` | This plan |

---

### Task 1: Soft refresh — no full skeleton on `tick`

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `tick` from `useDataRefresh()`
- Produces: `loading === true` only before the first completed dashboard load; subsequent ticks refresh data in place

- [ ] **Step 1: Track first paint**

Add state (or ref) so the initial load still shows `ScreenLoading variant="home"`, but refreshes do not:

```tsx
const [loading, setLoading] = useState(true)
const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
```

At the start of the `tick` effect:

```tsx
useEffect(() => {
  let cancelled = false
  if (!hasLoadedOnce) {
    setLoading(true)
  }
  setWeatherLoading(true)
  setError(null)
  // ... existing withTimeout + Promise.all ...
```

In `finally` / after successful apply:

```tsx
if (!cancelled) {
  setLoading(false)
  setWeatherLoading(false)
  setHasLoadedOnce(true)
}
```

On hard failure of the whole `try` when `hasLoadedOnce` is already true: keep showing previous jobs/invoices; set `error` only if you want a banner — prefer **not** blanking the screen. If `hasLoadedOnce` is false, keep today’s error path.

Do **not** reset `jobs` / `invoices` to `[]` before the fetch completes.

- [ ] **Step 2: Confirm render branch**

Leave:

```tsx
{loading ? (
  <ScreenLoading variant="home" />
) : error && !hasLoadedOnce ? (
  <AppText …>{error}</AppText>
) : (
  <ScrollView>…</ScrollView>
)}
```

If `hasLoadedOnce` and a soft refresh fails, either clear `error` and keep content, or show a non-blocking caption — do not force skeleton. Simplest approved behavior: on catch after first load, leave previous data; set `error` to null in soft path (or ignore catch for UI). Document choice in the task report.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`  
Expected: no new errors in `index.tsx`

- [ ] **Step 4: Commit only if user asked**

---

### Task 2: Cache booking schedule for calendar blocked dates

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `AppSettings` / `booking_schedule` from main dashboard `loadSettings()` result
- Produces: `loadBlockedDates` uses in-memory schedule; no `loadSettings()` on month change when schedule is already known

- [ ] **Step 1: Hold schedule in state**

```tsx
import type { BookingSchedule } from '…' // use existing type from booking-calendar / settings-store
import { DEFAULT_BOOKING_SCHEDULE } from '@/src/lib/booking-calendar'

const [bookingSchedule, setBookingSchedule] = useState<BookingSchedule>(DEFAULT_BOOKING_SCHEDULE)
```

When main fetch returns `settings`:

```tsx
if (settings) {
  setProfilePercent(computeProfileCompletion(settings))
  setHomeModules(settings.home_modules ?? {})
  setBookingSchedule(settings.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE)
}
```

- [ ] **Step 2: Rewrite `loadBlockedDates`**

```tsx
const loadBlockedDates = useCallback(async (year: number, month: number) => {
  const schedule = bookingSchedule
  const { from, to } = monthDateRange(year, month)
  const blocks = await getTimeBlocks(from, to)
  const allDay = blocks.filter((b) => b.all_day).map((b) => b.date)
  setBlockedDates(computeBlockedDates(datesInMonth(year, month), schedule, allDay))
}, [bookingSchedule])
```

Remove the `await loadSettings()` inside this callback.

Keep the effect that runs on `[calendarMonth.year, calendarMonth.month, loadBlockedDates, tick]` so after a soft refresh updates `bookingSchedule`, blocked dates recompute.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`  
Expected: no new errors in `index.tsx`

- [ ] **Step 4: Commit only if user asked**

---

### Task 3: Differentiate fetch timeouts

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Produces: named timeout constants; weather shorter than core CRM lists

- [ ] **Step 1: Replace magic `12000` with budgets**

Near the top of the file (module scope) or inside the effect:

```tsx
const HOME_CORE_TIMEOUT_MS = 8000
const HOME_WEATHER_TIMEOUT_MS = 5000
```

Wire:

```tsx
withTimeout(listJobs(200), HOME_CORE_TIMEOUT_MS, [] as JobWithRelations[]),
withTimeout(listInvoices(), HOME_CORE_TIMEOUT_MS, [] as Invoice[]),
withTimeout(listLeads(), HOME_CORE_TIMEOUT_MS, [] as Awaited<ReturnType<typeof listLeads>>),
withTimeout(listPackages(), HOME_CORE_TIMEOUT_MS, [] as Package[]),
withTimeout(listSupplies(), HOME_CORE_TIMEOUT_MS, [] as Supply[]),
withTimeout(loadSettings(), HOME_CORE_TIMEOUT_MS, null),
withTimeout(fetchWeatherReadiness(), HOME_WEATHER_TIMEOUT_MS, null),
```

Keep fallback semantics identical (empty arrays / null). Do not invent retries.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit only if user asked**

---

### Task 4: Align Home skeleton with Wave 1 order (light)

**Files:**
- Modify: `src/components/ui/ScreenSkeletons.tsx` (`HomeScreenSkeleton` only)

**Interfaces:**
- Visual only — skeleton blocks should suggest: CTA → today card → readiness/AR-ish strips → calendar → list rows (not calendar before today)

- [ ] **Step 1: Reorder skeleton boxes**

Current order in `HomeScreenSkeleton`: header → CTA row → tall card → mid card → calendar-tall → list.

Adjust heights/order so the first large block after CTA reads as **today job** (~120–140 height), then a shorter readiness/AR strip (~88), then calendar (~220), then 2 list rows — matching Wave 1 scroll priority. Keep `accessibilityRole="progressbar"`. Do not duplicate greeting skeleton if `OperatorScreen` already shows the real header (today the skeleton includes a fake header — if `customHeader` is always mounted above loading, remove the redundant header skeleton **only if** you confirm `OperatorScreen` still shows `greetingHeader` while `loading`).

Check `index.tsx`: `customHeader={greetingHeader}` is always passed; while `loading`, body is `ScreenLoading`. Prefer removing the fake header row from `HomeScreenSkeleton` so the real greeting stays and the skeleton matches body-only content.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit only if user asked**

---

### Task 5: Verification gate

**Files:** none (verification)

- [ ] **Step 1: Typecheck** — no new errors in touched files

- [ ] **Step 2: Static / logic checklist**

| Case | Expect |
|------|--------|
| Cold open | Full home skeleton (body) until first fetch settles |
| `bump()` / tick after load | Scroll content stays; data updates; no full skeleton flash |
| Month change on calendar | `getTimeBlocks` runs; **no** `loadSettings` in that path |
| Weather slow | Core cards can still populate if weather times out at 5s |
| Wave 1 order | Unchanged |

- [ ] **Step 3: Report deferred Wave 3** in chat when done

---

## Out of scope

- Wave 3 Figma / new widgets
- Fixing unrelated repo-wide `tsc` failures
- Changing `DataRefreshProvider` API
- Global settings cache in `settings-store` (Home-local state is enough for Wave 2)

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Refresh without full `loading` flash | 1 |
| Cache settings for calendar | 2 |
| Tighten / differentiate timeouts | 3 |
| Skeleton alignment / sufficiency | 4 |
| Typecheck verification | 5 |
