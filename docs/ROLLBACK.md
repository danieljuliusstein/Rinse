# Rollback cards (keep old remotes 72h)

Old GitHub remotes stay **pushable and unarchived** until at least **2026-09-14** (72h after import):

- `danieljuliusstein/detailing-CRM`
- `danieljuliusstein/detailing`
- `danieljuliusstein/Rinse-App`

Local mirrors: `~/Backups/rinse-monorepo-20260911-2330/`

| Symptom | Do this |
|---------|---------|
| Desk 404 / bad deploy | Vercel `detailing-crm` / `detailing-landing` → Redeploy previous production; or reconnect Git to `detailing-CRM` |
| API/book/portal broken | Vercel `detailing` → Redeploy previous; or reconnect Git to `detailing`, Root `.` |
| Mobile login fails after EAS relink | Point EAS back at `Rinse-App` |
| `@rinse/core` missing | Restore `packages-core.tgz` from backup into `packages/core` |
| Lost history | Clone from mirror under `~/Backups/rinse-monorepo-20260911-2330/*.git` |

Never roll back Fly PocketBase data for a frontend git mistake.

When ready to archive (after 72h + green smoke), replace each old repo README with the files in `archive/old-repo-readmes/` and use GitHub **Archive repository**.
