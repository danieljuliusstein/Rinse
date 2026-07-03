# UI CSS Audit

Owner map for shared patterns across the detailing app. Use this when adding surfaces or consolidating CSS.

**Last updated:** Wave 17 (CSS consolidation)

---

## Design systems

| System | Scope | Token source |
|--------|-------|--------------|
| Operator Light | `/`, `/jobs`, `/clients`, sheets, FAB | `tokens.css` → `globals.css` `:root` + `app-ui.css` |
| Client Light | `/book/*`, `/portal/*` | `client-light.css` → `--cl-*` |
| Sheet sub-language | Bottom sheets, quick actions, supply picker | `globals.css` inv-sheet blocks + `premium-sheet.css` |

**Accent green:** `#22c55e` via `--green` / `--green-text`. Inventory OK state keeps `--inv-ok: #3dc97a` (semantic, not UI accent).

---

## Pattern owners

### `.card` — generic elevated surface

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `globals.css` | Base `.card`, `.card-pressable`; used settings advanced, damage docs |
| Extend | `settings.css`, `damage.css` | Page-scoped overrides only |

**Do not** duplicate full card rules in feature CSS; extend `.card`.

---

### `.job-card` — job list rows

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.job-card`, hover, home variant `.job-card--home` |
| Status | `app-ui.css` | `.job-card .badge-status` |
| **Not** | `globals.css` | No `.job-card` in globals |

Used by: `JobsList`, `Dashboard` (`HomeJobRow`).

---

### `.client-card` — client list rows

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.client-card`, `.client-card.vip`, `.client-card-main` |
| Menu | `globals.css` | `.client-card-menu-*` (popover actions) |

Legacy `.clients-screen` wrapper removed (Wave 17). List screens use `screen page-content body` only.

Used by: `ClientsList`, `ClientDetail` related lists.

---

### `.bottom-nav` — operator shell navigation

| Owner | File | Notes |
|-------|------|-------|
| **Canonical** | `globals.css` | Full layout, FAB, safe-area, animations |
| **Overrides** | `embed.css`, `product-tour.css` | Embed hide, tour dim only |

Used by: `BottomNav.tsx`.

---

### `.page-header` — screen title row

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.page-header`, `h1`, `h1.lg`, subtitle `p`, `--compact`, `__title-block` |
| Actions | `app-ui.css` | `.page-header-actions`, `.icon-btn` beside header |
| Header buttons | `components.css` | `.page-header__action` (compact screens) |

Used by: `Dashboard`, `JobsList`, `ClientsList`, `Reports`, settings, pipeline, CRM, messages, etc.

**Screen shell:** Prefer `screen page-content body` with no feature-specific wrapper class unless the feature CSS file defines layout rules for it (e.g. `.money-screen`, `.inventory-section`).

---

### Sheet forms

| Owner | File | Notes |
|-------|------|-------|
| Shell | `globals.css` | `.inv-sheet-*`, `.inv-supply-picker-*` |
| **Light operator forms** | `light-sheet.css` | `BottomSheet variant="light"` (default) — all operator sheets |
| **Dark premium** | `premium-sheet.css` | Legacy layout class names only; dark chrome deprecated |
| Submit | `premium-sheet.css` + `light-sheet.css` | `.sheet-submit`, `.sheet-footer` |
| Fields | `floating-labels.css` + `@/components/forms` | `FloatingField`, `PillGroup` |

**Wave 19–20:** All operator `BottomSheet` surfaces use light chrome. Invoice client signatures: `signature_url` + `signed_at` on portal/PDF/preview.

Legacy `.inv-field-*` removed (Wave 17). Supply picker retained.

---

### Settings hub

| Owner | File | Notes |
|-------|------|-------|
| Hub layout | `settings.css` | `.settings-hub`, `.settings-panel`, `.settings-menu-trailing` |
| Hub rows | `@/components/ui` `ListRow` via `SettingsMenuListRow` | Icon tones from `ListRow` |
| Badges | `app-ui.css`, `settings-progress.css` | `.settings-menu-profile-badge`, `.settings-menu-milestone-badge` |

Legacy `.settings-menu-item` / `.settings-row-link` removed (Wave 17).

---

## Removed / dead

| Item | Resolution |
|------|------------|
| `home/home.css` | **Deleted** with unrouted `HomeScreen.tsx` (Phase 1) |
| `JobsRevenueChart.tsx` | **Deleted**; `lib/jobs-revenue.ts` kept (Phase 1) |
| Stray greens `#16a34a`, `#4caf50` | Replaced with tokens; guarded by `css-accent-guard.test.ts` |
| `.inv-field-*`, `.inv-select-wrap`, `.inv-input-affix`, `.inv-status-*` | **Deleted** — use floating labels (Wave 17) |
| `.clients-screen`, `.messages-screen`, `.crm-screen`, `.pipeline-screen`, `.quotes-screen` | **Deleted** — empty wrappers (Wave 17) |
| `.settings-menu-item`, `.settings-row-link` | **Deleted** — hub uses `ListRow` (Wave 17) |
| `globals.css` `.clients-*` list utilities | **Removed** — only `.client-card-menu-*` remains |

---

## Deferred / intentional

- `.inv-sheet-save` / `.inv-sheet-cancel` in `globals.css` — legacy inverted buttons; new sheets use `.sheet-submit`. Remove when confirmed no external HTML depends on them.
- `src/components/ui/*` — adopt incrementally in new screens (ongoing)
