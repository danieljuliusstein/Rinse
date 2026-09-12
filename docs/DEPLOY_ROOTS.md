# Deploy Root Directories (Vercel / EAS / Fly)

**Rule:** one git repo (`danieljuliusstein/Rinse`). Separate host projects. Domains and env **values** stay the same; only Git connection + Root Directory change.

## Phase 0 inventory (2026-09-11)

| Vercel project | Live URL (from CLI) | Framework | Intended monorepo Root Directory |
|----------------|---------------------|-----------|----------------------------------|
| `detailing-crm` | `https://desk.rinsehq.com` | Vite | `rinse-desk` |
| `detailing-landing` | `https://rinsehq.com` | Vite | `rinse-desk` (same Desk/landing app unless you intentionally split) |
| `detailing` | `*.vercel.app` (Next API) | Next.js | `rinse-api` |

Also present (out of scope for v1 cutover): `detailing-website`, legacy `detailing-app`.

| Host | App | Root / path | Notes |
|------|-----|-------------|--------|
| EAS | Phone | `rinse-mobile` | Expo projectId `a603bec9-0ac7-432a-b24a-9d100f9fd884` (from `app.config.ts`) |

### EAS (phone)

Expo project `@danieljstein/rinse-mobile` (`a603bec9-0ac7-432a-b24a-9d100f9fd884`) stays the same. Clone **`Rinse`**, then:

```bash
cd rinse-mobile
npm install
npx eas build
```

Do not change `EXPO_PUBLIC_*` values during the git move. Old `Rinse-App` remote keeps a Moved README until archive.

| Fly | DB | `pocketbase` | App name `detailing-pb` — do not change |
| Fly | Campaign mail | `rinse-desk/server/campaign-mail` | App `rinse-campaign-mail` |

## Connection map (unchanged after move)

```text
rinse-mobile  --EXPO_PUBLIC_APP_API_URL-->  live API host (often rinsehq.com)
rinse-mobile  --EXPO_PUBLIC_PB_URL------>  detailing-pb.fly.dev
rinse-desk    --VITE_APP_API_URL------->  live API host
rinse-desk    --VITE_PB_URL------------>  detailing-pb.fly.dev
rinse-desk    --VITE_CAMPAIGN_MAIL_URL->  rinse-campaign-mail.fly.dev
rinse-api     --PB / Stripe / Apple---->  same secrets, same webhook URLs
```

## Cutover checklist

1. Preview deploy Desk from `rinse-desk` and API from `rinse-api` **before** reconnecting production.
2. Switch Git on each Vercel project to `danieljuliusstein/Rinse` + Root Directory above.
3. Add **Ignored Build Step** so Desk commits do not rebuild API and vice versa.
4. Relink EAS to `Rinse` with app directory `rinse-mobile`; do not change `EXPO_PUBLIC_*` values.
5. Keep old remotes (`detailing-CRM`, `detailing`, `Rinse-App`) **unarchived for 72h**.
6. Smoke: Desk login, book/portal, cron curl, mobile login.

## Rollback (fastest first)

1. Vercel → Redeploy last known-good production deployment.
2. Reconnect that project’s Git to the old repo (`detailing-CRM` / `detailing` / `Rinse-App`).
3. Restore from `~/Backups/rinse-monorepo-20260911-2330` mirrors / `packages-core.tgz` if history or core was lost.
4. Touch Cloudflare DNS only if a domain was dropped from Vercel.
