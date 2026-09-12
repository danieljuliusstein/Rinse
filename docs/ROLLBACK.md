# Rollback cards (keep old remotes 72h)

## Monorepo import (desk / api / mobile)

Old GitHub remotes stay **pushable and unarchived** until at least **2026-09-14** (72h after import):

- `danieljuliusstein/detailing-CRM`
- `danieljuliusstein/detailing`
- `danieljuliusstein/Rinse-App`

Local mirrors: `~/Backups/rinse-monorepo-20260911-2330/`

## Landing import (`rinse-landing`)

Old remote stays **pushable and unarchived** until at least **2026-09-15** (72h after landing reconnect):

- `danieljuliusstein/detailing-landing`

Local mirrors: `~/Backups/rinse-landing-merge-20260912-0439/`

| Symptom | Do this |
|---------|---------|
| Apex marketing broken after reconnect | Vercel `detailing-landing` → Redeploy previous production; or reconnect Git to `detailing-landing`, Root `.` |
| Desk 404 / bad deploy | Vercel `detailing-crm` → Redeploy previous production; or reconnect Git to `detailing-CRM` |
| API/book/portal broken | Vercel `detailing` → Redeploy previous; or reconnect Git to `detailing`, Root `.` |
| Mobile login fails after EAS relink | Point EAS back at `Rinse-App` |
| `@rinse/core` missing | Restore `packages-core.tgz` from backup into `packages/core` |
| Lost landing history | Clone from `~/Backups/rinse-landing-merge-*/detailing-landing.git` |
| Lost other history | Clone from mirror under `~/Backups/rinse-monorepo-20260911-2330/*.git` |

Never roll back Fly PocketBase data for a frontend git mistake.

When ready to archive (after 72h + green smoke), replace each old repo README with the files in `archive/old-repo-readmes/` and use GitHub **Archive repository**.
