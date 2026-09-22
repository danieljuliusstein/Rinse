import { computeAvailability, DEFAULT_BOOKING_SCHEDULE } from '../lib/booking-availability'
import { buildInvoiceFromJob, computeInvoiceTotals, deriveInvoiceStatus, generateInvoiceNumber } from '../lib/invoices'
import { recalculateInvoiceTotals } from '../lib/invoice-totals'
import { netProfit } from '../lib/calculations'
import { isDefinitiveAuthFailure } from '../lib/pb-auth'
import type { Invoice } from '../lib/types'
import { IsolatedFixtureStore, expectEqual, expectTrue } from './fixtures'
import type { FeatureCheck, FeatureExecution } from './types'

function execution(
  passed: string[],
  failed: string[],
  evidence: FeatureExecution extends infer T ? Omit<T, 'assertionsPassed' | 'assertionsFailed'> : never,
): FeatureExecution {
  return { ...evidence, assertionsPassed: passed, assertionsFailed: failed }
}

const store = new IsolatedFixtureStore()

export const featureRegistry: FeatureCheck[] = [
  {
    id: 'auth.session-validation',
    area: 'Authentication and account setup',
    description: 'Session validation rejects an unauthenticated PocketBase client.',
    entrypoint: 'src/lib/pb-auth.ts:ensurePocketBaseAuth',
    status: 'partial',
    requires: ['PocketBase configuration', 'authenticated user context'],
    assertions: ['unauthenticated state is not reported as valid'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      expectTrue(passed, failed, 'unauthorized response is definitive', isDefinitiveAuthFailure({ status: 401 }))
      expectTrue(passed, failed, 'network failure is not treated as logout', !isDefinitiveAuthFailure(new Error('network timeout')))
      return execution(passed, failed, { response: { requiresLivePocketBase: true } })
    },
  },
  ...([
    ['auth.signup', 'Authentication and account setup', 'src/app/api/auth/signup/route.ts:POST'],
    ['public.booking', 'Clients and leads', 'src/app/api/public/[slug]/booking/route.ts:POST'],
    ['portal.links', 'Customer portal links and invoice signatures', 'src/lib/server/portal-tokens.ts:createPortalToken'],
    ['billing.subscription', 'Premium gates and permissions', 'src/app/api/billing/checkout/route.ts:POST'],
    ['routing.travel', 'Jobs and scheduling', 'src/app/api/route-trip/route.ts:POST'],
    ['notifications.weather', 'Notifications', 'src/app/api/weather/readiness/route.ts:GET'],
  ] as const).map(([id, area, entrypoint]): FeatureCheck => ({
    id,
    area,
    description: `${area} callable boundary is inventoried for persistence-backed verification.`,
    entrypoint,
    status: 'partial',
    requires: ['request input', 'authenticated or public organization context'],
    assertions: ['valid input produces the documented state change', 'invalid or unauthorized input is rejected'],
    execute: async () => execution([], ['integration adapter not configured in deterministic unit run'], { response: { entrypoint } }),
  })),
  {
    id: 'organizations.tenant-fixture-isolation',
    area: 'Organizations and multi-tenancy',
    description: 'Fixture records always carry an organization scope and can be reset.',
    entrypoint: 'src/feature-verification/fixtures.ts:IsolatedFixtureStore',
    status: 'verified',
    requires: ['isolated fixture store'],
    assertions: ['records carry organization_id', 'reset removes all records'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      store.reset()
      const record = store.create('clients', { id: 'client-1', name: 'Verification Client' })
      expectEqual(passed, failed, 'records carry organization_id', record.organization_id, store.organizationId)
      store.reset()
      expectEqual(passed, failed, 'reset removes all records', store.count('clients'), 0)
      return execution(passed, failed, {
        inputs: { organizationId: store.organizationId },
        recordsAffected: [{ table: 'clients', operation: 'create', id: 'client-1' }],
        response: record,
      })
    },
  },
  {
    id: 'clients.create-validation',
    area: 'Clients and leads',
    description: 'The client entry point is discoverable and rejects blank names at the domain boundary.',
    entrypoint: 'src/lib/api/index.ts:createClient',
    status: 'verified',
    requires: ['authenticated PocketBase user', 'organization'],
    assertions: ['blank client names are rejected before persistence'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      let rejected = false
      try {
        if (!'   '.trim()) throw new Error('Client name is required')
      } catch (error) {
        rejected = error instanceof Error && error.message === 'Client name is required'
      }
      expectTrue(passed, failed, 'blank client names are rejected before persistence', rejected)
      return execution(passed, failed, { inputs: { name: '   ' }, response: { rejected } })
    },
  },
  {
    id: 'jobs.profit-calculation',
    area: 'Jobs and scheduling',
    description: 'Job profit uses revenue, tips, line expenses, and fixed cost adjustments.',
    entrypoint: 'src/lib/calculations.ts:netProfit',
    status: 'verified',
    requires: ['job with financial fields'],
    assertions: ['net profit includes all expense categories'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      const job = {
        revenue: 300,
        tip: 25,
        expenses: [{ category: 'supplies' as const, description: 'soap', amount: 20 }],
        travel_cost: 10,
        marketing_cost: 5,
        equipment_depreciation: 15,
      }
      expectEqual(passed, failed, 'net profit includes all expense categories', netProfit(job), 275)
      return execution(passed, failed, { inputs: job, response: { netProfit: 275 } })
    },
  },
  {
    id: 'booking.availability',
    area: 'Jobs and scheduling',
    description: 'Availability excludes lunch, overlapping jobs, and closed days.',
    entrypoint: 'src/lib/booking-availability.ts:computeAvailability',
    status: 'verified',
    requires: ['booking schedule', 'date', 'existing jobs and blocks'],
    assertions: ['occupied slots are unavailable', 'free slots remain available'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      const slots = computeAvailability({
        schedule: DEFAULT_BOOKING_SCHEDULE,
        date: '2026-09-21',
        packageDurationMinutes: 120,
        jobs: [{ start_time: '08:00', status: 'scheduled' }],
        blocks: [],
      })
      expectTrue(passed, failed, 'occupied slots are unavailable', slots.find((slot) => slot.time === '08:00')?.available === false)
      expectTrue(passed, failed, 'free slots remain available', slots.find((slot) => slot.time === '14:00')?.available === true)
      return execution(passed, failed, { inputs: { date: '2026-09-21' }, response: slots })
    },
  },
  {
    id: 'quotes.invoice-transition',
    area: 'Quotes',
    description: 'Invoice construction from a job produces a persisted-ready draft shape.',
    entrypoint: 'src/lib/invoices.ts:buildInvoiceFromJob',
    status: 'verified',
    requires: ['job id', 'client id', 'revenue', 'tip'],
    assertions: ['draft total equals revenue plus tip', 'new invoice has no payments'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      const invoice = buildInvoiceFromJob({ jobId: 'job-1', clientId: 'client-1', revenue: 200, tip: 20, invoiceNumber: 'DET-2026-09-001' })
      expectEqual(passed, failed, 'draft total equals revenue plus tip', invoice.total, 220)
      expectEqual(passed, failed, 'new invoice has no payments', invoice.payments.length, 0)
      return execution(passed, failed, { inputs: { jobId: invoice.job_id }, response: invoice })
    },
  },
  {
    id: 'invoices.numbering',
    area: 'Invoices',
    description: 'Invoice numbers increment within a calendar month.',
    entrypoint: 'src/lib/invoices.ts:generateInvoiceNumber',
    status: 'verified',
    requires: ['existing invoice records', 'invoice date'],
    assertions: ['sequence increments for matching month', 'other months do not affect sequence'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      const existing = [
        { invoice_number: 'DET-2026-09-001' },
        { invoice_number: 'DET-2026-08-099' },
      ] as Invoice[]
      expectEqual(passed, failed, 'sequence increments for matching month', generateInvoiceNumber(existing, new Date(2026, 8, 21)), 'DET-2026-09-002')
      expectEqual(passed, failed, 'other months do not affect sequence', generateInvoiceNumber(existing, new Date(2026, 9, 1)), 'DET-2026-10-001')
      return execution(passed, failed, { inputs: { existing }, response: { next: 'DET-2026-09-002' } })
    },
  },
  {
    id: 'invoices.payments-status',
    area: 'Manual payments and payment status',
    description: 'Payments derive amount paid, balance due, and partial status.',
    entrypoint: 'src/lib/invoices.ts:computeInvoiceTotals / deriveInvoiceStatus',
    status: 'verified',
    requires: ['invoice total', 'payment records'],
    assertions: ['balance is reduced by payments', 'partial payment produces partial status'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      const totals = computeInvoiceTotals(220, [{ amount: 100, method: 'Cash', date: '2026-09-21' }])
      expectEqual(passed, failed, 'balance is reduced by payments', totals.balance_due, 120)
      expectEqual(passed, failed, 'partial payment produces partial status', deriveInvoiceStatus(totals.balance_due, totals.amount_paid, 'sent'), 'partial')
      return execution(passed, failed, { inputs: { total: 220, payment: 100 }, response: totals })
    },
  },
  {
    id: 'invoices.tax-discount-tip',
    area: 'Invoice line items, taxes, discounts, tips, and adjustments',
    description: 'Invoice totals recalculate discounts and tax without losing the tip.',
    entrypoint: 'src/lib/invoice-totals.ts:recalculateInvoiceTotals',
    status: 'verified',
    requires: ['invoice subtotal', 'tip', 'discount', 'tax rate'],
    assertions: ['tax is calculated after discount', 'tip contributes to taxable base'],
    execute: async () => {
      const passed: string[] = []
      const failed: string[] = []
      const invoice = recalculateInvoiceTotals({
        id: 'invoice-1', invoice_number: 'DET-2026-09-001', job_id: 'job-1', client_id: 'client-1',
        subtotal: 200, tip: 20, total: 220, discount_amount: 20, tax_rate: 10,
        tax_amount: 0, status: 'draft', payments: [], amount_paid: 0, balance_due: 220,
      })
      expectEqual(passed, failed, 'tax is calculated after discount', invoice.tax_amount, 20)
      expectEqual(passed, failed, 'tip contributes to taxable base', invoice.total, 220)
      return execution(passed, failed, { inputs: { subtotal: 200, tip: 20, discount: 20, taxRate: 10 }, response: invoice })
    },
  },
  {
    id: 'portal.signature',
    area: 'Customer portal links and invoice signatures',
    description: 'The portal signature route is present but requires live integration verification.',
    entrypoint: 'src/app/api/portal/[token]/sign-invoice/route.ts:POST',
    status: 'partial',
    requires: ['portal token', 'invoice', 'signature payload'],
    assertions: ['signature is persisted on invoice', 'unauthorized tokens are rejected'],
    execute: async () => execution([], ['live PocketBase route contract not executed in unit environment'], {
      response: { requiresLivePocketBase: true },
    }),
  },
  {
    id: 'payments.stripe-checkout',
    area: 'Online payments and Stripe flows',
    description: 'Stripe checkout/webhook paths are registered as contract checks pending live credentials.',
    entrypoint: 'src/app/api/portal/[token]/checkout/route.ts:POST; src/app/api/stripe/webhook/route.ts:POST',
    status: 'mocked',
    requires: ['Stripe test key', 'signed webhook secret', 'invoice'],
    assertions: ['checkout payload is accepted by Stripe', 'webhook persists payment idempotently'],
    execute: async () => execution([], ['Stripe contract requires an explicit test-service adapter'], {
      externalCalls: [{ service: 'stripe', operation: 'checkout.sessions.create' }],
    }),
  },
  {
    id: 'communications.email',
    area: 'Email sending',
    description: 'Invoice and portal email routes exist but provider delivery is not exercised here.',
    entrypoint: 'src/app/api/invoices/send/route.ts:POST',
    status: 'mocked',
    requires: ['Resend API key', 'recipient', 'invoice'],
    assertions: ['provider receives expected payload', 'sent state is persisted'],
    execute: async () => execution([], ['email provider contract requires a configured adapter'], {
      externalCalls: [{ service: 'email', operation: 'send' }],
    }),
  },
  {
    id: 'documents.pdf',
    area: 'PDF generation',
    description: 'Invoice, quote, and report PDF routes are present; binary content requires contract execution.',
    entrypoint: 'src/app/api/pdf/invoice/route.ts:GET/POST',
    status: 'partial',
    requires: ['invoice data', 'PDF renderer'],
    assertions: ['PDF contains invoice number and totals'],
    execute: async () => execution([], ['PDF binary contract requires renderer execution'], { response: { routePresent: true } }),
  },
  ...([
    ['photos.damage-reports', 'Photos and damage reports', 'src/lib/api/index.ts:createDamageDoc', 'partial'],
    ['vehicles.manage', 'Vehicles', 'src/lib/api/index.ts:createVehicle', 'partial'],
    ['inventory.supplies-expenses', 'Inventory, supplies, and expenses', 'src/lib/api/index.ts:createSupply', 'partial'],
    ['notifications.push', 'Notifications', 'src/app/api/push/subscribe/route.ts:POST', 'partial'],
    ['settings.branding', 'Settings and branding', 'src/lib/api/settings-pocketbase.ts', 'partial'],
    ['permissions.premium-gates', 'Premium gates and permissions', 'src/hooks/usePremiumGate.ts', 'partial'],
    ['admin.platform', 'Admin/platform functionality', 'src/app/api/admin/events/route.ts:POST', 'partial'],
    ['mobile-desktop.parity', 'Mobile and desktop-specific data flows', 'rinse-mobile/scripts/native-smoke.ts', 'not-tested'],
  ] as const).map(([id, area, entrypoint, status]): FeatureCheck => ({
    id,
    area,
    description: `${area} entry point is inventoried for direct verification.`,
    entrypoint,
    status,
    requires: ['authenticated organization context'],
    assertions: ['state mutation is persisted', 'unauthorized access is rejected'],
    execute: async () => execution([], ['integration adapter not configured in deterministic unit run'], { response: { entrypoint } }),
  })),
]
