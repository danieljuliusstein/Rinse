import type { ExpenseLine, ReceiptHeuristicLine } from '@rinse/core'
import { parseReceiptHeuristics } from '@rinse/core'
import { recognizeReceiptText } from './receipt-ocr'

export interface ReceiptParseResult {
  lines: ExpenseLine[]
  merchant?: string
  date?: string
  total?: number
}

export function includedLinesToExpenseLines(rows: ReceiptHeuristicLine[]): ExpenseLine[] {
  return rows
    .filter((r) => r.included)
    .map((r) => ({
      category: 'supplies' as const,
      description: r.text.trim(),
      amount: Number(r.amount) || 0,
    }))
    .filter((r) => r.description.length > 0)
}

export async function parseReceiptImage(uri: string, _mimeType = 'image/jpeg'): Promise<ReceiptParseResult> {
  const text = await recognizeReceiptText(uri)
  if (!text) {
    return { lines: [] }
  }
  const heuristics = parseReceiptHeuristics(text)
  return {
    lines: includedLinesToExpenseLines(heuristics.lines),
    merchant: heuristics.merchant,
    date: heuristics.date,
    total: heuristics.total,
  }
}

export function receiptLinesToNotes(lines: ExpenseLine[]): string {
  const rows = lines
    .filter((line) => line.description.trim())
    .map((line) => `${line.description.trim()} — $${Number(line.amount).toFixed(2)}`)
  return rows.length ? `Receipt lines:\n${rows.join('\n')}` : ''
}
