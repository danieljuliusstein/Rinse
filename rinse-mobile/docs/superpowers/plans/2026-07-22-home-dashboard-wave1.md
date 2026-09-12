# Home Dashboard Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify Home card chrome, reorder modules so today’s jobs surface earlier, and polish empty/loading hierarchy — without new widgets or web bleed.

**Architecture:** Extract shared `homeCard` StyleSheet helpers under `src/components/home/`, migrate existing home cards onto them, reorder the enabled-module JSX in `app/(tabs)/index.tsx` to match the approved scroll order, and tighten the today-empty Schedule CTA to a single solid green primary. Defaults in `HOME_MODULE_DEFAULTS` stay unchanged.

**Tech Stack:** Expo SDK 57, React Native, Expo Router, StyleSheet tokens from `src/theme/tokens.ts` (via `@/src/theme/colors`), i18n `home.*` keys, `BlockStagger` + `useReduceMotion`.

**Spec:** `docs/superpowers/specs/2026-07-22-home-dashboard-design.md` (Wave 1 only).

## Global Constraints

- React Native primitives only (`View` / `Text` / `Pressable`) — never `div`, `span`, or `className`
- Tokens from `src/theme/` (`colors`, `spacing`, `radii`, `shadows`); operator light lane; accent `#22c55e`
- Compose `src/components/ui/*` and `src/components/home/*`; do not invent parallel card systems
- Respect `isHomeModuleEnabled` / user prefs — never force-show a disabled module
- Do not change `HOME_MODULE_DEFAULTS` (carousel + revenue chart remain off by default)
- No new Home widgets in Wave 1; Wave 2/3 stay out of this plan
- Verification: `npm run typecheck` (no Jest unit suite in this package)
- Commits: only when the user explicitly asks (do not auto-commit mid-run unless instructed)

---

## File map

| File | Responsibility |
|------|----------------|
| `src/components/home/homeCardStyles.ts` | **Create** — shared surface StyleSheet (`card`, `cardPressed`) |
| `src/components/home/TodayJobCard.tsx` | Migrate chrome; solid green Schedule empty CTA |
| `src/components/home/ArSummaryCard.tsx` | Migrate chrome to shared styles |
| `src/components/home/InventoryAlertCard.tsx` | Migrate chrome |
| `src/components/home/ProfileCompleteCard.tsx` | Migrate chrome |
| `src/components/home/WeatherReadinessCard.tsx` | Migrate chrome on card surfaces |
| `src/components/home/HomeMonthCalendar.tsx` | Migrate outer card chrome |
| `src/components/home/HomeRevenueChart.tsx` | Migrate outer card chrome |
| `src/components/home/ComingUpCard.tsx` | Migrate chrome if still used; else leave if unused by Home |
| `src/components/home/HomeCtaRow.tsx` | Light spacing polish; keep one green primary |
| `src/components/home/HomeGreetingHeader.tsx` | Light spacing/type polish only |
| `app/(tabs)/index.tsx` | Reorder modules + `BlockStagger` indices; keep header stable while loading |

**Do not modify:** `HOME_MODULE_DEFAULTS` / toggle list unless labels become wrong (they should not). Do not touch FAB / tab shell.

---

### Task 1: Shared home card styles

**Files:**
- Create: `src/components/home/homeCardStyles.ts`
- Modify: none yet

**Interfaces:**
- Consumes: `colors`, `radii`, `spacing`, `shadows` from `@/src/theme/colors`
- Produces: `homeCardStyles` StyleSheet with keys `card` and `cardPressed`

- [ ] **Step 1: Create shared styles**

Create `src/components/home/homeCardStyles.ts`:

```tsx
import { StyleSheet } from 'react-native'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'

/** Shared operator-home surface — use for module cards, not CTAs or pills. */
export const homeCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  cardPressed: {
    backgroundColor: colors.surfaceActive,
  },
})
```

