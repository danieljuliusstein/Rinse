# Wave 5C — Route Order + Weather Reschedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drag-reorder today’s jobs with persisted `route_order`, and rain-day reschedule from Home weather readiness (checkboxes, new date, SMS, `weather_hold`).

**Architecture:** Day lists sort by `route_order` then `start_time`. Route mode is a Jobs-day (and Home today) enhancement, not a new tab. Weather extends existing readiness API/card; bulk PATCH job dates + `weather_hold`; SMS via existing messages templates.

**Tech Stack:** Expo, gesture/drag list (reuse project drag pattern if any; else Pressable reorder up/down MVP if drag lib absent — prefer drag to match Make), Twilio SMS templates, weather readiness.

**Spec:** `docs/superpowers/specs/2026-07-24-wave5-crm-design.md`  
**Depends on:** Plan A (job fields). Make reference: `JobsScreen` routeMode, `WeatherSheet`.

## Global Constraints

- No new tab; no full GIS map strip required in MVP (optional later)
- Drive subtitle: schedule pad and/or `POST /api/drive-time` (static)
- Commits only when user asks

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/jobs-list-logic.ts` / `home-dashboard.ts` | Sort by `route_order` |
| Jobs day screen + `HomeDayJobsPanel` | Route mode UI + save |
| `src/lib/api.ts` / jobs API | Batch update `route_order` |
| `WeatherReadinessCard.tsx` | Reschedule CTA |
| `src/components/home/WeatherRescheduleSheet.tsx` | **Create** |
| `src/lib/messages-api.ts` / templates | Reschedule SMS copy |
| Job badges | `weather_hold` → Weather Hold |

---

### Task 1: Sort + persist route_order

- [ ] **Step 1:** Update day-job sort helpers to `route_order ASC NULLS LAST`, then `start_time`
- [ ] **Step 2:** Route mode toggle on Jobs day; show sequence index + drag handles (or reorder controls)
- [ ] **Step 3:** Save writes sequential `route_order` 1..n for that date’s jobs
- [ ] **Step 4:** Empty state copy when no jobs today
- [ ] **Step 5:** Typecheck

---

### Task 2: Drive-time subtitle

- [ ] **Step 1:** For consecutive stops, call existing `/api/drive-time` or fall back to `drive_time_pad_minutes` from settings
- [ ] **Step 2:** Subtitle like `12 min drive` (static source)

---

### Task 3: Weather reschedule sheet

- [ ] **Step 1:** When `hasWeatherRisk`, show Reschedule day on `WeatherReadinessCard`
- [ ] **Step 2:** Sheet lists today’s outdoor/mobile jobs with checkboxes; date chips; SMS preview
- [ ] **Step 3:** Send → update job `date`, set `weather_hold=true`, send SMS; Skip closes
- [ ] **Step 4:** Badge on job cards when `weather_hold`
- [ ] **Step 5:** Typecheck + manual smoke on Home with risk fixture

Next: `2026-07-24-wave5-d-team-addons.md`
