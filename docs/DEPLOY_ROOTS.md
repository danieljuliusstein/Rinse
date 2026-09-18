# Deploy Root Directories (Vercel / EAS / Fly)

**Rule:** one git repo (`danieljuliusstein/Rinse`). Separate host projects. Domains and env **values** stay the same; only Git connection + Root Directory change.

## Phase 0 inventory

| Vercel project | Live URL (from CLI) | Framework | Intended monorepo Root Directory |
|----------------|---------------------|-----------|----------------------------------|
| `detailing-landing` | `https://rinsehq.com` | Vite | `rinse-landing` |
| `detailing-crm` | `https://desk.rinsehq.com` | Vite | `rinse-desk` |
| `detailing` | `https://app.rinsehq.com` (Next API + book/portal/admin) | Next.js | `rinse-api` |

Also present (out of scope for this cutover): `detailing-website`, legacy `detailing-app`.

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
rinse-landing --SPA-------------------->  rinsehq.com
rinse-landing --/api rewrite---------->  app.rinsehq.com
rinse-landing --Sign in--------------->  desk.rinsehq.com
rinse-mobile  --EXPO_PUBLIC_APP_API_URL-->  live API host (often app.rinsehq.com)
rinse-mobile  --EXPO_PUBLIC_PB_URL------>  detailing-pb.fly.dev
rinse-desk    --VITE_APP_API_URL------->  live API host
rinse-desk    --VITE_PB_URL------------>  detailing-pb.fly.dev
rinse-desk    --VITE_CAMPAIGN_MAIL_URL->  rinse-campaign-mail.fly.dev
rinse-api     --PB / Stripe / Apple---->  same secrets, same webhook URLs
```

## Ignored Build Step (Vercel)

Exit `0` = skip build; exit `1` = proceed. Set per project.

**Critical:** With **Root Directory** set (`rinse-desk`, etc.), Vercel runs this
command *inside that folder*. Paths like `./rinse-desk` then look for
`rinse-desk/rinse-desk` → no diff → **every deploy is Canceled** (skipped).
Use `.` for the app folder, and `../…` for siblings outside the root.

**`detailing-crm`** (Root = `rinse-desk`):

```bash
git diff --quiet HEAD^ HEAD -- . || exit 1
exit 0
```

**`detailing-landing`** (Root = `rinse-landing`):

```bash
git diff --quiet HEAD^ HEAD -- . ../packages/core || exit 1
exit 0
```

**`detailing`** (Root = `rinse-api`):

```bash
git diff --quiet HEAD^ HEAD -- . ../packages/core ../pocketbase || exit 1
exit 0
```

After changing these in Vercel → Project → Settings → Git → Ignored Build Step,
**Redeploy** the latest production commit (or push an empty commit) so Desk/API
pick up `05a309a` and later.
## Cutover checklist

1. Preview deploy from the new Root Directory **before** reconnecting production.
2. Switch Git on each Vercel project to `danieljuliusstein/Rinse` + Root Directory above.
3. Add **Ignored Build Step** (scripts above) so sibling commits do not rebuild unrelated hosts.
4. Relink EAS to `Rinse` with app directory `rinse-mobile`; do not change `EXPO_PUBLIC_*` values.
5. Keep old remotes (`detailing-landing`, `detailing-CRM`, `detailing`, `Rinse-App`) **unarchived for 72h**.
6. Smoke: landing hero, Desk login, book/portal on `app.rinsehq.com`, cron curl, mobile login.

## Rollback (fastest first)

1. Vercel → Redeploy last known-good production deployment.
2. Reconnect that project’s Git to the old repo (`detailing-landing` / `detailing-CRM` / `detailing` / `Rinse-App`).
3. Restore from `~/Backups/rinse-monorepo-20260911-2330` or `~/Backups/rinse-landing-merge-*` mirrors / `packages-core.tgz` if history or core was lost.
4. Touch Cloudflare DNS only if a domain was dropped from Vercel.
