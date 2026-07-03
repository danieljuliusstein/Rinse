'use client'

interface SetupMoneyRowProps {
  id: string
  label: string
  value: number | ''
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  min?: number
  step?: number
}

export default function SetupMoneyRow({
  id,
  label,
  value,
  onChange,
  min = 0,
  step = 1,
}: SetupMoneyRowProps) {
  return (
    <div className="setup-row">
      <label className="setup-row__label" htmlFor={id}>
        {label}
      </label>
      <div className="setup-row__money">
        <span className="setup-row__money-prefix" aria-hidden="true">
          $
        </span>
        <input
          id={id}
          type="number"
          className="setup-row__input setup-row__input--money"
          min={min}
          step={step}
          value={value}
          onChange={onChange}
          inputMode="decimal"
        />
      </div>
    </div>
  )
}
