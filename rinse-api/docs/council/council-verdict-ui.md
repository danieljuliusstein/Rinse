# LLM Council Verdict — Detailing App UI & Design System

**Source:** External LLM Council (Chairman synthesis)  
**Prompt:** `council-prompt-ui.md`

---

## Executive Summary

Forced uniformity across all surfaces is undesirable. Operator (dark, efficiency) vs client (light, trust, conversion) should stay distinct. The real problem is **token fragmentation**, ambiguous CSS ownership, and inconsistent patterns within and between systems.

**Strategic decisions:**
1. Keep three visual systems: Operator Dark, Client Light (unified), Sheet sub-language
2. Unify core tokens — especially greens, spacing, fonts on client surfaces
3. Fix critical UX (booking date/time, orphan route discoverability)
4. Build toward a shared component library

---

## 1. Unified Design Direction

### Operator Dark
- Routes: `/`, `/jobs/*`, `/clients/*`, `/reports`, `/inventory`, `/settings/*`, `/messages`, `/quotes/*`, `/invoices`, `/auth`, `/onboarding`, `/privacy`, `/offline`
- Standardize all greens to **`#22c55e`** (globals)
- Consolidate `--bg-base`, `--bg-surface`, `--bg-card`, `--border` — kill app-ui overrides
- Max width: **390px** (430px for auth/onboarding)

### Client Light (unified)
- Routes: `/portal/[token]`, `/book/[slug]`
- Merge `portal.css` + `book.css` → shared `client-light.css`
- Background: `--portal-bg: #fafafa` base; `#f7f7f5` as warmer raised surface where needed
- Accent: **`#22c55e`** everywhere (remove booking `#16a34a`)
- Fonts: **Syne** headings/CTAs, **DM Sans** body (portal currently system-ui)
- Max width: **430px** for both portal and book
- Semantic tokens to enable future per-org branding

### Sheet sub-language
- Keep iOS-adjacent dark sheets; inverted `.inv-sheet-save` is OK
- Derive `#1c1c1c` from core dark modal token

---

## 2. Top 5 Cross-App Improvements

| # | Item | Effort |
|---|------|--------|
| 1 | Standardize green to `#22c55e` | 8h |
| 2 | Fix booking step 2 date/time UX — kill static clock box | 16h |
| 3 | Unify client light themes + fonts → `client-light.css`, 430px | 24h |
| 4 | Wire `/messages` — Dashboard header icon | 4h |
| 5 | Refactor QuickAddJob to operator tokens (not isolated `#1e1e1e` / `#3dc97a`) | 12h |

---

## 3. Per-Surface Priorities

**Polish:** Dashboard KPIs, Jobs filter chips, Inventory hierarchy, Settings booking card, Reports money-hero

**Leave:** Operator dark identity, sheet sub-language

**Redesign:** Booking step 2, QuickAddJob footer → `.btn-primary` / `.btn-ghost`

---

## 4. Stop List

- Inconsistent greens across CSS files
- Isolated token sets per workflow (QuickAddJob)
- Invisible overlay date/time inputs
- Delete: `home/home.css`, JobsRevenueChart CSS
- Audit globals vs app-ui duplicates (`.clients-*` vs `.client-card`)
- Wire orphans: `/messages` (dashboard), `/quotes` + `/invoices` (contextual + FAB)

---

## 5. IA / Navigation

- Bottom nav unchanged: Home, Jobs, FAB, Clients, Money
- FAB expand: New Quote, View Messages
- BackButton standardized everywhere
- Quotes/invoices via JobDetail, ClientDetail, Reports — not nav tabs

---

## 6. First Prototype

**Unified Client Booking Flow** (`/book/[slug]`) — 3–5 days

- Apply unified client-light.css
- Redesign step 2: integrated date + slot picker, no fake clock box
- Streamline 3-step flow UX (not full 1-step yet)
- Confirm CTA uses unified green

---

## 90-Day Roadmap

### Phase 1 (Weeks 1–4): Foundation & critical UX
- W1: Green standardization + CSS audit/delete
- W2: Messages icon + FAB updates + QuickAddJob tokens
- W3–4: Booking prototype + feedback

### Phase 2 (Weeks 5–8): Consolidation & polish
- W5: Portal client-light unification + BackButton
- W6: QuickAddJob footer + Dashboard polish
- W7: Jobs list + quotes/invoices contextual links
- W8: Sheet save consistency + a11y audit

### Phase 3 (Weeks 9–12): Optimization
- W9: Inventory + Settings
- W10: Reports + empty states
- W11–12: Component library extraction + cross-browser testing

---

*Full chairman narrative preserved from council session.*
