'use client'

import type { InputHTMLAttributes } from 'react'

interface SetupStackFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  id: string
  label: string
  optional?: boolean
}

export default function SetupStackField({ id, label, optional, ...inputProps }: SetupStackFieldProps) {
  return (
    <div className="setup-stack-field">
      <label className="setup-stack-field__label" htmlFor={id}>
        {label}
        {optional ? ' (optional)' : ''}
      </label>
      <input id={id} className="setup-stack-field__input" {...inputProps} />
    </div>
  )
}
