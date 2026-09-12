<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent workflow (Rinse / detailing-app)

## Workspace

Open the **parent** folder `Detailing/` (multi-root workspace) so Cursor loads global rules from `.cursor/rules/`. Rules in `detailing-app/` alone are not enough for UI/motion/CSS guidance.

## Global Cursor rules (always-on)

These apply every chat session (`alwaysApply: true`):

| Rule | Covers |
|------|--------|
| `floating-labels` | Forms, sheets, pills, page forms |
| `design-motion` | Animation archetypes, `STYLE_PLAN.md`, `MOTION_SPEC.md` |
| `design-systems` | Operator vs client token lanes |
| `ui-styling` | Components, layout, cross-links to other rules |
| `nextjs` | Next.js conventions |

Load on matching files (globs): `css-pattern-owners`, `design-reference`, `a11y-sheets`, `pocketbase-api`.

**Before UI/CSS polish:** read `design-references/STYLE_PLAN.md`, `design-references/MOTION_SPEC.md`, and `docs/ui-css-audit.md`.

## Pre-push gate (local)

`git push` runs Husky **pre-push** → `npm run prepush`:

1. `npm test` (Vitest)
2. E2E smoke (`e2e/site-smoke.spec.ts`) — reuses dev server on `:3000` if up, else `build` + `next start`
3. Playwright reads `.env.local` (needs `PB_URL` / demo credentials for operator routes)

```bash
npm run prepush              # manual run (same as hook)
npm run prepush:full         # smoke + product tour (matches daily E2E job)
PREPUSH_SKIP=1 git push      # emergency bypass
PREPUSH_FORCE_BUILD=1 npm run prepush   # ignore running server, rebuild
```

First-time setup after clone: `npm install` (runs `husky` via `prepare`).

## CI (GitHub Actions)

| Workflow | When | What |
|----------|------|------|
| `ci.yml` | Every PR + push to `main`/`master` | `npm ci`, production build, Vitest, audit |
| `e2e.yml` | Daily (12:00 UTC) + manual dispatch | Playwright smoke + product tour (needs `PB_URL` secret) |

Daily E2E re-run: GitHub Actions → **E2E (smoke + tour)** → **Run workflow**

## Dev notes

- Dev cache outside iCloud: `NEXT_DIST_DIR=/tmp/detailing-app-next` (see `npm run dev`)
- Never commit `.env.local`
