import type { DateRangeKey } from '@/lib/api/reports'
import { triggerDownload } from '@/lib/pdf/triggerDownload'
import { handleApiResponsePremiumGate, PREMIUM_REQUIRED_MESSAGE } from '@/lib/premium-api'
import { getAuthFetchHeaders } from '@/lib/pb-auth'

export async function downloadReportPdf(
  _report: unknown,
  range: DateRangeKey,
  _businessName?: string,
  _logoUrl?: string | null
): Promise<void> {
  const res = await fetch('/api/pdf/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthFetchHeaders() },
    body: JSON.stringify({ range }),
  })

  if (!res.ok) {
    if (await handleApiResponsePremiumGate(res)) {
      throw new Error(PREMIUM_REQUIRED_MESSAGE)
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'PDF export failed')
  }

  const blob = await res.blob()
  triggerDownload(blob, `report-${range}.pdf`)
}
