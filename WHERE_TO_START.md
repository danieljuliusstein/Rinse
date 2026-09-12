# Where to start

**James (and most Desk UI work): you almost always only need `rinse-desk`.**

| If you are building… | Open / run | Command |
|----------------------|------------|---------|
| Homepage / Desk (desktop CRM) | `rinse-desk` | `pnpm install && pnpm dev` → usually `http://localhost:8443` |
| API, book, portal, admin | `rinse-api` | `npm install && npm run dev` → usually `:3000` |
| iPhone / Android operator app | `rinse-mobile` | `npm install && npx expo start` |
| PocketBase migrations / Fly | `pocketbase` | see `pocketbase/DEPLOY.md` |
| Shared money/types | `packages/core` | consumed as `@rinse/core` |

## Local defaults

Desk and mobile normally talk to **hosted** PocketBase (`detailing-pb.fly.dev`) and **production** API (`https://rinsehq.com` / your live API host). You do **not** need every app running locally.

From repo root (optional shortcuts):

```bash
npm run desk
npm run api
npm run mobile
```

Each app keeps its own `node_modules` (do not hoist Expo to the root).

## Deploy map

See [docs/DEPLOY_ROOTS.md](docs/DEPLOY_ROOTS.md).
