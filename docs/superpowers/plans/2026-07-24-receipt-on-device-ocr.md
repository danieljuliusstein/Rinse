# Receipt on-device OCR + checklist review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cloud receipt OCR with on-device Vision/ML Kit text + deterministic heuristics, and insert a checklist review screen before the expense form.

**Architecture:** Pure heuristics live in `@rinse/core` (unit-tested). Mobile wraps optional `expo-mlkit-ocr` like vehicle OCR, runs heuristics, and presents `app/expenses/receipt-review`. Continue writes an in-memory draft then opens `expenses/new`, which prefills vendor/date/amount/lines/photo. No `/api/receipts/parse` calls from this flow.

**Tech Stack:** Expo Router 57, React Native, `expo-mlkit-ocr` (optional native), `@rinse/core`, Vitest (core), existing `AppSheet` / form UI.

**Spec:** `docs/superpowers/specs/2026-07-24-receipt-on-device-ocr-design.md`

## Global Constraints

- React Native primitives + `StyleSheet`; operator light (`#f2f2f7` / `#22c55e`)
- Optional OCR only via `requireOptionalNativeModule('ExpoMlkitOcr')` — never hard-require / never import default export that redboxes
- No cloud OCR fallback (web / missing module → photo + manual lines)
- Keep `receipt_ocr` premium gate on Scan hub entry
- Do not change PocketBase expense schema or save API
- Commits only when the user asks
- Verify: `npx vitest run` in `packages/core` for heuristics; `npm run typecheck` in `apps/mobile-wave5-crm`

---

## File map

| File | Responsibility |
|------|----------------|
| `packages/core/src/receipt-heuristics.ts` | **Create** — `parseReceiptHeuristics`, money/date helpers, `ReceiptHeuristicLine` |
| `packages/core/src/receipt-heuristics.test.ts` | **Create** — fixture receipt text tests |
| `packages/core/src/index.ts` | Re-export heuristics |
| `apps/mobile-wave5-crm/src/lib/receipt-ocr.ts` | **Create** — `isOnDeviceReceiptOcrAvailable`, `recognizeReceiptText` |
| `apps/mobile-wave5-crm/src/lib/receipt-review-draft.ts` | **Create** — in-memory handoff between review → expense form / sheet |
| `apps/mobile-wave5-crm/src/lib/receipt-parse.ts` | Rewrite — on-device path + `includedLinesToExpenseLines`; drop cloud `appApiJson` |
| `apps/mobile-wave5-crm/src/components/expenses/ReceiptReviewChecklist.tsx` | **Create** — checklist UI (fields + rows + Continue) |
| `apps/mobile-wave5-crm/app/expenses/receipt-review.tsx` | **Create** — capture → OCR → checklist screen |
| `apps/mobile-wave5-crm/app/_layout.tsx` | Register `expenses/receipt-review` stack screen |
| `apps/mobile-wave5-crm/app/scan.tsx` | Route receipt to `/expenses/receipt-review` |
| `apps/mobile-wave5-crm/app/expenses/new.tsx` | Consume draft; remove inline auto-scan editor path |
| `apps/mobile-wave5-crm/src/components/expenses/BusinessExpenseSheet.tsx` | Add-receipt → review route; consume draft on focus |
| `apps/mobile-wave5-crm/src/components/expenses/ReceiptLineItemsEditor.tsx` | Strip cloud OCR; photo-only attach for non-review paths (or delete if unused) |

---

### Task 1: Core receipt heuristics (TDD)

