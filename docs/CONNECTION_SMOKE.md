# Connection smoke checklist

Run after production Git reconnect (or against preview URLs first).

- [ ] Desk (`desk.rinsehq.com` and/or `rinsehq.com` landing) loads
- [ ] Desk sign-in against `https://detailing-pb.fly.dev`
- [ ] Desk can call API (`VITE_APP_API_URL` unchanged)
- [ ] `https://rinsehq.com/book/{slug}` (or live book host) loads
- [ ] Portal token route loads
- [ ] Cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://<api-host>/api/cron/notifications` (or project’s auth header)
- [ ] Mobile / TestFlight login against same PB + API
- [ ] Stripe / Apple webhook URLs unchanged
- [ ] Campaign mail health: `https://rinse-campaign-mail.fly.dev/health`

Env **values** must match pre-cutover inventory — only Root Directory / git repo change.

## Cutover run (2026-09-12)

| Check | Result |
|-------|--------|
| Desk Vercel → `Rinse` / `rinse-desk` | Connected; production READY |
| API Vercel → `Rinse` / `rinse-api` | Connected; production READY |
| `https://desk.rinsehq.com` | 200 |
| `https://rinsehq.com` | 200 (still `detailing-landing` project — separate repo) |
| `https://rinsehq.com/privacy` | 200 |
| `https://rinsehq.com/book` | 200 |
| `https://rinsehq.com/admin` | 200 |
| PocketBase health | 200 |
| Campaign mail health | 200 |
| EAS → `Rinse` / `rinse-mobile` | **Pending** — still on `Rinse-App` until manual EAS relink |
| Old remotes archived | **No** — wait 72h (see docs/ROLLBACK.md) |
