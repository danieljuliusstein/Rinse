import { normalizeDocumentLocale } from '@rinse/core'
import type PocketBase from 'pocketbase'
import { computePLReport, rangeFor } from '@/lib/api/aggregates'
import {
  escapeFilterValue,
  pbBusinessExpenseToApp,
  pbInvoiceToApp,
  pbJobToApp,
  pbJobToAppWithRelations,
  pbOverheadToApp,
  pbQuoteToAppWithRelations,
  type PbRecord,
} from '@/lib/api/mappers'
import type { DateRangeKey } from '@/lib/api/reports'
import { businessLogoApiUrl, DEFAULT_BUSINESS_LOGO_PATH, pocketBaseRecordHasLogo } from '@/lib/business-logo'
import { normalizeInvoice } from '@/lib/invoices'
import { overheadAmountForRange } from '@/lib/supplies-logic'
import { businessExpensesTotalForDates } from '@/lib/business-expenses-logic'
import type { AppSettings } from '@/lib/settings'
import type { Invoice, JobWithRelations, QuoteWithRelations } from '@/lib/types'
import type { PLReport } from '@/lib/api/aggregates'

const JOB_EXPAND = 'client_id,package_id,invoice_id'
const QUOTE_EXPAND = 'client_id,package_id'

export class PdfDataError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 403 = 404,
  ) {
    super(message)
  }
}

function assertOrgRecord(record: PbRecord, organizationId: string): void {
  if (String(record.organization_id ?? '') !== organizationId) {
    throw new PdfDataError('Forbidden', 403)
  }
}

function notificationsFromRecord(raw: unknown): AppSettings['notifications'] {
  const defaults: AppSettings['notifications'] = {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  }
  if (typeof raw !== 'object' || raw === null) return defaults
  const n = raw as Record<string, unknown>
  return {
    job_reminder: n.job_reminder !== false,
    morning_reminder: n.morning_reminder !== false,
    follow_up: n.follow_up !== false,
    invoice_overdue: n.invoice_overdue !== false,
    low_inventory: n.low_inventory !== false,
  }
}

async function loadOrgSettings(pb: PocketBase, organizationId: string): Promise<AppSettings> {
  const orgEsc = escapeFilterValue(organizationId)
  const records = await pb.collection('app_settings').getFullList<PbRecord>({
    filter: `organization_id = "${orgEsc}"`,
    limit: 1,
  })

  let slug = ''
  try {
    const org = await pb.collection('organizations').getOne(organizationId)
    slug = String(org.slug ?? '')
  } catch {
    // ignore
  }

  const record = records[0]
  if (!record) {
    return {
      business_name: 'Detailing',
      business_phone: '',
      business_email: '',
      business_address: '',
      invoice_terms_footer: '',
      document_locale: 'en',
      notifications: notificationsFromRecord(null),
      logo_url: DEFAULT_BUSINESS_LOGO_PATH,
    }
  }

  const logoUrl = pocketBaseRecordHasLogo(record.logo)
    ? businessLogoApiUrl(slug, record.updated)
    : DEFAULT_BUSINESS_LOGO_PATH

  return {
    business_name: String(record.business_name ?? ''),
    business_phone: String(record.business_phone ?? ''),
    business_email: String(record.business_email ?? ''),
    business_address: String(record.business_address ?? ''),
    invoice_terms_footer: String(record.invoice_terms_footer ?? ''),
    document_locale: normalizeDocumentLocale(record.document_locale),
    notifications: notificationsFromRecord(record.notifications),
    last_backup_at: record.last_backup_at ? String(record.last_backup_at) : undefined,
    logo_url: logoUrl,
    accent_color: record.accent_color ? String(record.accent_color) : null,
    invoice_template: record.invoice_template
      ? (String(record.invoice_template) as AppSettings['invoice_template'])
      : undefined,
    pb_record_id: record.id,
  }
}

export async function fetchInvoicePdfData(
  pb: PocketBase,
  organizationId: string,
  jobId: string,
  invoiceId: string,
): Promise<{ job: JobWithRelations; invoice: Invoice; settings: AppSettings }> {
  const jobRecord = await pb.collection('jobs').getOne<PbRecord>(jobId, { expand: JOB_EXPAND })
  assertOrgRecord(jobRecord, organizationId)

  const invoiceRecord = await pb.collection('invoices').getOne<PbRecord>(invoiceId)
  assertOrgRecord(invoiceRecord, organizationId)

  if (String(invoiceRecord.job_id ?? '') !== jobId) {
    throw new PdfDataError('Invoice does not belong to job')
  }

  const job = pbJobToAppWithRelations(jobRecord)
  const invoice = normalizeInvoice(pbInvoiceToApp(invoiceRecord))
  const settings = await loadOrgSettings(pb, organizationId)

  return { job, invoice, settings }
}

export async function fetchQuotePdfData(
  pb: PocketBase,
  organizationId: string,
  quoteId: string,
): Promise<{ quote: QuoteWithRelations; settings: AppSettings }> {
  const quoteRecord = await pb.collection('quotes').getOne<PbRecord>(quoteId, { expand: QUOTE_EXPAND })
  assertOrgRecord(quoteRecord, organizationId)

  const quote = pbQuoteToAppWithRelations(quoteRecord)
  const settings = await loadOrgSettings(pb, organizationId)

  return { quote, settings }
}

async function fetchOrgJobs(pb: PocketBase, organizationId: string) {
  const orgEsc = escapeFilterValue(organizationId)
  const records = await pb.collection('jobs').getFullList<PbRecord>({
    filter: `organization_id = "${orgEsc}"`,
    sort: '-date',
  })
  return records.map(pbJobToApp)
}

async function fetchOrgOverhead(pb: PocketBase, organizationId: string) {
  const orgEsc = escapeFilterValue(organizationId)
  const records = await pb.collection('overhead_expenses').getFullList<PbRecord>({
    filter: `organization_id = "${orgEsc}"`,
    sort: 'name',
  })
  return records.map(pbOverheadToApp)
}

async function fetchOrgBusinessExpenses(pb: PocketBase, organizationId: string) {
  const orgEsc = escapeFilterValue(organizationId)
  const records = await pb.collection('business_expenses').getFullList<PbRecord>({
    filter: `organization_id = "${orgEsc}"`,
    sort: '-date',
  })
  return records.map(pbBusinessExpenseToApp)
}

export async function fetchReportPdfData(
  pb: PocketBase,
  organizationId: string,
  range: DateRangeKey,
): Promise<{ report: PLReport; settings: AppSettings }> {
  const [jobs, overheadItems, businessItems, settings] = await Promise.all([
    fetchOrgJobs(pb, organizationId),
    fetchOrgOverhead(pb, organizationId),
    fetchOrgBusinessExpenses(pb, organizationId),
    loadOrgSettings(pb, organizationId),
  ])

  const { start, end } = rangeFor(range)
  const overhead = overheadAmountForRange(overheadItems, range)
  const business = businessExpensesTotalForDates(businessItems, start, end)
  const report = computePLReport(jobs, range, overhead, business)

  return { report, settings }
}
