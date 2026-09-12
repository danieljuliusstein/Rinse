import { z } from 'zod'
import { requiredEmailField, requiredString } from './fields'

export const portalScopeSchema = z.enum(['job', 'photos', 'invoice', 'quote', 'full'])

export const portalCreateBodySchema = z.object({
  clientId: requiredString('clientId required'),
  scope: portalScopeSchema,
  jobId: z.string().min(1).optional(),
  quoteId: z.string().min(1).optional(),
})

export type PortalCreateBody = z.infer<typeof portalCreateBodySchema>

export const portalSendBodySchema = z.object({
  to: requiredEmailField,
  clientName: z.string().optional(),
  businessName: requiredString('businessName required'),
  portalUrl: requiredString('portalUrl required'),
  subject: z.string().optional(),
  message: z.string().optional(),
  organizationId: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
})

export type PortalSendBody = z.infer<typeof portalSendBodySchema>

export const backupOrgQuerySchema = z.object({
  organizationId: requiredString('organizationId query param required'),
})

export type BackupOrgQuery = z.infer<typeof backupOrgQuerySchema>

export const pdfInvoiceBodySchema = z.object({
  jobId: requiredString('jobId required'),
  invoiceId: requiredString('invoiceId required'),
  portalUrl: z.string().min(1).optional(),
})

export type PdfInvoiceBody = z.infer<typeof pdfInvoiceBodySchema>

export const pdfQuoteBodySchema = z.object({
  quoteId: requiredString('quoteId required'),
})

export type PdfQuoteBody = z.infer<typeof pdfQuoteBodySchema>

export const pdfReportRangeSchema = z.enum([
  'this_week',
  'this_month',
  'last_month',
  'this_year',
  'lifetime',
])

export const pdfReportBodySchema = z.object({
  range: pdfReportRangeSchema,
})

export type PdfReportBody = z.infer<typeof pdfReportBodySchema>

export const receiptParseBodySchema = z.object({
  image: requiredString('image required'),
  mimeType: z.string().min(1).optional(),
})

export type ReceiptParseBody = z.infer<typeof receiptParseBodySchema>
