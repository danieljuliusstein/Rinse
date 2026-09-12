import type { ExpenseLine } from '../types'

export interface ReceiptParseResult {
  lines: ExpenseLine[]
  merchant?: string
  date?: string
  total?: number
}

const EXTRACT_PROMPT = `Extract receipt line items from this image. Return JSON only:
{
  "merchant": "store name or null",
  "date": "YYYY-MM-DD or null",
  "total": number or null,
  "lines": [{ "description": "string", "amount": number, "category": "supplies|fuel|equipment|other" }]
}
Use category "supplies" for detailing/chemical items when unsure. Amounts in USD dollars.`

export async function parseReceiptImage(base64: string, mimeType: string): Promise<ReceiptParseResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACT_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Vision API failed')
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const raw = data.choices?.[0]?.message?.content
  if (!raw) throw new Error('Empty OCR response')

  const parsed = JSON.parse(raw) as {
    merchant?: string
    date?: string
    total?: number
    lines?: { description?: string; amount?: number; category?: string }[]
  }

  const lines: ExpenseLine[] = (parsed.lines ?? [])
    .filter((l) => l.description && Number(l.amount) > 0)
    .map((l) => ({
      description: String(l.description),
      amount: Number(l.amount),
      category: normalizeCategory(l.category),
    }))

  return {
    lines: lines.length ? lines : [{ description: 'Receipt total', amount: Number(parsed.total) || 0, category: 'supplies' }],
    merchant: parsed.merchant,
    date: parsed.date,
    total: parsed.total,
  }
}

function normalizeCategory(raw?: string): ExpenseLine['category'] {
  if (raw === 'equipment') return 'equipment'
  if (raw === 'travel' || raw === 'fuel') return 'travel'
  if (raw === 'marketing') return 'marketing'
  if (raw === 'labor') return 'labor'
  if (raw === 'other') return 'other'
  return 'supplies'
}
