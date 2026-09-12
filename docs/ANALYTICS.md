# Product analytics & monitoring (Rinse)

## Sources of truth

| Concern | System |
|---------|--------|
| Signup / org created | **`platform_events`** (`org_created`) via signup API |
| Billing / Stripe / IAP entitlement | **`platform_events`** + org subscription fields (webhooks + `/api/billing/apple/confirm`) |
| Product funnels / retention | **PostHog** (soft signals only) |
| Crashes / exceptions | **Sentry** |

Do **not** use PostHog (or Vercel Analytics) as the source of truth for plan unlocks or payments.

## What’s wired

### `apps/mobile`
- Sentry: `src/lib/sentry.ts`, `Sentry.wrap` in `app/_layout.tsx`, plugin `@sentry/react-native/expo`
- PostHog: `src/lib/posthog.ts` + `PostHogProvider`; identify on auth via `src/lib/telemetry.ts`
- Soft events: `auth_signed_in`, `auth_signed_up`, `auth_signed_out`, `iap_starter_purchased`

Env:
```
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
SENTRY_ORG=          # optional, for native source maps
SENTRY_PROJECT=
```

### `apps/api`
- Sentry: `sentry.*.config.ts` + `src/instrumentation.ts` + `instrumentation-client.ts`
- PostHog: `PostHogInit` in root layout (book/portal/admin pages)

Env:
```
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### `detailing-website` (waitlist → `waitlist.rinsehq.com`)
- PostHog + Sentry same pattern; `.env.example` lists keys

## Privacy

- No emails sent to PostHog/Sentry user props by default (user id + org id only).
- Leave keys unset in `.env` → SDKs no-op (safe for local).
- When enabling in production, update App Store privacy nutrition labels for analytics/crash data.

## Setup checklist

1. Create Sentry projects: `rinse-mobile`, `rinse-api` (and optional waitlist).
2. Create PostHog project; copy project API key.
3. Set EAS / Vercel env vars (never commit secrets).
4. Rebuild native dev client after adding Sentry plugin (`npx expo prebuild` / EAS build).
5. Confirm admin still shows signup/billing from `platform_events`.
