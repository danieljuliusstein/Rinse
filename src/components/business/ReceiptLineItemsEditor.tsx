'use client'

import { useRef, useState } from 'react'
import { Camera, Plus, Trash } from '@phosphor-icons/react'
import { FloatingAffixField, FloatingField } from '@/components/forms'
import { Button } from '@/components/ui'
import { useProGate } from '@/hooks/useProGate'
import { getAuthFetchHeaders } from '@/lib/pb-auth'
import type { ExpenseLine } from '@/lib/types'

interface ReceiptLineItemsEditorProps {
  lines: ExpenseLine[]
  onChange: (lines: ExpenseLine[]) => void
  onTotalChange: (total: number) => void
}

const EMPTY_LINE: ExpenseLine = { category: 'supplies', description: '', amount: 0 }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ReceiptLineItemsEditor({
  lines,
  onChange,
  onTotalChange,
}: ReceiptLineItemsEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const { runProGated } = useProGate('receipt_ocr')

  const updateLine = (index: number, patch: Partial<ExpenseLine>) => {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line))
    onChange(next)
    onTotalChange(next.reduce((s, l) => s + (Number(l.amount) || 0), 0))
  }

  const addLine = () => onChange([...lines, { ...EMPTY_LINE }])

  const removeLine = (index: number) => {
    const next = lines.filter((_, i) => i !== index)
    onChange(next.length ? next : [{ ...EMPTY_LINE }])
    onTotalChange(next.reduce((s, l) => s + (Number(l.amount) || 0), 0))
  }

  const parseReceipt = async (file: File) => {
    setScanning(true)
    setScanError(null)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/receipts/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthFetchHeaders() },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
      })
      const data = (await res.json()) as {
        lines?: ExpenseLine[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Scan failed')
      const parsed = data.lines ?? []
      if (parsed.length === 0) throw new Error('No line items found')
      onChange(parsed)
      onTotalChange(parsed.reduce((s, l) => s + (Number(l.amount) || 0), 0))
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Scan failed — enter lines manually')
      if (lines.length === 1 && !lines[0].description) {
        updateLine(0, { description: 'Receipt item' })
      }
    } finally {
      setScanning(false)
    }
  }

  const handlePhoto = (file: File) => {
    const url = URL.createObjectURL(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(url)
    runProGated(() => {
      void parseReceipt(file)
    })
  }

  return (
    <div className="receipt-lines">
      <div className="receipt-lines__scan">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handlePhoto(file)
            e.target.value = ''
          }}
        />
        <Button type="button" variant="secondary" disabled={scanning} onClick={() => fileRef.current?.click()}>
          <Camera size={18} aria-hidden="true" /> {scanning ? 'Scanning…' : 'Scan receipt'}
        </Button>
        <p className="form-field-hint">Scan receipt — we&apos;ll draft line items to confirm.</p>
        {scanError ? <p className="form-field-hint form-field-hint--warn">{scanError}</p> : null}
      </div>

      {previewUrl ? (
        <img src={previewUrl} alt="Receipt preview" className="receipt-lines__preview" />
      ) : null}

      {lines.map((line, index) => (
        <div key={index} className="receipt-lines__row">
          <FloatingField
            id={`receipt-desc-${index}`}
            label="Description"
            filled={line.description.trim().length > 0}
          >
            <input
              id={`receipt-desc-${index}`}
              className={`f-input${line.description.trim() ? ' hv' : ''}`}
              value={line.description}
              onChange={(e) => updateLine(index, { description: e.target.value })}
              placeholder=" "
            />
          </FloatingField>
          <FloatingAffixField
            id={`receipt-amt-${index}`}
            label="Amount"
            filled={line.amount > 0}
            type="number"
            inputMode="decimal"
            value={line.amount || ''}
            onChange={(e) =>
              updateLine(index, { amount: e.target.value === '' ? 0 : Number(e.target.value) })
            }
          />
          {lines.length > 1 ? (
            <button
              type="button"
              className="receipt-lines__remove"
              aria-label="Remove line"
              onClick={() => removeLine(index)}
            >
              <Trash size={18} />
            </button>
          ) : null}
        </div>
      ))}

      <Button type="button" variant="ghost" onClick={addLine}>
        <Plus size={16} /> Add line
      </Button>
    </div>
  )
}
