export type ReceiptHeuristicLine = {
  text: string
  amount?: number
  included: boolean
}

export type ReceiptHeuristicsResult = {
  merchant?: string
  date?: string
  total?: number
  lines: ReceiptHeuristicLine[]
}

const MONEY_RE = /(?:\$\s*)?(\d{1,6}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})\s*$/
const DATE_RE =
  /\b((?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:20)?\d{2}|(?:20\d{2})[\/\-](?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01]))\b/
const EXCLUDE_RE =
  /\b(TAX|SUBTOTAL|TOTAL|AMOUNT\s*DUE|CHANGE|TIP|GRATUITY|BALANCE|CASH|CREDIT|DEBIT|VISA|MASTERCARD|AMEX)\b/i
const TOTAL_LABEL_RE = /\b(TOTAL|AMOUNT\s*DUE)\b/i

function parseMoney(raw: string): number | undefined {
  const m = raw.match(MONEY_RE)
  if (!m) return undefined
  const n = Number(m[1].replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

function normalizeDate(raw: string): string | undefined {
  const m = raw.match(DATE_RE)
  if (!m) return undefined
  const token = m[1]
  if (/^\d{4}/.test(token)) {
    const [y, mo, d] = token.split(/[\/\-]/).map((p) => p.padStart(2, '0'))
    return `${y}-${mo}-${d}`
  }
  const parts = token.split(/[\/\-]/)
  const mo = parts[0].padStart(2, '0')
  const d = parts[1].padStart(2, '0')
  let y = parts[2]
  if (y.length === 2) y = `20${y}`
  return `${y}-${mo}-${d}`
}

function looksLikeNoise(line: string): boolean {
  if (line.length < 3) return true
  if (/^\d[\d\s\-\(\)]{6,}$/.test(line)) return true
  if (/^\d+\s/.test(line) && /ST|AVE|RD|BLVD|SUITE|#/i.test(line)) return true
  return false
}

export function parseReceiptHeuristics(text: string): ReceiptHeuristicsResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return { lines: [] }

  let merchant: string | undefined
  for (const line of lines.slice(0, 6)) {
    if (looksLikeNoise(line)) continue
    if (DATE_RE.test(line)) continue
    if (parseMoney(line) != null && MONEY_RE.test(line) && line.replace(MONEY_RE, '').trim().length < 2) {
      continue
    }
    merchant = line.replace(/\s+/g, ' ').slice(0, 80)
    break
  }

  let date: string | undefined
  for (const line of lines) {
    date = normalizeDate(line)
    if (date) break
  }

  let total: number | undefined
  for (const line of lines) {
    if (!TOTAL_LABEL_RE.test(line)) continue
    const amount = parseMoney(line)
    if (amount != null) {
      total = amount
      break
    }
  }
  if (total == null) {
    let max = 0
    for (const line of lines) {
      const amount = parseMoney(line)
      if (amount != null && amount > max) max = amount
    }
    if (max > 0) total = max
  }

  const heuristicLines: ReceiptHeuristicLine[] = []
  for (const line of lines) {
    const amount = parseMoney(line)
    if (amount == null) continue
    const label = line.replace(MONEY_RE, '').replace(/\$/g, '').trim() || line
    const excluded = EXCLUDE_RE.test(label) || EXCLUDE_RE.test(line)
    heuristicLines.push({
      text: label.slice(0, 120),
      amount,
      included: !excluded,
    })
  }

  return { merchant, date, total, lines: heuristicLines }
}
