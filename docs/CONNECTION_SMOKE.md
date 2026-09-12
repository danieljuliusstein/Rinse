# Connection smoke checklist

Run after production Git reconnect (or against preview URLs first).

- [ ] Landing (`https://rinsehq.com`) loads marketing hero
- [ ] Landing Sign in → `https://desk.rinsehq.com`
- [ ] Desk (`desk.rinsehq.com`) loads
- [ ] Desk sign-in against `https://detailing-pb.fly.dev`
- [ ] Desk can call API (`VITE_APP_API_URL` unchanged)
- [ ] `https://app.rinsehq.com/book/{slug}` (or live book host) loads
- [ ] Portal token route loads on `app.rinsehq.com`
- [ ] Cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://<api-host>/api/cron/notifications` (or project’s auth header)
- [ ] Mobile / TestFlight login against same PB + API
- [ ] Stripe / Apple webhook URLs unchanged
- [ ] Campaign mail health: `https://rinse-campaign-mail.fly.dev/health`

Env **values** must match pre-cutover inventory — only Root Directory / git repo change.

## Cutover run (2026-09-12) — desk / api

| Check | Result |
|-------|--------|
| Desk Vercel → `Rinse` / `rinse-desk` | Connected; production READY |
| API Vercel → `Rinse` / `rinse-api` | Connected; production READY |
| `https://desk.rinsehq.com` | 200 |
| `https://rinsehq.com` | 200 (was still separate `detailing-landing` repo before landing import) |
| PocketBase health | 200 |
| Campaign mail health | 200 |
| EAS → `Rinse` / `rinse-mobile` | **Pending** — still on `Rinse-App` until manual EAS relink |
| Old desk/api/mobile remotes archived | **No** — wait 72h (see docs/ROLLBACK.md) |

## Landing cutover run (2026-09-12)

| Check | Result |
|-------|--------|
| Landing imported → `Rinse` / `rinse-landing` | In repo (subtree) |
| Landing Vercel → `Rinse` / `rinse-landing` | **Pending** reconnect |
| Ignored Build Step on `detailing-landing` | **Pending** |
| `https://rinsehq.com` hero | Pending post-reconnect |
| Sign in → `desk.rinsehq.com` | Pending post-reconnect |
| `https://app.rinsehq.com/book` | Pending post-reconnect verify |
| `https://app.rinsehq.com/admin` | Pending post-reconnect verify |
| Old remote `detailing-landing` archived | **No** — wait until **2026-09-15** (see docs/ROLLBACK.md) |
