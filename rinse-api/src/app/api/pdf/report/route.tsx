import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import ReportPdfDocument from '@/components/pdf/ReportPdfDocument'
import { resolveInvoiceLogoDataUri } from '@/lib/invoice-logo-server'
import { plProgressPeriodLabel } from '@/lib/reports-metrics'
import { PdfDataError, fetchReportPdfData } from '@/lib/server/pdf-data'
import { parseJsonBody } from '@/lib/server/parse-body'
import { requireUser } from '@/lib/server/route-guard'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'
import { pdfReportBodySchema } from '@/lib/validation/api-schemas'

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const premiumDenied = await requirePremiumSubscription(auth.pb, auth.organizationId)
  if (premiumDenied) return premiumDenied

  const parsed = await parseJsonBody(request, pdfReportBodySchema)
  if (parsed instanceof NextResponse) return parsed
  const { range } = parsed.data

  try {
    const { report, settings } = await fetchReportPdfData(auth.pb, auth.organizationId, range)
    const periodLabel = plProgressPeriodLabel(range)
    const logoDataUri = await resolveInvoiceLogoDataUri(settings.logo_url)
    const buffer = await renderToBuffer(
      <ReportPdfDocument
        report={report}
        periodLabel={periodLabel}
        businessName={settings.business_name || 'Detailing Report'}
        logoDataUri={logoDataUri ?? undefined}
      />
    )

    const filename = `report-${range}-${new Date().toISOString().slice(0, 10)}.pdf`

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
    console.error('[api/pdf/report]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    )
  }
}
