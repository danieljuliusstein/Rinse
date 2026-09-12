# Connection smoke checklist

Run after production Git reconnect (or against preview URLs first).

- [x] Landing (`https://rinsehq.com`) loads marketing hero
- [x] Landing Sign in → `https://desk.rinsehq.com` (DESK_URL in source; hero HTML serves)
- [x] Desk (`desk.rinsehq.com`) loads
- [ ] Desk sign-in against `https://detailing-pb.fly.dev` (manual)
- [ ] Desk can call API (`VITE_APP_API_URL` unchanged) (manual)
- [ ] `https://app.rinsehq.com/book/` — currently 404 after `/book/`→`/book` redirect (pre-existing; not landing cutover)
- [x] Admin / privacy on `app.rinsehq.com` load
- [ ] Cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://<api-host>/api/cron/notifications` (or project’s auth header)
- [ ] Mobile / TestFlight login against same PB + API
- [ ] Stripe / Apple webhook URLs unchanged
- [x] Campaign mail health: `https://rinse-campaign-mail.fly.dev/health`
- [x] PocketBase health: `https://detailing-pb.fly.dev/api/health`

Env **values** must match pre-cutover inventory — only Root Directory / git repo change.

## Cutover run (2026-09-12) — desk / api

| Check | Result |
|-------|--------|
| Desk Vercel → `Rinse` / `rinse-desk` | Connected; production READY |
| API Vercel → `Rinse` / `rinse-api` | Connected; production READY |
| `https://desk.rinsehq.com` | 200 |
| PocketBase health | 200 |
| Campaign mail health | 200 |
| EAS → `Rinse` / `rinse-mobile` | **Pending** — still on `Rinse-App` until manual EAS relink |
| Old desk/api/mobile remotes archived | **No** — wait 72h (see docs/ROLLBACK.md) |

## Landing cutover run (2026-09-12)

| Check | Result |
|-------|--------|
| Landing imported → `Rinse` / `rinse-landing` | Done (subtree + scaffolding) |
| Landing Vercel → `Rinse` / `rinse-landing` | Connected; production READY (`131c01a`) |
| Root Directory | `rinse-landing` |
| Ignored Build Step | Set (`git diff … ./rinse-landing ./packages/core`) |
| `https://rinsehq.com` | 200 |
| `https://desk.rinsehq.com` | 200 |
| `https://app.rinsehq.com/book/` | **404** after redirect to `/book` (pre-existing API routing; not landing) |
| `https://app.rinsehq.com/admin` | 200 |
| `https://app.rinsehq.com/privacy` | 200 |
| Old remote `detailing-landing` archived | **No** — wait until **2026-09-15** (see docs/ROLLBACK.md); Moved README at `archive/old-repo-readmes/detailing-landing.md` |
