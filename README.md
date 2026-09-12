# Rinse

One git repo for the Rinse product. **Separate deploys** !!!!! do not confuse them.

| Path | Role | Deploy |
|------|------|--------|
| [`rinse-desk`](rinse-desk) | Landing + Desk (Vite) | Vercel → `desk.rinsehq.com` / landing |
| [`rinse-mobile`](rinse-mobile) | iOS/Android operator (Expo) | EAS |
| [`rinse-api`](rinse-api) | Next.js API + book + portal + admin | Vercel |
| [`pocketbase`](pocketbase) | DB migrations / Fly config | Fly `detailing-pb` |
| [`packages/core`](packages/core) | Shared `@rinse/core` | workspace package |

**Start here:** [WHERE_TO_START.md](WHERE_TO_START.md)  
**Deploy roots:** [docs/DEPLOY_ROOTS.md](docs/DEPLOY_ROOTS.md)  
**Rollback:** keep old GitHub remotes unarchived for 72h after cutover; see deploy docs.

Open [`Rinse.code-workspace`](Rinse.code-workspace) in Cursor.
