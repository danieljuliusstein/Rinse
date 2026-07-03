# Motion spec

How to describe and implement animations without pasting motion into chat.
Reference frames: `invoice-fly/` (ScreenDesigns replays).

---

## How to use in Cursor

1. Scrub sequential frames in `invoice-fly/` (IDs are ordered)
2. Pick **start / mid / end** frames (3–5 files)
3. `@`-attach them in chat, OR cite frame IDs
4. Name the **archetype** from the table below
5. Fill a spec row (template at bottom) when tagging new flows

---

## 12 archetypes

| Archetype | Typical properties | Duration | Easing | Extend in |
|-----------|-------------------|----------|--------|-----------|
| `sheet-enter` | `translateY(100%→0)`, scrim `opacity 0→1` | 250–320ms | spring | `globals.css` `inv-sheet-up` |
| `sheet-exit` | reverse of enter, often faster | 180–220ms | ease-in | `globals.css` |
| `list-stagger` | children `opacity`, `translateY(8px→0)`, staggered delay | 200–280ms each | ease-out | `pipeline.css` `pipeline-stage-in` |
| `press-depth` | `scale(0.97–0.98)`, bg → `--bg-surface-active` | 100–150ms | ease | `globals.css` `.card-pressable` |
| `pill-spring` | `scale(0.9→1)` with overshoot | 250–300ms | pop | `premium-sheet.css` `form-pill-pop` |
| `progress-fill` | `width 0→N%` | 300–500ms | ease-out | `premium-sheet.css` progress bars |
| `success-pop` | checkmark `scale`, brief green flash | 300–400ms | pop | `premium-sheet.css` `.sheet-submit--done` |
| `tab-active` | icon `scale(1→1.1)` or dot slide | 150–200ms | spring | `globals.css` bottom-nav |
| `swipe-reveal` | row `translateX`, actions fade in | 200ms | ease-out | `SwipeableRow`, `InvoiceSwipeableRow` |
| `empty-enter` | illustration + text fade up | 350–450ms | ease-out | `components.css` empties |
| `counter` | number roll / count-up | 400–600ms | ease-out | _not yet — KPI cards_ |
| `attention-pulse` | subtle `opacity` or `scale` loop | 1.5–2s loop | ease-in-out | `pipeline.css`, `rinse-tour.css` |

### Spring / pop curves (iOS-style)

```css
/* spring — sheets, tab active */
cubic-bezier(0.32, 0.72, 0, 1)

/* pop — pills, success */
cubic-bezier(0.34, 1.56, 0.64, 1)

/* step enter — onboarding */
cubic-bezier(0.22, 1, 0.36, 1)
```

Add these as tokens in `tokens.css` when implementing foundation phase.

**Wave 40:** Tokens live in `src/app/tokens.css` — use `var(--ease-spring)` etc. in new CSS.

---

## Reduced motion

Every new animation must include:

```css
@media (prefers-reduced-motion: reduce) {
  /* animation: none; or instant opacity/transform */
}
```

See `rinse-tour.css` and `globals.css` for existing patterns.

---

## Motion intensity by surface

| Surface | Stagger? | Spring? | Notes |
|---------|----------|---------|-------|
| Settings | No | Light | Row press only |
| Home / lists | Yes | Medium | Stagger on load |
| Sheets | No | Yes | Spring enter + scrim |
| Onboarding | Step-based | Yes | Hero moments on success |
| Client book/portal | Step-based | Medium | Separate `--cl-*` tokens |

---

## Spec template

Copy one block per flow you tag in `invoice-fly/README.md`:

```markdown
### [Screen name]

- **Frame range:** 274877–274890
- **Archetype:** sheet-enter
- **Trigger:** tap FAB
- **What moves:** sheet slides up; scrim fades 0→40%
- **Feel:** iOS spring, ~280ms, slight settle at end
- **Rinse target:** BottomSheet / inv-sheet
- **Owner file:** globals.css
- **Status:** shipped (Wave 41) | planned | shipped
```

---

## Logged specs

_Phase 0 mapped 2026-07-02. Full index: `invoice-fly/README.md`._

### Hero 1 — Send invoice sheet ⭐ Wave 41

- **Frame range:** 275001–275006 (scrub sequential)
- **Archetype:** sheet-enter
- **Trigger:** tap Send on invoice preview
- **What moves:** action sheet slides up; scrim fades 0→~40%; FAB mic visible above sheet
- **Feel:** iOS spring, ~280ms, slight settle
- **Rinse target:** `BottomSheet`, `.inv-sheet-root`, send dock on job invoice
- **Owner file:** `globals.css`
- **Status:** tagged

### Hero 2 — Invoices dashboard ⭐ Wave 43/46

- **Frame range:** 275146–275151
- **Archetype:** list-stagger, counter
- **Trigger:** navigate to Invoices tab/screen
- **What moves:** KPI card + chart fade up; invoice rows stagger in; unpaid badge color
- **Feel:** gentle ease-out, 50ms stagger between rows
- **Rinse target:** `/invoices`, home KPI blocks
- **Owner file:** `app-ui.css`, `components.css`
- **Status:** shipped (Wave 46 — invoices list + swipe; job invoice send toast)

### Hero 3 — Account created success ⭐ Wave 48

- **Frame range:** 274896–274901
- **Archetype:** success-pop
- **Trigger:** onboarding account creation complete
- **What moves:** checkmark scale pop; confetti dots burst; invoice preview card above
- **Feel:** pop easing, ~400ms
- **Rinse target:** onboarding first-invoice / welcome completion
- **Owner file:** `onboarding.css`
- **Status:** shipped (Wave 48 — `onboarding-account-hero` on your-invoice step)

- **Frame range:** 275179–275179 (open) + prior frames for enter
- **Archetype:** sheet-enter
- **Trigger:** tap Voice settings row
- **What moves:** half-height sheet; scrim dims settings; selected row checkmark
- **Feel:** spring, ~300ms
- **Rinse target:** `VaulSheet` / light picker sheets in settings
- **Owner file:** `globals.css`, `settings.css`
- **Status:** shipped (Wave 41 — scrim; vaul handles slide)

### Hero 5 — Logo upload progress ⭐ Wave 48

- **Frame range:** 274886–274890
- **Archetype:** progress-fill, success-pop
- **Trigger:** complete logo upload step
- **What moves:** progress bar fills; COMPLETE badge pops; logo card preview
- **Feel:** progress 400ms ease-out; badge pop 300ms
- **Rinse target:** onboarding business logo sub-step
- **Owner file:** `onboarding.css`
- **Status:** shipped (Wave 48 — `onboarding-logo-progress` + COMPLETE badge)

- **Frame range:** 274921–274926
- **Archetype:** attention-pulse
- **Trigger:** first new invoice tutorial
- **What moves:** dim overlay; tooltip bubble + green arrow to “Add client”
- **Feel:** tooltip fade+slide, pulsing highlight on CTA
- **Rinse target:** first job/invoice empty state coachmark
- **Owner file:** `components.css`
- **Status:** tagged

### Voice to invoice recording — Wave 41/53

- **Frame range:** 275040–275047
- **Archetype:** attention-pulse
- **Trigger:** open voice invoice sheet, recording active
- **What moves:** mic rings pulse; waveform bars animate; example pills horizontal scroll
- **Feel:** 1.5s loop pulse on mic; waveform real-time
- **Rinse target:** future voice feature or FAB mic — defer unless product ships voice
- **Owner file:** —
- **Status:** tagged (defer)
