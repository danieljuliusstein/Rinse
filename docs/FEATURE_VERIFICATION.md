# Programmatic feature verification

Rinse's feature verification suite lives in `rinse-api/src/feature-verification`. It is intentionally separate from browser E2E tests: checks call domain functions directly, record the entry point and evidence, and classify features that still need a live PocketBase or provider contract.

## Commands

```sh
npm run verify:features
# or, from rinse-api:
npm run verify:features

# Targeted layers:
npm run verify:features:domain
npm run verify:features:persistence
npm run verify:features:contracts
npm run verify:features:integration
npm run verify:features:routes
npm run verify:features:parity
```

The run writes `rinse-api/test-results/feature-verification.json` and
`rinse-api/test-results/feature-verification.md`. The JSON is CI-friendly and
contains the feature ID, classification, duration, inputs, entry point,
assertions, affected records, external calls, response evidence, and errors.

## Harness conventions

- `registry.ts` is the machine-readable inventory. Every entry names its area,
  direct callable entry point, required context, assertions, and classification.
- `fixtures.ts` provides an organization-scoped, resettable fixture store for
  deterministic tests. Production PocketBase is never modified by the unit run.
- `runner.ts` executes every check and preserves failed assertions instead of
  treating a successful return value as proof of persistence.
- `external-contracts.ts` provides deterministic Stripe, email, and PDF test
  doubles. The contract tests assert payload shape, PDF evidence, and webhook
  idempotency without contacting third-party services.
- `route-contract.test.ts` invokes real Next route handlers for public booking,
  quote acceptance, and invoice signature validation. Stateful test doubles
  verify mutations and idempotency; the PocketBase integration layer remains
  the authority for production persistence rules.
- `parity.test.ts` defines shared mutation contracts and checks that API,
  desktop, and mobile representations preserve the same identifiers/statuses.
- `mock-scan.ts` emits categorized evidence for demo paths, swallowed catches,
  success-only API responses, and local-storage fallback code. Signals are
  findings for review, not automatic proof of a defect.
- Pure calculations and availability/invoice transitions are verified against
  real Rinse functions. Stripe, email, PDF, portal, and PocketBase checks are
  explicitly classified as `partial` or `mocked` until a test-service adapter
  is configured.

The current report is therefore an honest boundary: verified checks can run
without the UI; partial and mocked checks identify the exact integration
contract that still needs a persistence-backed adapter. Add those adapters
before changing a classification to `verified`.

## Broad-depth scope

Each area is planned across four layers:

1. **Domain** — calculations, validation, state transitions, and authorization
   predicates against real Rinse functions.
2. **Persistence** — isolated organization/user fixtures or a disposable
   PocketBase instance, with read-after-write, relationship, cleanup, and
   cross-tenant denial assertions.
3. **Contract** — Stripe, email, PDF, push, upload, booking, and portal
   boundaries using deterministic provider fakes or test services.
4. **Parity** — the same operation from API, desktop, and mobile adapters,
   including offline replay and convergence where applicable.

The generated `feature-verification-scope.json` records the required depth and
evidence for each area. A feature must pass all applicable layers before it may
be classified `verified`.

## PocketBase integration mode

Set `FEATURE_PB_URL` (or `PB_URL`), `PB_ADMIN_EMAIL`, and
`PB_ADMIN_PASSWORD` to enable the disposable integration checks. They create
unique organizations and users, authenticate through the real `users`
collection, exercise tenant-scoped client CRUD, verify cross-tenant denial,
and clean up all records through the superuser API. Without those variables,
the integration file is skipped rather than producing a false positive.

For a local disposable PocketBase run on macOS or Linux, use:

```bash
npm run verify:features:integration:local
```

This downloads PocketBase 0.39.1 into `.feature-pb/`, applies the repository
hooks and migrations, creates the temporary superuser
`feature-admin@example.test`, runs the real integration suite, and stops the
server when the command exits. Override `PB_PORT`, `PB_DIR`,
`PB_ADMIN_EMAIL`, or `PB_ADMIN_PASSWORD` when needed. The local data directory
is disposable and should not be pointed at a production PocketBase instance.

CI always runs the deterministic domain, fixture-persistence, contract, and
registry checks. It uploads the generated JSON and Markdown evidence as the
`rinse-feature-verification` artifact. A CI job with PocketBase credentials can
add `npm run verify:features:integration` to execute the real persistence layer;
the integration test is deliberately skipped when those credentials are absent.

The CI workflow now provisions PocketBase 0.39.1 with the repository's hooks
and migrations, creates an isolated superuser, runs the real integration
checks, and uploads `mock-signals.json` alongside the feature report.
