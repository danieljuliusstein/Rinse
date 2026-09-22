import { NextResponse } from 'next/server'
import { ClientResponseError } from 'pocketbase'
import { renderToBuffer } from '@react-pdf/renderer'
import InvoicePdfDocument from '@/components/pdf/InvoicePdfDocument'
import { resolveInvoiceLogoDataUri } from '@/lib/invoice-logo-server'
import { PdfDataError, fetchInvoicePdfData } from '@/lib/server/pdf-data'
import { parseJsonBody } from '@/lib/server/parse-body'
import { requireUser } from '@/lib/server/route-guard'
import { pdfInvoiceBodySchema } from '@/lib/validation/api-schemas'
import { deskCorsOptions, withDeskCors } from '@/lib/server/desk-cors'

export async function OPTIONS(request: Request) {
  return deskCorsOptions(request)
}

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return withDeskCors(auth, request)


  const parsed = await parseJsonBody(request, pdfInvoiceBodySchema)
  if (parsed instanceof NextResponse) return withDeskCors(parsed, request)
  const { jobId, invoiceId, portalUrl } = parsed.data

  try {
    const { job, invoice, settings } = await fetchInvoicePdfData(
      auth.pb,
      auth.organizationId,
      jobId,
      invoiceId,
    )

    const logoDataUri = await resolveInvoiceLogoDataUri(settings.logo_url)
    const buffer = await renderToBuffer(
      <InvoicePdfDocument
        job={job}
        invoice={invoice}
        settings={settings}
        logoDataUri={logoDataUri}
        portalUrl={portalUrl}
      />
    )

    const filename = `${invoice.invoice_number}.pdf`.replace(/[^\w.-]/g, '_')

    return withDeskCors(
      new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      }),
      request,
    )
  } catch (err) {
    if (err instanceof PdfDataError) {
      return withDeskCors(
        NextResponse.json({ error: err.message }, { status: err.status }),
        request,
      )
    }
    if (err instanceof ClientResponseError && (err.status === 404 || err.status === 403)) {
      // A cross-org fetchInvoicePdfData read never reaches assertOrgRecord's
      // explicit 403 — the tenant-scoped PocketBase client's own list/view
      // rule already hides the record, so PocketBase itself returns 404
      // first. Pass that status through instead of defaulting to 500.
      return withDeskCors(
        NextResponse.json({ error: 'Not found' }, { status: err.status }),
        request,
      )
    }
    console.error('[api/pdf/invoice]', err)
    return withDeskCors(
      NextResponse.json(
        { error: err instanceof Error ? err.message : 'PDF generation failed' },
        { status: 500 },
      ),
      request,
    )
  }
}
