import type { ExpenseLine } from '@rinse/core'
import type { ReceiptImageAsset } from './business-expenses-api'

export type ReceiptReviewDraft = {
  image: ReceiptImageAsset
  merchant?: string
  date?: string
  total?: number
  lines: ExpenseLine[]
  manualMessage?: string
}

let draft: ReceiptReviewDraft | null = null

export function setReceiptReviewDraft(next: ReceiptReviewDraft) {
  draft = next
}

export function peekReceiptReviewDraft(): ReceiptReviewDraft | null {
  return draft
}

/** Read and clear — expense form / sheet should call once on focus. */
export function consumeReceiptReviewDraft(): ReceiptReviewDraft | null {
  const current = draft
  draft = null
  return current
}
