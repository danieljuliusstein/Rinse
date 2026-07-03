'use client'

import { VaulSheet } from '@/components/ui'

export interface CustomDateRange {
  start: string
  end: string
}

interface DateRangeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: CustomDateRange
  onChange: (value: CustomDateRange) => void
  onApply: () => void
}

export default function DateRangeSheet({
  open,
  onOpenChange,
  value,
  onChange,
  onApply,
}: DateRangeSheetProps) {
  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Custom range">
      <div className="date-range-sheet">
        <label className="date-range-sheet__field">
          <span>Start date</span>
          <input
            type="date"
            className="input"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
          />
        </label>
        <label className="date-range-sheet__field">
          <span>End date</span>
          <input
            type="date"
            className="input"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="btn-primary date-range-sheet__apply"
          onClick={() => {
            onApply()
            onOpenChange(false)
          }}
        >
          Apply range
        </button>
      </div>
    </VaulSheet>
  )
}
