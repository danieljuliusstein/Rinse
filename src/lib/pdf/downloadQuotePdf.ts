import type { AppSettings } from '@/lib/settings'
import type { QuoteWithRelations } from '@/lib/types'
import { handleApiResponsePremiumGate, PREMIUM_REQUIRED_MESSAGE } from '@/lib/premium-api'
import { getAuthFetchHeaders } from '@/lib/pb-auth'

export async function downloadQuotePdf(quote: QuoteWithRelations, settings: AppSettings): Promise<void> {
  const res = await fetch('/api/pdf/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthFetchHeaders() },
    body: JSON.stringify({ quote, settings }),
  })
  if (!res.ok) {
    if (await handleApiResponsePremiumGate(res)) {
      throw new Error(PREMIUM_REQUIRED_MESSAGE)
    }
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'PDF export failed')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${quote.quote_number}.pdf`.replace(/[^\w.-]/g, '_')
  a.click()
  URL.revokeObjectURL(url)
}
