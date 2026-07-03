'use client'

import type { InputHTMLAttributes } from 'react'

interface SetupRowFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  id: string
  label: string
  optional?: boolean
}

export default function SetupRowField({ id, label, optional, ...inputProps }: SetupRowFieldProps) {
  return (
    <div className="setup-row">
      <label className="setup-row__label" htmlFor={id}>
        {label}
        {optional ? <span className="setup-row__optional">Optional</span> : null}
      </label>
      <input id={id} className="setup-row__input" {...inputProps} />
    </div>
  )
}