Notes:
- `radii.md` is `12` (unifies today’s mix of `12` vs `radii.sheet` / `16`)
- `shadows.card` already Platform-splits native/web in tokens
- Spread `shadows.card` only if TypeScript accepts `ViewStyle` into StyleSheet; if tsc complains about web `boxShadow`, use `[homeCardStyles.card, shadows.card]` at call sites instead of spreading inside `StyleSheet.create`

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`  
Expected: PASS (or only pre-existing errors unrelated to this file)

- [ ] **Step 3: Commit (only if user asked to commit)**

```bash
git add src/components/home/homeCardStyles.ts
git commit -m "$(cat <<'EOF'
Extract shared home card surface styles.

EOF
)"
```

---

### Task 2: Migrate home cards onto shared chrome

**Files:**
- Modify: `src/components/home/TodayJobCard.tsx`
- Modify: `src/components/home/ArSummaryCard.tsx`
- Modify: `src/components/home/InventoryAlertCard.tsx`
- Modify: `src/components/home/ProfileCompleteCard.tsx`
- Modify: `src/components/home/WeatherReadinessCard.tsx`
- Modify: `src/components/home/HomeMonthCalendar.tsx` (outer container only)
- Modify: `src/components/home/HomeRevenueChart.tsx` (outer container only)
- Modify: `src/components/home/ComingUpCard.tsx` (if file defines a bordered surface)

**Interfaces:**
- Consumes: `homeCardStyles` from `./homeCardStyles`
- Produces: visually consistent module cards; no prop API changes

- [ ] **Step 1: Migrate `TodayJobCard` chrome (keep empty CTA for Task 3)**

Replace local `card` / `emptyCard` background/border/radius/padding with:

```tsx
import { homeCardStyles } from './homeCardStyles'

// filled job card:
style={homeCardStyles.card}

// empty card:
style={[homeCardStyles.card, styles.emptyCard]}