**Files:**
- Create: `packages/core/src/receipt-heuristics.ts`
- Create: `packages/core/src/receipt-heuristics.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: nothing (pure string parsing)
- Produces:
  - `export type ReceiptHeuristicLine = { text: string; amount?: number; included: boolean }`
  - `export type ReceiptHeuristicsResult = { merchant?: string; date?: string; total?: number; lines: ReceiptHeuristicLine[] }`
  - `export function parseReceiptHeuristics(text: string): ReceiptHeuristicsResult`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { parseReceiptHeuristics } from './receipt-heuristics'

const SAMPLE = `
AUTOZONE #4821
123 MAIN ST
07/12/2026
CERAMIC SPRAY          24.99
MICROFIBER 3PK         12.99
SUBTOTAL               37.98
TAX                     3.84
TOTAL                  47.82
`

describe('parseReceiptHeuristics', () => {
  it('extracts merchant, date, total and toggles product vs summary lines', () => {
    const result = parseReceiptHeuristics(SAMPLE)
    expect(result.merchant).toMatch(/AUTOZONE/i)
    expect(result.date).toBe('2026-07-12')
    expect(result.total).toBe(47.82)

    const ceramic = result.lines.find((l) => /CERAMIC/i.test(l.text))
    const tax = result.lines.find((l) => /^TAX\b/i.test(l.text))
    const total = result.lines.find((l) => /^TOTAL\b/i.test(l.text))
    const sub = result.lines.find((l) => /SUBTOTAL/i.test(l.text))

    expect(ceramic?.included).toBe(true)
    expect(ceramic?.amount).toBe(24.99)
    expect(tax?.included).toBe(false)
    expect(total?.included).toBe(false)
    expect(sub?.included).toBe(false)
  })

  it('returns empty lines for blank text', () => {
    expect(parseReceiptHeuristics('').lines).toEqual([])
    expect(parseReceiptHeuristics('   ').merchant).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/danny/Projects/Detailing/packages/core && npx vitest run src/receipt-heuristics.test.ts`  
Expected: FAIL (module not found / `parseReceiptHeuristics` undefined)

- [ ] **Step 3: Write minimal implementation**

Create `packages/core/src/receipt-heuristics.ts`:

```ts
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
const EXCLUDE_RE = /\b(TAX|SUBTOTAL|TOTAL|AMOUNT\s*DUE|CHANGE|TIP|GRATUITY|BALANCE|CASH|CREDIT|DEBIT|VISA|MASTERCARD|AMEX)\b/i
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
  if (/^\d[\d\s\-\(\)]{6,}$/.test(line)) return true // phone-ish
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
    if (parseMoney(line) != null && MONEY_RE.test(line) && line.replace(MONEY_RE, '').trim().length < 2) continue
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
```

Export from `packages/core/src/index.ts`:

```ts
export * from './receipt-heuristics'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/danny/Projects/Detailing/packages/core && npx vitest run src/receipt-heuristics.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit** (only if user asks)

```bash
git add packages/core/src/receipt-heuristics.ts packages/core/src/receipt-heuristics.test.ts packages/core/src/index.ts
git commit -m "feat(core): add receipt OCR heuristics parser"
```

---

### Task 2: On-device receipt OCR wrapper

**Files:**
- Create: `apps/mobile-wave5-crm/src/lib/receipt-ocr.ts`

**Interfaces:**
- Consumes: `expo-modules-core` `requireOptionalNativeModule` (same as `vehicle-ocr.ts`)
- Produces:
  - `export function isOnDeviceReceiptOcrAvailable(): boolean`
  - `export async function recognizeReceiptText(uri: string): Promise<string | null>`  
    Returns `null` when web / module missing / unsupported / empty text / read failure (never throws for “unavailable”; may throw only on unexpected native crash — prefer catch → `null`)

- [ ] **Step 1: Implement**

Mirror `src/lib/vehicle-ocr.ts` loader:

```ts
import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo-modules-core'

type MlkitOcrNative = {
  isSupported: () => boolean
  recognizeText: (uri: string) => Promise<{ text?: string }>
}

function loadMlkitOcr(): MlkitOcrNative | null {
  if (Platform.OS === 'web') return null
  try {
    return requireOptionalNativeModule<MlkitOcrNative>('ExpoMlkitOcr') ?? null
  } catch {
    return null
  }
}

export function isOnDeviceReceiptOcrAvailable(): boolean {
  if (Platform.OS === 'web') return false
  const mod = loadMlkitOcr()
  if (!mod) return false
  try {
    return mod.isSupported()
  } catch {
    return false
  }
}

