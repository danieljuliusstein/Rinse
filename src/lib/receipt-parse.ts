import * as FileSystem from 'expo-file-system/legacy'
import type { ExpenseLine } from '@rinse/core'
import { appApiJson } from './app-api'

export interface ReceiptParseResult {
  lines: ExpenseLine[]
  merchant?: string
  date?: string
  total?: number
}

export async function parseReceiptImage(uri: string, mimeType = 'image/jpeg'): Promise<ReceiptParseResult> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })

  const data = await appApiJson<ReceiptParseResult & { error?: string }>('/api/receipts/parse', {
    method: 'POST',
    body: JSON.stringify({ image: base64, mimeType }),
  })

  const lines = (data.lines ?? []).filter((line) => line.description && Number(line.amount) > 0)
  if (lines.length === 0) {
    throw new Error('No line items found on receipt')
  }

  return {
    lines,
    merchant: data.merchant,
    date: data.date,
    total: data.total,
  }
}

export function receiptLinesToNotes(lines: ExpenseLine[]): string {
  const rows = lines
    .filter((line) => line.description.trim())
    .map((line) => `${line.description.trim()} — $${Number(line.amount).toFixed(2)}`)
  return rows.length ? `Receipt lines:\n${rows.join('\n')}` : ''
}
