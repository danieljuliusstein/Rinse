import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import ReportPdfDocument from '@/components/pdf/ReportPdfDocument'
import type { PLReport } from '@/lib/api/aggregates'
import type { DateRangeKey } from '@/lib/api/reports'
import { resolveInvoiceLogoDataUri } from '@/lib/invoice-logo-server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { requirePremiumSubscription } from '@/lib/server/subscription-guard'
import { plProgressPeriodLabel } from '@/lib/reports-metrics'

export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const premiumDenied = await requirePremiumSubscription(auth.pb, auth.organizationId)
  if (premiumDenied) return premiumDenied

  try {
    const body = await request.json()
    const report = body.report as PLReport | undefined
    const range = body.range as DateRangeKey | undefined
    const businessName = (body.businessName as string | undefined) ?? 'Detailing Report'
    const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : undefined

    if (!report || !range) {
      return NextResponse.json({ error: 'Missing report data' }, { status: 400 })
    }

    const periodLabel = plProgressPeriodLabel(range)
    const logoDataUri = await resolveInvoiceLogoDataUri(logoUrl)
    const buffer = await renderToBuffer(
      <ReportPdfDocument
        report={report}
        periodLabel={periodLabel}
        businessName={businessName}
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
    console.error('[api/pdf/report]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    )
  }
}