// emptyCard residual styles — alignment only:
emptyCard: {
  alignItems: 'center',
  gap: spacing.sm,
  paddingVertical: spacing.lg, // taller empty state; horizontal padding from homeCardStyles
},
```

Remove duplicated `backgroundColor` / `borderRadius` / `borderWidth` / `borderColor` / base `padding` from local `card` / `emptyCard`.

- [ ] **Step 2: Migrate pressable cards (`ArSummaryCard`, `InventoryAlertCard`, `ProfileCompleteCard`)**

Pattern:

```tsx
style={({ pressed }) => [homeCardStyles.card, pressed && homeCardStyles.cardPressed]}
```

Delete local `card` / `pressed` duplicates that only set surface/border/radius/padding. Keep icon colors, typography, and layout rows.

- [ ] **Step 3: Migrate `WeatherReadinessCard`, `HomeMonthCalendar`, `HomeRevenueChart`, `ComingUpCard`**

Apply `homeCardStyles.card` to the **outer** bordered surface only. Do not restyle day cells, chart bars, or inner pills.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`  
Expected: PASS

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/components/home/*.tsx
git commit -m "$(cat <<'EOF'
Unify Home module cards on shared surface styles.

EOF
)"
```

---

### Task 3: Today empty state — single solid green Schedule CTA

**Files:**
- Modify: `src/components/home/TodayJobCard.tsx`
- Modify (only if needed): `src/i18n/locales/en.json` — reuse existing `home.scheduleJob` / `home.noJobsToday`

**Interfaces:**
- Consumes: existing props `onSchedule`, i18n keys
- Produces: empty state with one solid `#22c55e` CTA (min 44pt height)

- [ ] **Step 1: Replace soft schedule pill with solid primary**

In `TodayJobCard` empty branch, change the Schedule control to match the filled-card primary (solid green, white label), and keep **only** that green CTA on the empty card:

```tsx
if (!job) {
  return (
    <View style={[homeCardStyles.card, styles.emptyCard]}>
      <CalendarBlank size={28} color={colors.textMuted} weight="duotone" />
      <AppText variant="body" style={styles.emptyText}>
        {t('home.noJobsToday')}
      </AppText>
      <Pressable
        style={({ pressed }) => [styles.scheduleBtn, pressed && styles.scheduleBtnPressed]}
        onPress={onSchedule}
        accessibilityRole="button"
        accessibilityLabel={t('home.scheduleJob')}
      >
        <AppText variant="bodySemiBold" style={styles.scheduleBtnText}>
          {t('home.scheduleJob')}
        </AppText>
      </Pressable>
    </View>
  )
}
```

Styles:

```tsx
scheduleBtn: {
  marginTop: spacing.xs,
  minHeight: 44,
  alignSelf: 'stretch',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: spacing.md,
  paddingVertical: 12,
  borderRadius: radii.md,
  backgroundColor: colors.green,
},
scheduleBtnPressed: {
  opacity: 0.9,
},
scheduleBtnText: {
  color: '#ffffff',
},
```

Remove soft `iconTonePalette.green.bg` schedule styles. Do **not** add a second green button on the empty card.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`  
Expected: PASS

- [ ] **Step 3: Manual check**

With no jobs today: empty card shows muted icon + copy + one full-width green Schedule control; tap navigates via existing `onSchedule` → `/jobs/new`.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/home/TodayJobCard.tsx
git commit -m "$(cat <<'EOF'
Make Home empty today CTA a single solid green Schedule button.

EOF
)"
```

---

### Task 4: Reorder Home scroll modules + BlockStagger indices

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `isHomeModuleEnabled`, existing builders (`buildTodayJobCard`, etc.)
- Produces: scroll order matching the spec when defaults are on

**Target order (inside non-search `headerBlock`, after optional sync hint + profile card):**

1. Sync hint (`pendingCount`) — keep first if present  
2. `ProfileCompleteCard` — keep if incomplete  
3. `cta_row` → `HomeCtaRow`  
4. `today_jobs` → `HomeSection` + `TodayJobCard` (+ `alsoToday` `SectionGroup` immediately after when `moreTodayJobs.length > 0`)  
5. `job_readiness` → weather  
6. `ar_alert` → `ArSummaryCard`  
7. `inventory_alert` → alert when data  
8. `month_calendar` → calendar  
9. `upcoming` → upcoming `SectionGroup`  
10. Optional denser modules last when enabled: `invoice_month_carousel`, then `revenue_chart`

- [ ] **Step 1: Reorder JSX blocks**

Move the `today_jobs` / `alsoToday` blocks to sit **immediately after** `cta_row` (and before `job_readiness`). Move `ar_alert` to **after** readiness. Move `inventory_alert` to **before** calendar. Keep carousel/chart after calendar/upcoming (or after upcoming — either is fine as long as they stay last among optional denser modules; preferred: upcoming, then carousel, then chart).

Keep every `isHomeModuleEnabled(homeModules, '…')` gate intact.

- [ ] **Step 2: Re-number `BlockStagger` indices top→bottom**

After reorder, assign contiguous indices `0…n` in visual order so stagger still reads correctly. Example pattern:

```tsx
{pendingCount > 0 ? (
  <BlockStagger index={0}>…</BlockStagger>
) : null}
{profilePercent && !profilePercent.isComplete && !isScreenshotMode() ? (
  <BlockStagger index={1}>…</BlockStagger>
) : null}
{isHomeModuleEnabled(homeModules, 'cta_row') ? (
  <BlockStagger index={2}>
    <HomeCtaRow />
  </BlockStagger>
) : null}
{isHomeModuleEnabled(homeModules, 'today_jobs') ? (
  <BlockStagger index={3}>
    <HomeSection label={t('home.todaysJobs')}>
      <TodayJobCard … />
    </HomeSection>
  </BlockStagger>
) : null}
{/* continue 4, 5, … for alsoToday, readiness, AR, inventory, calendar, upcoming, carousel, chart */}
```

Fixed indices that skip when a module is off are OK (stagger delay gaps are fine). Do not invent dynamic index state unless needed.

- [ ] **Step 3: Confirm loading keeps greeting**

Leave structure as:

```tsx
<OperatorScreen customHeader={greetingHeader}>
  {loading ? (
    <ScreenLoading variant="home" />
  ) : error ? (
    …
  ) : (
    <ScrollView>…</ScrollView>
  )}
