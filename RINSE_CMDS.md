# Rinse cmds

Canonical paths live under **`~/Projects/Rinse`** (GitHub: `danieljuliusstein/Rinse`).

See also: [WHERE_TO_START.md](WHERE_TO_START.md) · [docs/DEPLOY_ROOTS.md](docs/DEPLOY_ROOTS.md)

---

## DAILY

1) Backend (only if you need local PB; otherwise use Fly)

```bash
cd ~/Projects/Rinse/pocketbase && ./pocketbase serve --http=127.0.0.1:8090
```

2) Landing (marketing / `rinsehq.com`)

```bash
cd ~/Projects/Rinse/rinse-landing && npm run dev
```

3) Desk

```bash
cd ~/Projects/Rinse/rinse-desk && pnpm dev
```

4) Mobile

```bash
cd ~/Projects/Rinse/rinse-mobile && npm start
```

Deploy PocketBase (Fly):

```bash
cd ~/Projects/Rinse/pocketbase
fly deploy -a detailing-pb
```

Optional local API (only when changing Next routes):

```bash
cd ~/Projects/Rinse/rinse-api && npm run dev
```

---

## Marketing landing (`rinse-landing`)

Live host: **`https://rinsehq.com`** (Vercel project `detailing-landing`, Root Directory `rinse-landing`).
API proxy: `/api/*` → `https://app.rinsehq.com/api/*`. Sign in → `https://desk.rinsehq.com`.

```bash
cd ~/Projects/Rinse/rinse-landing
npm install
npm run dev       # Vite — usually :5000
npm run build
npm run preview
```

---

## Desktop CRM (`rinse-desk`)

```bash
cd ~/Projects/Rinse/rinse-desk
pnpm install
pnpm dev          # Vite — usually :8443 (or $PORT)
pnpm build
pnpm preview
pnpm format
```

---

## Campaign mail

```bash
cd ~/Projects/Rinse/rinse-desk/server/campaign-mail
pnpm install
pnpm dev          # :8787
fly deploy -a rinse-campaign-mail
curl -s https://rinse-campaign-mail.fly.dev/health
```

---

## Mobile app (`rinse-mobile`)

```bash
cd ~/Projects/Rinse/rinse-mobile
npm install
npm start         # Expo Metro
npm run ios       # native iOS build/run
npm run android
npm run web
npm run typecheck
```

### QA

```bash
npm run sync-qa
npm run native-smoke
npm run visual-audit:install
npm run visual-audit
```

EAS builds (same Expo project; run from this folder inside the monorepo):

```bash
cd ~/Projects/Rinse/rinse-mobile
npx eas build
```

---

## Monorepo root shortcuts

```bash
cd ~/Projects/Rinse
npm run landing       # → rinse-landing (Vite)
npm run desk          # → rinse-desk (pnpm/vite)
npm run mobile        # → rinse-mobile (Expo)
npm run api           # → rinse-api (Next.js)
npm run api:build
```

Open Cursor workspace: `Rinse.code-workspace`

---

## PB (`pocketbase`)

```bash
cd ~/Projects/Rinse/pocketbase

# Local
./pocketbase serve --http=127.0.0.1:8090
./pocketbase migrate up

# Production (Fly app — not Desk)
fly deploy -a detailing-pb
curl https://detailing-pb.fly.dev/api/health
fly ssh console -a detailing-pb
fly logs -a detailing-pb
```

---

## Next.js (`rinse-api`)

Live API host: **`https://app.rinsehq.com`**. Apex **`https://rinsehq.com`** is `rinse-landing`.

```bash
cd ~/Projects/Rinse/rinse-api
npm install
npm run dev           # local Next — usually :3000
npm run build
npm test
npm run test:e2e:smoke
npm run verify:backend
npm run seed:demo
```

---

## Expo quick

```bash
cd ~/Projects/Rinse/rinse-mobile
npx expo start
# if port busy: kill <pid> then npx expo start
```

Node 20 (if needed):

```bash
# install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# restart your terminal, then:
nvm install 20
nvm use 20
```

---

## Desk code map (paths under `rinse-desk/`)

| Alias | Path |
|-------|------|
| desk-nav | `src/App.tsx` |
| desk-login | `src/pages/LoginPage.tsx` |
| desk-dashboard | `src/pages/Dashboard.tsx` + `src/components/dashboard/` |
| desk-deals | `src/pages/SalesPipeline.tsx` |
| desk-money | `src/pages/MoneyOverview.tsx` |
| desk-invoices | `src/pages/InvoicesPage.tsx` + `src/components/invoices/` |
| desk-receipts | `src/pages/ReceiptsPage.tsx` + `src/components/receipts/` |
| desk-cars | `src/pages/CarsPage.tsx` + `src/components/cars/` |
| desk-contacts | `src/pages/Contacts.tsx` + `src/components/contacts/` |
| desk-calendar | `src/pages/CalendarPage.tsx` + `src/components/calendar/` |
| desk-routes | `src/pages/RoutesPage.tsx` + `src/components/routes/` |
| desk-activities | `src/pages/ActivitiesPage.tsx` + `src/components/activities/` |
| desk-campaigns | `src/pages/campaigns/` |
| desk-forms | `src/pages/forms/` + `src/components/forms/` |
| desk-automations | `src/pages/automations/` + `src/components/automations/` |
| desk-chat | `src/pages/ChatPage.tsx` + `src/components/chat/` |
| desk-photos | `src/pages/PhotosPage.tsx` + `src/components/photos/` |
| desk-settings | `src/pages/SettingsPage.tsx` + `src/lib/settings-hub.ts` + `src/components/settings/` |
| desk-help | `src/pages/HelpPage.tsx` + `src/components/help/articles.ts` |

Full path examples: `~/Projects/Rinse/rinse-desk/src/pages/Dashboard.tsx`
