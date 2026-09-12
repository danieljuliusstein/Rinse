'use client'

import type { InputHTMLAttributes } from 'react'
import FieldError from './FieldError'

interface SetupRowFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  id: string
  label: string
  optional?: boolean
  error?: string
}

export default function SetupRowField({ id, label, optional, error, ...inputProps }: SetupRowFieldProps) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={`setup-row${error ? ' setup-row--error' : ''}`}>
      <label className="setup-row__label" htmlFor={id}>
        {label}
        {optional ? <span className="setup-row__optional">Optional</span> : null}
      </label>
      <input
        id={id}
        className="setup-row__input"
        {...inputProps}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}