</OperatorScreen>
```

Do not wrap/hide `customHeader` during load. Do not set a full-screen spinner variant for Home.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`  
Expected: PASS

- [ ] **Step 5: Manual checklist**

- Defaults on: CTA → Today → Readiness → AR → (inventory if any) → Calendar → Upcoming  
- Settings toggle off `today_jobs`: today section gone; others remain  
- Search mode unchanged  

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "$(cat <<'EOF'
Reorder Home modules so today's jobs surface earlier.

EOF
)"
```

---

### Task 5: Light Figma spacing pass — header + CTA row

**Files:**
- Modify: `src/components/home/HomeGreetingHeader.tsx`
- Modify: `src/components/home/HomeCtaRow.tsx`

**Interfaces:**
- No new props
- Keep one green primary on CTA row (`Send invoice`); secondary stay surface/border

- [ ] **Step 1: `HomeCtaRow` spacing**

Ensure wrap gap uses token spacing (`gap: spacing.sm` or `10` → prefer `spacing.sm` / consistent `10` only if already intentional). Primary button: `minHeight: 44`, `borderRadius: radii.md` (align with shared card radius) **or** keep `radii.sheet` if primary CTA should stay slightly rounder than cards — pick **`radii.md`** for consistency with Wave 1 chrome. Secondary buttons: same radius, surface + hairline border if not already.

Do not add a second green button.

- [ ] **Step 2: `HomeGreetingHeader` polish**

Tighten title/date hierarchy only: keep existing icons/routes. Use `spacing` tokens for row gaps if magic numbers exist. Do not change navigation targets or add badges beyond existing pipeline/settings dot.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`  
Expected: PASS

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/home/HomeCtaRow.tsx src/components/home/HomeGreetingHeader.tsx
git commit -m "$(cat <<'EOF'
Polish Home greeting and CTA spacing to match operator chrome.

EOF
)"
```

---

### Task 6: Wave 1 verification gate

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`  
Expected: exit 0

- [ ] **Step 2: Manual / smoke matrix**

| Case | Expect |
|------|--------|
| Jobs today | Today card filled; Open job solid green; Directions secondary |
| No jobs today | Empty card + one solid Schedule CTA |
| Profile incomplete | Profile card still above CTA |
| Module toggles | Disabled modules hidden |
| Loading | Greeting header visible; `HomeScreenSkeleton` below |
| Search | Existing search UI unchanged |

- [ ] **Step 3: Optional visual audit**

If Home snapshots exist and layout shifted materially:

Run: `npm run visual-audit`  
Only run `--update-snapshots` if the user explicitly wants snapshot refresh.

- [ ] **Step 4: Mark Wave 1 done in chat**

Report: files touched, order change summary, any follow-ups deferred to Wave 2 (refresh flash / settings cache) or Wave 3 (full Figma pixel pass).

---

## Out of scope (do not implement in this plan)

- Wave 2: `tick` refresh without full `loading` flash; settings cache for calendar; tighter timeouts  
- Wave 3: new widgets; full Figma Make pixel parity; snapshot mass updates  
- MagicPath / shadcn / Webflow  
- Changes to `apps/api` or bottom nav shell

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Shared card chrome / radii / padding | 1–2 |
| One green CTA per block; Schedule solid green | 3 (+ CTA row in 5) |
| Scroll order: today earlier; AR after readiness; inventory before calendar | 4 |
| Defaults unchanged; prefs respected | 4 (gates kept) |
| Empty today CTA clear | 3 |
| Loading: header stable + home skeleton | 4 Step 3 |
| Light Figma on header / today / CTA | 3 + 5 |
| No new widgets | Global + out of scope |
| Typecheck verification | 6 |
| Perf deep work | Deferred Wave 2 |
