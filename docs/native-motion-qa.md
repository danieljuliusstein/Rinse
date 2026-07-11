# Native motion QA (light automation)

Behavioral smoke for **interaction timing** on Expo web — not pixel-perfect motion regression.

Complements:

| Check | Covers |
|-------|--------|
| `npm run visual-audit` | Static layout vs audit stills |
| `npm run motion-smoke` | FAB / sheet / list **open-close lifecycle** within motion token windows |
| `npm run native-smoke` | Copy, routing, business logic (no browser) |
| Device QA | True Reanimated feel, haptics, spring on iOS |

## Run

```bash
cd rinse-mobile
npm run motion-smoke
```

Reuse a running dev server:

```bash
PW_NO_SERVER=1 NATIVE_VISUAL_URL=http://127.0.0.1:8081 npm run motion-smoke
```

## What it asserts

| Test | Archetype | Pass criteria |
|------|-----------|---------------|
| Quick actions open/close | `sheet-enter` + row stagger | Menu springs up, rows stagger in, backdrop / drag dismisses |
| `/jobs/new` sheet | `sheet-enter` / exit | Title + close affordances; panel uses spring slide (drag handle dismisses on device) |
| `/jobs` list | `list-stagger` | Data visible after stagger window |
| Reduced motion | a11y | `prefers-reduced-motion: reduce` still opens FAB |

Sheets use Reanimated `withSpring` (`motion.spring` / `motion.snappy`) for the panel; scrim stays timed (`fadeMs` / `fastMs`). Drag-to-dismiss uses RN `PanResponder` on the handle/header (avoids RNGH Fabric `install()` on stale native binaries). Timing mirrors below remain the smoke budgets, not the spring curve.

Timing mirrors PWA `tokens.css` (`280ms` sheet/scrim, `50ms` stagger steps).

## Optional frame capture

For manual review of mid-animation frames (not diffed in CI):

```bash
npm run motion-smoke:capture
```

Writes PNG strips to `screenshots/motion-samples/{flow}/`. Add that folder to `.gitignore` if you do not want local captures committed.

## Limits

- Runs on **Expo web + Chromium**, not native Reanimated on device.
- Does not measure spring curves or haptics — use simulator + `MOTION_SPEC.md` for polish sign-off.
- Not wired to CI yet; fast enough (~30s) for local pre-push optional gate.
