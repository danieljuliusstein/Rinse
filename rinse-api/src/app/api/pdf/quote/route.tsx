import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QuotePdfDocument from '@/components/pdf/QuotePdfDocument'
import { resolveInvoiceLogoDataUri } from '@/lib/invoice-logo-server'
import { PdfDataError, fetchQuotePdfData } from '@/lib/server/pdf-data'
import { parseJsonBody } from '@/lib/server/parse-body'
import { requireUser } from '@/lib/server/route-guard'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'
import { pdfQuoteBodySchema } from '@/lib/validation/api-schemas'

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const premiumDenied = await requirePremiumSubscription(auth.pb, auth.organizationId)
  if (premiumDenied) return premiumDenied

  const parsed = await parseJsonBody(request, pdfQuoteBodySchema)
  if (parsed instanceof NextResponse) return parsed
  const { quoteId } = parsed.data

  try {
    const { quote, settings } = await fetchQuotePdfData(auth.pb, auth.organizationId, quoteId)
    const logoDataUri = await resolveInvoiceLogoDataUri(settings.logo_url)
    const buffer = await renderToBuffer(
      <QuotePdfDocument quote={quote} settings={settings} logoDataUri={logoDataUri} />
    )
    const filename = `${quote.quote_number}.pdf`.replace(/[^\w.-]/g, '_')

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    if (err instanceof PdfDataError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[api/pdf/quote]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    )
  }
}
