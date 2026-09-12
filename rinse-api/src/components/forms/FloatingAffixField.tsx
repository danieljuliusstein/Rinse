'use client'

import { Check } from '@phosphor-icons/react'
import { useCallback, useState, type InputHTMLAttributes } from 'react'
import {
  formatCurrencyEditing,
  parseCurrencyTyping,
  sanitizeWholeDollarInput,
  wholeDollarsToNumber,
} from '@/lib/currency-input'
import FieldError from './FieldError'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'placeholder'> {
  id: string
  label: string
  prefix?: string
  filled?: boolean
  currency?: boolean
  error?: string
  /** Numeric value when `currency` is true. */
  value?: string | number | readonly string[]
  onValueChange?: (value: number) => void
}

export default function FloatingAffixField({
  id,
  label,
  prefix = '$',
  filled,
  currency = false,
  error,
  value,
  onChange,
  onBlur,
  onFocus,
  onValueChange,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false)
  const errorId = error ? `${id}-error` : undefined

  const numericValue =
    currency && typeof value === 'number'
      ? value
      : currency
        ? parseCurrencyTyping(String(value ?? ''))
        : 0

  const displayValue = currency
    ? focused
      ? numericValue > 0
        ? String(Math.round(numericValue))
        : ''
      : formatCurrencyEditing(numericValue, false)
    : String(value ?? '')

  const hasValue =
    filled ?? (currency ? numericValue > 0 : Boolean(String(value ?? '').trim()))

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (currency) {
        const digits = sanitizeWholeDollarInput(e.target.value)
        const next = wholeDollarsToNumber(digits)
        onValueChange?.(next)
        return
      }
      onChange?.(e)
    },
    [currency, onChange, onValueChange],
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      if (currency && numericValue > 0) {
        onValueChange?.(Math.round(numericValue * 100) / 100)
      }
      onBlur?.(e)
    },
    [currency, numericValue, onBlur, onValueChange],
  )

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true)
      onFocus?.(e)
    },
    [onFocus],
  )

  return (
    <div className={`f-field f-field--affix${hasValue ? ' f-field--filled' : ''}${error ? ' f-field--error' : ''}`}>
      <div className="f-affix-wrap">
        <span className="f-affix-pre" aria-hidden="true">
          {prefix}
        </span>
        <input
          id={id}
          className={`f-input f-input--affix${hasValue ? ' hv' : ''}`}
          {...inputProps}
          type={currency ? 'text' : inputProps.type ?? 'text'}
          inputMode={currency ? 'numeric' : inputProps.inputMode}
          value={currency ? displayValue : value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
        <label className="f-label" htmlFor={id}>
          {label}
        </label>
      </div>
      <Check className="f-check" size={16} weight="bold" aria-hidden="true" />
      <FieldError id={errorId} message={error} />
    </div>
  )
}
