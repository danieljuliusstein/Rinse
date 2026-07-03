'use client'

import { useState } from 'react'

interface PillOption<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  label: string
  options: PillOption<T>[]
  value: T
  onChange: (value: T) => void
}

export default function PillGroup<T extends string>({ label, options, value, onChange }: Props<T>) {
  const [popValue, setPopValue] = useState<T | null>(null)

  const handleSelect = (next: T) => {
    onChange(next)
    setPopValue(next)
    window.setTimeout(() => setPopValue(null), 320)
  }

  return (
    <div className="form-pill-block">
      <p className="form-pill-block__label">{label}</p>
      <div className="form-pills" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={[
              'form-pill',
              value === opt.value ? 'form-pill--on' : '',
              popValue === opt.value ? 'form-pill--pop' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={value === opt.value}
            onClick={() => handleSelect(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
