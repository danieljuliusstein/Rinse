# Native visual audit (Playwright)

Screenshot regression for **rinse-mobile** (Expo web) against the manual audit baselines in `screenshots/audit-2026-07-07/`.

This is **not** pixel-perfect design QA — tolerances allow live data (dates, counts, job rows). Use it to catch layout regressions, missing screens, and major drift from the audit captures.

## Prerequisites

```bash
cd rinse-mobile
npm install
npm run visual-audit:install   # Chromium only (Expo web target)
```

`rinse-mobile/.env` must include:

- `EXPO_PUBLIC_PB_URL`
- `EXPO_PUBLIC_TEST_EMAIL` / `EXPO_PUBLIC_TEST_PASSWORD` (dedicated QA org)

## Run

```bash
# Native regression only (17 screens) — default
npm run visual-audit

# Optional loose cross-lane check vs PWA audit stills
npm run visual-audit:pwa

# Both suites
npm run visual-audit:all
```

Reuse an already-running dev server:

```bash
PW_NO_SERVER=1 NATIVE_VISUAL_URL=http://127.0.0.1:8081 npm run visual-audit
```

Capture viewport matches manual audit stills: **1555×1337** (`scale: 'css'`, `deviceScaleFactor: 1` in `playwright.config.mjs`).

## What it tests

| Suite | Baselines | Tolerance |
|-------|-----------|-----------|
| **Native regression** | `screenshots/audit-2026-07-07/native/*.png` | 10% static / 22% dynamic screens |
| **PWA parity (loose)** | `screenshots/audit-2026-07-07/pwa/*.png` | 35% — same route, different renderer |

Screens are listed in `e2e/audit-manifest.ts`. Detail routes skip automatically if the test org has no job/client/invoice.

## Updating baselines

1. Review diffs in `npm run visual-audit:ui` or `playwright-report/`.
2. When the new UI is correct, refresh baselines:
   ```bash
   npm run visual-audit:update        # native/
   npm run visual-audit:update:pwa    # pwa/ (optional)
   ```
3. Commit updated PNGs under `screenshots/audit-2026-07-07/`.

Snapshot names must be **flat filenames** (e.g. `01-home.png`) — Playwright sanitizes `/` in snapshot names.

## Related checks

| Script | Purpose |
|--------|---------|
| `npm run native-smoke` | Logic/copy regressions (no browser) |
| `npm run motion-smoke` | Interaction timing — FAB, sheets, list stagger ([native-motion-qa.md](./native-motion-qa.md)) |
| `npm run sync-qa` | PocketBase sync integration |
| `npm run prepush` (parent) | PWA Playwright smoke — not native visuals |

## CI (optional)

Not wired to GitHub Actions yet. Config lives in `playwright.config.mjs` (ESM — avoids Expo TS/CJS conflicts). For CI, set `CI=1`, run `npm run web -- --port 8081` in background or use `webServer` in the config, and store baselines as repo artifacts.