/** Raw multiline OCR text, or null when unavailable / empty. Never calls the API. */
export async function recognizeReceiptText(uri: string): Promise<string | null> {
  if (!uri || uri.startsWith('blob:') || uri.startsWith('data:')) return null
  if (!isOnDeviceReceiptOcrAvailable()) return null
  const mod = loadMlkitOcr()
  if (!mod) return null
  try {
    const recognition = await mod.recognizeText(uri)
    const raw = recognition.text?.trim() || ''
    return raw.length ? raw : null
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Typecheck touch**

Run: `cd /Users/danny/Projects/Detailing/apps/mobile-wave5-crm && npx tsc --noEmit --pretty false 2>&1 | head -40`  
Expected: no errors in `receipt-ocr.ts` (ignore unrelated pre-existing errors if any)

- [ ] **Step 3: Commit** (only if user asks)

---

### Task 3: Draft store + parse handoff helpers

**Files:**
- Create: `apps/mobile-wave5-crm/src/lib/receipt-review-draft.ts`
- Modify: `apps/mobile-wave5-crm/src/lib/receipt-parse.ts`

**Interfaces:**
- Consumes: `ReceiptHeuristicsResult` / `ReceiptHeuristicLine` from `@rinse/core`; `ExpenseLine` from `@rinse/core`; `ReceiptImageAsset` from `business-expenses-api`
- Produces:
  - `ReceiptParseResult` (keep existing shape: `{ lines, merchant?, date?, total? }`)
  - `includedLinesToExpenseLines(lines: ReceiptHeuristicLine[]): ExpenseLine[]`
  - `setReceiptReviewDraft(draft)`, `consumeReceiptReviewDraft()`, `peekReceiptReviewDraft()`
  - `parseReceiptImage(uri, mimeType?)` rewritten to on-device only (used if any leftover callers)

Draft type:

```ts
export type ReceiptReviewDraft = {
  image: ReceiptImageAsset
  merchant?: string
  date?: string
  total?: number
  lines: ExpenseLine[]
  manualMessage?: string // e.g. "Enter lines manually"
}
```

- [ ] **Step 1: Implement draft module**

```ts
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
```

- [ ] **Step 2: Rewrite `receipt-parse.ts`**

Replace cloud upload with:

```ts
import type { ExpenseLine } from '@rinse/core'
import type { ReceiptHeuristicLine } from '@rinse/core'
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
```

Remove `FileSystem` + `appApiJson` imports from this file.

- [ ] **Step 3: Sanity check heuristics → lines**

Run:

```bash
cd /Users/danny/Projects/Detailing/apps/mobile-wave5-crm && npx tsx -e "
import { parseReceiptHeuristics } from '@rinse/core';
const r = parseReceiptHeuristics('AUTOZONE\\n07/12/2026\\nCERAMIC 24.99\\nTAX 3.84\\nTOTAL 47.82');
console.log(JSON.stringify(r, null, 2));
"
```

Expected: merchant AutoZone-ish, date `2026-07-12`, total `47.82`, ceramic `included: true`, tax/total `included: false`

- [ ] **Step 4: Commit** (only if user asks)

---

### Task 4: Checklist UI component

**Files:**
- Create: `apps/mobile-wave5-crm/src/components/expenses/ReceiptReviewChecklist.tsx`

**Interfaces:**
- Consumes: `ReceiptHeuristicLine`, theme tokens, `FormField`, `AppText`, `PrimaryButton`
- Produces: controlled checklist props:

```ts
export function ReceiptReviewChecklist(props: {
  previewUri: string
  merchant: string
  date: string
  total: string
  lines: ReceiptHeuristicLine[]
  manualMessage?: string | null
  onMerchantChange: (v: string) => void
  onDateChange: (v: string) => void
  onTotalChange: (v: string) => void
  onLinesChange: (lines: ReceiptHeuristicLine[]) => void
  onContinue: () => void
  continueDisabled?: boolean
})
```

- [ ] **Step 1: Implement layout (Checklist — option A)**

Structure:
1. Section label `REVIEW RECEIPT`
2. `Image` thumbnail (`previewUri`, height ~120)
3. Editable Merchant / Date / Total (`FormField` / `AffixField` for total)
4. Optional `manualMessage` caption (`role="alert"` if present)
5. Section `OCR LINES` — each row: `Pressable` checkbox (green when `included`) + description field + amount field
6. “Add line” pressable appends `{ text: '', amount: undefined, included: true }`
7. Footer `PrimaryButton` label `Continue` → `onContinue`

Use `colors.green` / `colors.greenText`, `radii`, `spacing` from theme. No `className` / web DOM.

Toggle include:

```ts
const toggle = (index: number) => {
  onLinesChange(lines.map((line, i) => (i === index ? { ...line, included: !line.included } : line)))
}
```

- [ ] **Step 2: Typecheck component**

Run: `npm run typecheck` in mobile worktree (or `tsc` filtered)

- [ ] **Step 3: Commit** (only if user asks)

---

### Task 5: Receipt review screen + stack registration

**Files:**
- Create: `apps/mobile-wave5-crm/app/expenses/receipt-review.tsx`
- Modify: `apps/mobile-wave5-crm/app/_layout.tsx` — add  
  `<Stack.Screen name="expenses/receipt-review" options={sheetScreenOptions} />`

**Interfaces:**
- Consumes: `launchCameraSafe` / `launchLibrarySafe`, `recognizeReceiptText`, `parseReceiptHeuristics`, `includedLinesToExpenseLines`, `setReceiptReviewDraft`, `ReceiptReviewChecklist`
- Produces: route `/expenses/receipt-review`  
  Query: optional `returnTo=sheet` | default expense form

- [ ] **Step 1: Screen behavior**

```tsx
// Pseudocode flow inside AppSheet title="Review receipt"
// 1. On mount: if Platform.OS === 'web', open library after short delay; else show Take photo / Upload until image chosen
// 2. On image chosen:
//    setImage(asset); setBusy(true)
//    text = await recognizeReceiptText(uri)
//    if (!text) { setManualMessage('Enter lines manually'); setHeuristics empty fields/lines }
//    else { apply parseReceiptHeuristics(text) into merchant/date/total/lines state }
//    setBusy(false)
// 3. Continue:
//    setReceiptReviewDraft({
//      image,
//      merchant: merchant.trim() || undefined,
//      date: date.trim() || undefined,
//      total: Number(total) || undefined,
//      lines: includedLinesToExpenseLines(lines),
//      manualMessage,
//    })
//    if (returnTo === 'sheet') router.back()
//    else router.replace('/expenses/new?fromReview=1')
```

Cancel mid-OCR: if user leaves screen (`useEffect` cleanup or cancel), ignore late OCR results via a `cancelled` / generation counter ref.

Zero included lines: still allow Continue (draft `lines: []`, total from field).

- [ ] **Step 2: Manual smoke (simulator)**

Open `/expenses/receipt-review` — confirm sheet renders Take photo / Upload.

- [ ] **Step 3: Commit** (only if user asks)

---

### Task 6: Wire entry points

**Files:**
- Modify: `apps/mobile-wave5-crm/app/scan.tsx`
- Modify: `apps/mobile-wave5-crm/app/expenses/new.tsx`
- Modify: `apps/mobile-wave5-crm/src/components/expenses/BusinessExpenseSheet.tsx`

- [ ] **Step 1: Scan hub**

In `openReceipt`:

```ts
runGated(() => router.push('/expenses/receipt-review'))
```

Keep premium gate.

- [ ] **Step 2: `expenses/new`**

- Read `fromReview` param (and legacy `scan` → redirect):

```ts
const params = useLocalSearchParams<{ scan?: string; fromReview?: string }>()

useEffect(() => {
  if (params.scan === '1' || params.scan === 'true') {
    router.replace('/expenses/receipt-review')
  }
}, [params.scan])

useEffect(() => {
  const draft = consumeReceiptReviewDraft()
  if (!draft) return
  setReceiptImage(draft.image)
  if (draft.merchant) {
    setVendor(draft.merchant)
    setName(draft.merchant)
  }
  if (draft.date) setDate(draft.date)
  if (draft.total != null && draft.total > 0) setAmount(String(draft.total))
  if (draft.lines.length) setReceiptLines(draft.lines)
}, [])
```

- Remove `ReceiptLineItemsEditor` autoStart block for scan. Show a small receipt preview + editable line list (reuse simplified editor **without** OCR) or inline line fields when `receiptImage` is set.

- [ ] **Step 3: BusinessExpenseSheet**

When user enables “+ Add receipt” (create mode):

```ts
runGated(() => router.push('/expenses/receipt-review?returnTo=sheet'))
```

On sheet focus / `useEffect` when `visible`:

```ts
const draft = consumeReceiptReviewDraft()
if (draft) {
  setReceiptMode(true)
  setReceiptImage(draft.image)
  // apply merchant/date/total/lines like expenses/new
}
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/danny/Projects/Detailing/apps/mobile-wave5-crm && npm run typecheck`

- [ ] **Step 5: Commit** (only if user asks)

---

### Task 7: Slim / retire cloud scan from `ReceiptLineItemsEditor`

**Files:**
- Modify: `apps/mobile-wave5-crm/src/components/expenses/ReceiptLineItemsEditor.tsx`

- [ ] **Step 1: Remove `parseReceiptImage` / scanning state**

Editor becomes: optional photo attach (camera/library) + editable lines only. On photo pick, set preview + `onReceiptImageChange` — **do not** call OCR (review screen owns OCR). Update hint copy to “Attach a receipt photo” (no “we’ll draft the lines”).

If after Task 6 no callers need attach-in-editor, delete the component and inline a tiny preview+lines block in `expenses/new` / sheet — prefer delete if unused.

- [ ] **Step 2: Grep for dead imports**

Run: `rg "parseReceiptImage|ReceiptLineItemsEditor|/api/receipts/parse" apps/mobile-wave5-crm`  
Expected: no cloud parse usage; editor only if still referenced.

- [ ] **Step 3: Typecheck + commit** (commit only if user asks)

---

### Task 8: Verification checklist

- [ ] **Step 1: Unit tests**

```bash
cd /Users/danny/Projects/Detailing/packages/core && npx vitest run src/receipt-heuristics.test.ts
```

Expected: PASS

- [ ] **Step 2: Typecheck**

```bash
cd /Users/danny/Projects/Detailing/apps/mobile-wave5-crm && npm run typecheck
```

Expected: exit 0

- [ ] **Step 3: Manual smoke (device build with `expo-mlkit-ocr` linked)**

1. Scan hub → Receipt (gated) → review sheet  
2. Capture receipt → checklist prefilled (product checked, TAX/TOTAL unchecked)  
3. Toggle a line → Continue → expense form has photo + merchant/date/total/lines  
4. Web: upload photo → “Enter lines manually” + empty checklist → Continue still attaches photo  

- [ ] **Step 4: Commit all remaining work** (only if user asks)

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| On-device Vision/ML Kit | Task 2 |
| Heuristics merchant/date/total/lines | Task 1 |
| Checklist review layout A | Tasks 4–5 |
| Continue → expense prefill | Tasks 3, 5–6 |
| No cloud fallback | Tasks 2–3, 7 |
| Unavailable → manual + photo | Task 5 |
| Premium gate on Scan | Task 6 |
| Unit tests heuristics | Task 1, 8 |
| Typecheck | Tasks 2, 6, 8 |
| Entry points scan / new?scan / sheet | Task 6 |

No placeholders remaining; interfaces named consistently (`parseReceiptHeuristics`, `recognizeReceiptText`, `ReceiptReviewDraft`, `includedLinesToExpenseLines`).
