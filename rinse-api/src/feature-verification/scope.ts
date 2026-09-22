export type VerificationDepth = 'domain' | 'persistence' | 'contract' | 'parity'

export type VerificationScope = {
  area: string
  depth: VerificationDepth[]
  entrypoints: string[]
  requiredEvidence: string[]
  currentCoverage: 'covered' | 'partial' | 'planned'
}

export const verificationScope: VerificationScope[] = [
  {
    area: 'Authentication and account setup',
    depth: ['domain', 'persistence', 'contract'],
    entrypoints: ['src/lib/pb-auth.ts', 'src/app/api/auth/signup/route.ts', 'src/app/api/auth/oauth-provision/route.ts'],
    requiredEvidence: ['user persisted', 'organization persisted', 'invalid credentials rejected', 'duplicate signup rejected'],
    currentCoverage: 'partial',
  },
  {
    area: 'Organizations and multi-tenancy',
    depth: ['domain', 'persistence'],
    entrypoints: ['src/lib/tenant.ts', 'pocketbase/pb_migrations/1760700000_organizations_multi_tenant.js'],
    requiredEvidence: ['organization-scoped records', 'cross-tenant read denied', 'cross-tenant write denied'],
    currentCoverage: 'partial',
  },
  {
    area: 'Clients and leads',
    depth: ['domain', 'persistence', 'contract'],
    entrypoints: ['src/lib/api/index.ts', 'src/lib/api/leads-pocketbase.ts', 'src/app/api/public/[slug]/booking/route.ts'],
    requiredEvidence: ['client persisted', 'lead stage transition persisted', 'public booking creates linked records'],
    currentCoverage: 'partial',
  },
  {
    area: 'Jobs and scheduling',
    depth: ['domain', 'persistence', 'contract'],
    entrypoints: ['src/lib/api/index.ts:createJob', 'src/lib/booking-availability.ts', 'src/app/api/public/[slug]/availability/route.ts'],
    requiredEvidence: ['job persisted', 'occupied slot rejected', 'inventory deduction persisted'],
    currentCoverage: 'partial',
  },
  {
    area: 'Quotes and invoices',
    depth: ['domain', 'persistence', 'contract'],
    entrypoints: ['src/lib/api/quotes-pocketbase.ts', 'src/lib/api/invoices-pocketbase.ts', 'src/app/api/pdf/invoice/route.ts'],
    requiredEvidence: ['record persisted', 'status transition persisted', 'line/tax/discount totals verified', 'PDF contains invoice data'],
    currentCoverage: 'partial',
  },
  {
    area: 'Portals, signatures, and payments',
    depth: ['domain', 'persistence', 'contract'],
    entrypoints: ['src/lib/server/portal-tokens.ts', 'src/app/api/portal/[token]/sign-invoice/route.ts', 'src/app/api/stripe/webhook/route.ts'],
    requiredEvidence: ['token scoped and revocable', 'signature persisted idempotently', 'payment persisted idempotently'],
    currentCoverage: 'partial',
  },
  {
    area: 'Photos, vehicles, inventory, and expenses',
    depth: ['domain', 'persistence', 'contract'],
    entrypoints: ['src/lib/api/vehicles-pocketbase.ts', 'src/lib/api/damage-docs-pocketbase.ts', 'src/lib/api/supplies-pocketbase.ts'],
    requiredEvidence: ['record/file persisted', 'invalid upload rejected', 'inventory quantity and expense remain consistent'],
    currentCoverage: 'partial',
  },
  {
    area: 'Notifications, settings, branding, permissions, and admin',
    depth: ['domain', 'persistence', 'contract'],
    entrypoints: ['src/app/api/push/subscribe/route.ts', 'src/lib/api/settings-pocketbase.ts', 'src/lib/server/subscription-guard.ts', 'src/app/api/admin/events/route.ts'],
    requiredEvidence: ['payload persisted or delivered', 'premium/role denial is explicit', 'admin boundary rejects operators'],
    currentCoverage: 'partial',
  },
  {
    area: 'Mobile and desktop parity',
    depth: ['persistence', 'contract', 'parity'],
    entrypoints: ['rinse-mobile/src/lib', 'rinse-desk/src/lib', 'rinse-api/src/lib/api'],
    requiredEvidence: ['same operation shape', 'same persisted result', 'offline replay/convergence verified'],
    currentCoverage: 'planned',
  },
]
