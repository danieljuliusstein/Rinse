# Wave 5 UI Reshape Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Business hub (Reports top + all settings), Make-aligned Jobs/detail/share/weather sheets, compact styling.

**Architecture:** Move P&L UI to `app/reports/pl.tsx`; rewrite `reports.tsx` as hub. Jobs filter by `tech_roster` + Route mode. Restyle JobDetailBody, TipsSheet/Share, WeatherRescheduleSheet.

**Tech Stack:** Expo Router, RN StyleSheet, existing ui components, Wave 5 prefs/fields.

**Spec:** `docs/superpowers/specs/2026-07-24-wave5-ui-reshape-design.md`

## Global Constraints

- Operator light tokens only; no web `div`/`className`
- Commits only when user asks
- Verify: `npm run typecheck` on touched paths

## File map

| File | Responsibility |
|------|----------------|
| `app/reports/pl.tsx` | **Create** — current Business charts UI |
| `app/(tabs)/reports.tsx` | Rewrite as Business hub |
| `app/(tabs)/jobs/index.tsx` | Tech chips, Route mode, compact cards |
| `src/components/detail/JobDetailBody.tsx` | Compact card stack + Share CTA |
| `src/components/invoice/SharePayLinkSheet.tsx` | **Create** — Make share/tips sheet |
| `src/components/home/WeatherRescheduleSheet.tsx` | Rain Day Make layout |
| `src/lib/business-hub.ts` | **Create** — hub row defs + live subtitles helpers |

---

### Task 1: Business hub + P&L drill-in

- [ ] Move charts from `reports.tsx` → `app/reports/pl.tsx` (ScreenShell + back)
- [ ] Rewrite `reports.tsx` as sectioned ListRows (Reports / Invoicing / Operations / Settings)
- [ ] Wire settings-menu items + Wave 5 rows (policies, team, addons, crm-extras)
- [ ] Typecheck

### Task 2: Jobs tech filter + Route

- [ ] Load `tech_roster`; chips All/You/techs + add → Team
- [ ] Route toggle; numbered ↑↓; persist `route_order`
- [ ] Compact card: assignee, deposit, drive, weather hold
- [ ] Typecheck

### Task 3: Job detail compact

- [ ] Vehicle / service rows / deposit / photos / Share Pay Link CTA
- [ ] Typecheck

### Task 4: Share Pay Link + Rain sheets

- [ ] SharePayLinkSheet Make layout; wire from detail CTA
- [ ] WeatherRescheduleSheet Make layout (banner, preview, dual CTAs)
- [ ] Typecheck
