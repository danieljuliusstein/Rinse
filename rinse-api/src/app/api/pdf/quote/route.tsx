import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QuotePdfDocument from '@/components/pdf/QuotePdfDocument'
import { resolveInvoiceLogoDataUri } from '@/lib/invoice-logo-server'
import { PdfDataError, fetchQuotePdfData } from '@/lib/server/pdf-data'
import { parseJsonBody } from '@/lib/server/parse-body'
import { requireUser } from '@/lib/server/route-guard'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'
import { pdfQuoteBodySchema } from '@/lib/validation/api-schemas'
import { deskCorsOptions, withDeskCors } from '@/lib/server/desk-cors'

export async function OPTIONS(request: Request) {
  return deskCorsOptions(request)
}

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return withDeskCors(auth, request)

  const premiumDenied = await requirePremiumSubscription(auth.pb, auth.organizationId)
  if (premiumDenied) return withDeskCors(premiumDenied, request)

  const parsed = await parseJsonBody(request, pdfQuoteBodySchema)
  if (parsed instanceof NextResponse) return withDeskCors(parsed, request)
  const { quoteId } = parsed.data

  try {
    const { quote, settings } = await fetchQuotePdfData(auth.pb, auth.organizationId, quoteId)
    const logoDataUri = await resolveInvoiceLogoDataUri(settings.logo_url)
    const buffer = await renderToBuffer(
      <QuotePdfDocument quote={quote} settings={settings} logoDataUri={logoDataUri} />
    )
    const filename = `${quote.quote_number}.pdf`.replace(/[^\w.-]/g, '_')

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
    console.error('[api/pdf/quote]', err)
    return withDeskCors(
      NextResponse.json(
        { error: err instanceof Error ? err.message : 'PDF generation failed' },
        { status: 500 },
      ),
      request,
    )
  }
}
