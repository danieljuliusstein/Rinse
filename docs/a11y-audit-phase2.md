# Accessibility Audit — Phase 2 (Sign-off)

**Wave 32 · Updated:** July 2026 (Wave 54 motion + dark depth pass)  
**Scope:** Operator shell, booking, auth, portal pay, sheets/modals  
**Exit criteria:** No P0 a11y blockers on core flows; focus trap + skip link shipped; high-contrast pass on critical paths.

---

## Sign-off summary

| Item | Status | Notes |
|------|--------|-------|
| Skip link → `#main-content` | **Done** | `AppShell.tsx` · `.skip-link` in `components.css` |
| Focus trap — `BottomSheet` | **Done** | `lib/focus-trap.ts` · close button initial focus |
| Focus trap — `VaulSheet` | **Done** | Escape + `role="dialog"` + trap on `.vaul-body` |
| Focus trap — FAB quick menu | **Done** | `QuickActionMenu.tsx` · first action focused |
| Focus trap — job photo lightbox | **Done** | `JobPhotoLightbox.tsx` |
| Live regions — booking errors | **Done** | `role="alert"` + `aria-live="assertive"` |
| Live regions — auth errors | **Done** | `AccountAuth` error/info announcements |
| High-contrast critical paths | **Done** | `a11y-high-contrast.css` (book, auth, portal, CTAs) |
| Dark theme depth parity | **Done** | Wave 54 — `--depth-*` on `.card`, lists, sheets, empties |
| Motion `prefers-reduced-motion` audit | **Done** | Waves 40–53 owners + Wave 54 globals supplement |
| 15-min release smoke script | **Done** | `docs/release-smoke-checklist.md` |

**P0 open issues:** none identified for core flows as of Wave 32.

---

## Fixes applied (cumulative)

| Area | Change |
|------|--------|
| Booking errors | `role="alert"` + `aria-live="assertive"` on `.book-error-banner` |
| Booking step 2 | Removed faux clock control; time selection is slot grid only |
| Booking summary | `aria-live="polite"` on sticky package summary |
| Step 3 collapse | `aria-expanded` on "More options" toggle |
| QuickAddJob | `BackButton` with `aria-label`; footer uses shared `.btn-primary` / `.btn-ghost` (44px+ targets) |
| QuickAddJob errors | `role="alert"` on save errors |
| FAB menu | `role="menu"` / `menuitem`; Escape closes; **focus trap** |
| Dashboard | Messages + Settings icon buttons have `aria-label` |
| Operator shell | Skip link on all operator routes |
| Auth | Error/info live regions; floating labels with `placeholder=" "` |
| VaulSheet | Focus trap + Escape + dialog semantics (Wave 8) |
| BottomSheet | Focus trap + Escape + dialog semantics (Wave 8) |
| Job photo lightbox | Focus trap + `aria-label` + arrow keys |
| High contrast | `prefers-contrast: more` + `forced-colors` overrides |
| Dark depth | `--depth-card-*` / `--depth-elevated-shadow` wired in `globals.css`, `components.css`, `app-ui.css` (Wave 54) |
| Operator HC (dark) | Sheet save, settings save, tour CTA, offline sync — `a11y-high-contrast.css` Wave 54 |

---

## Sheet semantics (intentional)

### Light sheet save buttons

Light sheets use gradient `.sheet-submit--ready` on light chrome. Dark inverted `.inv-sheet-save` remains documented in `globals.css` for legacy inventory paths.

### Bottom sheets

- `BottomSheet`: `aria-label` prop, Escape dismiss, body scroll lock, focus trap
- Drag-to-dismiss handle is visual only; close button has `aria-label="Close"`

---

## Cross-browser QA matrix

Run before each release (see smoke checklist). Mark date + tester initials.

| Flow | Chrome (desktop) | iOS Safari | macOS Safari |
|------|------------------|------------|--------------|
| `/book/{slug}` step 2 — date + slots | ☐ | ☐ | ☐ |
| `/book/{slug}` step 3 — submit booking | ☐ | ☐ | — |
| `/auth` sign-in + error announce | ☐ | ☐ | ☐ |
| QuickAddJob save + expenses footer | ☐ | ☐ | — |
| FAB → 6 quick actions + Escape | ☐ | ☐ | ☐ |
| Bottom nav + skip link (Tab once) | ☐ | ☐ | ☐ |
| Portal invoice — view + pay CTA | ☐ | ☐ | — |
| Portal photos lightbox | ☐ | ☐ | — |
| Invoice detail — Send dock | ☐ | ☐ | — |

---

## High-contrast verification

With **Increase Contrast** enabled (macOS) or **prefers-contrast: more**:

1. Booking primary CTA has visible border (not color-only)
2. Auth form focus ring visible on email/password
3. Error banners have border + readable text
4. Portal Pay online button has border
5. Operator dark theme: cards/lists use visible border (not shadow-only depth)
6. Sheet save + settings save buttons have border in high contrast
7. Product tour spotlight ring visible with Increase Contrast on

CSS: `src/app/a11y-high-contrast.css`

---

## Deferred (non-P0)

- Full WCAG 2.2 AA audit with automated scanner (axe) on every screen
- Screen reader walkthrough of Reports charts (complex data viz)
- Operator dark-mode high-contrast variant (product decision: light default) — **partial:** Wave 54 adds dark HC borders on operator CTAs; full dark QA matrix still optional
- OCR receipt flow a11y (Wave 26 — camera input labeled; manual line entry)

---

## Related docs

- [Release smoke checklist](./release-smoke-checklist.md) — 15-minute pre-release script
- [UI CSS audit](./ui-css-audit.md) — pattern ownership
