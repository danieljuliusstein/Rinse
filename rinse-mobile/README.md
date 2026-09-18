# Rinse Mobile (Expo) — `apps/mobile`

Native operator app for Rinse — iOS-first.

## Monorepo layout

```
Detailing/
  apps/mobile/       # This app
  apps/api/          # Next.js API + book/portal/admin → rinsehq.com
  apps/pocketbase/   # Migrations + Fly config
  packages/core/     # @rinse/core
  detailing-website/ # Marketing rinsehq.com (not the API)
```

## Prerequisites

- Node 20+
- Xcode + iOS Simulator (for local iOS dev)
- Expo account (for EAS builds)
- PocketBase URL + **API** URL (`rinsehq.com` in production)

## Setup

`apps/mobile` is a **standalone** npm project (not an npm workspace member). Keep installs inside this folder.

```bash
cd apps/mobile
cp .env.example .env
# EXPO_PUBLIC_PB_URL + EXPO_PUBLIC_APP_API_URL=http://localhost:3000 (or rinsehq.com)
npm install
npm start
```

From monorepo root:

```bash
npm run mobile
```

## Environment

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_PB_URL` | PocketBase (e.g. `https://detailing-pb.fly.dev`) |
| `EXPO_PUBLIC_APP_API_URL` | **apps/api** host — production: `https://rinsehq.com` |
| `EXPO_PUBLIC_OFFLINE_ENABLED` | Set `0` to disable offline enqueue |
| `EAS_PROJECT_ID` | `a603bec9-0ac7-432a-b24a-9d100f9fd884` |

OAuth: Google/Apple use PocketBase’s redirect (`https://detailing-pb.fly.dev/api/oauth2-redirect`) via `authWithOAuth2` — same as Desk.

## App Store

See [docs/app-store-ship-checklist.md](docs/app-store-ship-checklist.md). Billing Path A = StoreKit via `expo-iap`.

## EAS builds

```bash
cd apps/mobile
npx eas-cli login

npx eas env:create --name EXPO_PUBLIC_PB_URL --value https://detailing-pb.fly.dev --environment production
npx eas env:create --name EXPO_PUBLIC_APP_API_URL --value https://rinsehq.com --environment production

npx eas build --profile development --platform ios
npx eas build --profile production --platform ios
```

API cutover steps: [`../api/docs/DEPLOY_CUTOVER.md`](../api/docs/DEPLOY_CUTOVER.md).
