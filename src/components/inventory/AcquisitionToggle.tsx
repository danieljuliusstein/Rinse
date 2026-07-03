'use client'

import { PillGroup } from '@/components/forms'

export type AcquisitionMode = 'bought_new' | 'already_owned'

const ACQUISITION_PILLS = [
  { value: 'bought_new' as const, label: 'Log expense' },
  { value: 'already_owned' as const, label: 'Inventory only' },
]

interface Props {
  value: AcquisitionMode
  onChange: (mode: AcquisitionMode) => void
}

export default function AcquisitionToggle({ value, onChange }: Props) {
  const includeExpense = value === 'bought_new'

  return (
    <div className="inv-acquisition">
      <PillGroup
        label="Include in expenses?"
        options={ACQUISITION_PILLS}
        value={value}
        onChange={onChange}
      />
      <p className="inv-acquisition__hint">
        {includeExpense
          ? 'Amount paid will be logged to business expenses when you save'
          : 'Adds to inventory without creating an expense'}
      </p>
    </div>
  )
}
