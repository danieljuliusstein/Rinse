# Design references

ScreenDesigns replay exports used as the visual/motion north star for Rinse UI polish.

**Source platform:** [ScreenDesigns](https://screendesigns.com) — app designs, reviews, and animation replays.

## Apps in this folder

| App | Folder | Frames | Notes |
|-----|--------|--------|-------|
| Invoice Fly | `invoice-fly/` | 218 webp | Primary reference — iOS invoice/bookkeeping app |

## How to use in Cursor

- `@design-references/invoice-fly` — attach the whole set
- `@design-references/invoice-fly/invoice-maker-invoice-fly_274888.webp` — single frame
- Open a `.css` or `.tsx` file so the `design-reference` Cursor rule activates

## Adding a new app from ScreenDesigns

1. Export replays from ScreenDesigns
2. Copy webp/png frames into `design-references/{app-slug}/`
3. Add a `README.md` inside that folder with screen names and frame ID ranges
4. Add a row to the table above

## Related docs

- [`STYLE_PLAN.md`](./STYLE_PLAN.md) — motion & operator polish (Waves 40–56 ✅)
- [`SETUP_UX_PLAN.md`](./SETUP_UX_PLAN.md) — setup funnel layout pass (Waves 1–14 ✅ · Wave 15 or 17 next)
- [`SETUP_UX_DESIGN_PROMPT.md`](./SETUP_UX_DESIGN_PROMPT.md) — Claude prompt for visual mockups (Waves 2–12)
- [`MOTION_SPEC.md`](./MOTION_SPEC.md) — 12 animation archetypes + spec template
- [`../docs/ui-css-audit.md`](../docs/ui-css-audit.md) — CSS pattern owners
- [`../src/app/tokens.css`](../src/app/tokens.css) — design tokens (already IF-inspired surfaces)
