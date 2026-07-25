# Receipt on-device OCR + checklist review

**Date:** 2026-07-24  
**Surface:** `apps/mobile` (worktree `mobile-wave5-crm`, branch `feat/wave5-crm`)  
**Status:** Approved (conversation)  
**References:** existing `ReceiptLineItemsEditor`, `receipt-parse.ts` (cloud `/api/receipts/parse`), `vehicle-ocr.ts` (optional `expo-mlkit-ocr`)

---

## Goal

Replace cloud receipt OCR with **on-device Vision/ML Kit** text recognition, **deterministic heuristics** for merchant / date / total / candidate lines, and a dedicated **checklist review** step before the expense form. Photo always attaches.

## Non-goals

- Cloud / OpenAI fallback when on-device OCR is unavailable  
- Changing PocketBase expense schema or save API  
- Pixel-perfect OCR bounding-box UI  
- Sharing this path with customer book/portal  
- Rebuilding the full expense form inside the review screen  

## Constraints

- React Native + Expo Router; operator light tokens (`#f2f2f7` / `#22c55e`)  
- Optional native OCR only via `requireOptionalNativeModule('ExpoMlkitOcr')` — same pattern as vehicle OCR; never hard-require  
- Shared types/schemas from `@rinse/core` (`ExpenseLine`)  
- Keep existing `receipt_ocr` premium gate on Scan hub entry  

---

## Decision log

| Decision | Choice |
|----------|--------|
| Unavailable OCR (web / missing module) | Attach photo + manual lines only — **no cloud fallback** |
| Architecture | Dedicated **review step** between capture and expense form |
| Review layout | **A — Checklist** (suggested fields on top; tap OCR rows to include) |
| Cloud `/api/receipts/parse` | Unused from this mobile flow |

---

## Architecture / flow

1. **Capture** — Same entry points as today: Scan hub / expenses sheet / `expenses/new?scan=1`. Photo always attaches.  
2. **On-device OCR** — Optional `expo-mlkit-ocr` (Vision iOS / ML Kit Android). No upload to `/api/receipts/parse`.  
3. **Review screen** (new) — Thumbnail + editable merchant / date / total + checklist of OCR lines. User toggles include, edits amounts/descriptions, can add/remove lines.  
4. **Confirm → expense form** — Prefill vendor/date/amount + confirmed `ExpenseLine[]` + receipt image; user finishes category/notes and saves.  
5. **Unavailable path** — Skip OCR; same review/expense UI with empty editable lines and a short “enter manually” message; photo kept.

All scan entry points go through the review step before final save.

```text
Capture → recognizeReceiptText? → parseReceiptHeuristics → Review (checklist)
  → Continue → expenses/new (prefilled) → save
```

---

## UI — Checklist review

Dedicated screen after capture (not buried inside today’s `ReceiptLineItemsEditor` scan+edit mashup):

1. **Header** — “Review receipt” + photo thumbnail  
2. **Suggested fields** (editable) — Merchant, Date, Total — from heuristics; user can override  
3. **OCR lines checklist** — checkbox + description + amount. Pre-check likely product lines; leave tax/total/subtotal unchecked. Tap toggles include; tap text/amount to edit  
4. **Add line** — manual row when OCR missed something  
5. **Continue** — one green CTA → existing expense form with photo + selected lines + fields prefilled  

---

## Heuristics / data

Shared module (mirrors vehicle OCR loader):

1. **`recognizeReceiptText(uri)`** → raw multiline text, or `null` if unavailable  
2. **`parseReceiptHeuristics(text)`** → draft for the checklist UI:

| Field | Rule |
|-------|------|
| Merchant | First strong non-noise line near top |
| Date | First `MM/DD/YYYY`, `YYYY-MM-DD`, or similar → `YYYY-MM-DD` |
| Total | Prefer TOTAL / AMOUNT DUE label; else largest money amount |
| Candidate lines | Lines with trailing money; **pre-check** product-like; **uncheck** TAX / SUBTOTAL / TOTAL / CHANGE / TIP |

Intermediate UI row:

```ts
{ text: string; amount?: number; included: boolean }
```

Continue maps `included` rows → `ExpenseLine[]` (`category` default `supplies`). Handoff keeps today’s `ReceiptParseResult`-shaped payload so the expense save path stays the same.

---

## Error handling / edges

| Case | Behavior |
|------|----------|
| Web / no native OCR module | Skip recognize; empty checklist + “Enter lines manually”; photo kept |
| OCR empty / garbage | Same as above; photo kept |
| Heuristics miss merchant/date/total | Leave fields blank; user fills |
| Heuristics miss line amounts | Show text with empty amount; user edits before Continue |
| Continue with zero included lines | Allowed — form opens with photo; amount from Total or manual |
| Cancel mid-OCR | Drop in-progress work; stay on prior screen |
| Premium | Existing `receipt_ocr` gate on Scan entry; after gate, on-device only |

---

## Testing

1. **Unit tests** on pure `parseReceiptHeuristics` with fixture receipt text (merchant/date/total + TAX/SUBTOTAL exclude vs product include). No native OCR in CI.  
2. **Manual smoke (device)** — capture → checklist → toggle → Continue → form has photo + fields + lines; web shows empty checklist + photo.  
3. **Typecheck** — `npm run typecheck` in the mobile worktree.

---

## Out of scope for v1 follow-ups

- Retire or gate server `/api/receipts/parse` for other clients  
- Multi-receipt batch scan  
- Category inference beyond default `supplies`  
