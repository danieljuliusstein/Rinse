'use client'

import { Check } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import FieldError from './FieldError'

interface Props {
  id: string
  label: string
  filled?: boolean
  textarea?: boolean
  optional?: boolean
  showCheck?: boolean
  error?: string
  children: ReactNode
}

export default function FloatingField({
  id,
  label,
  filled,
  textarea,
  optional,
  showCheck = true,
  error,
  children,
}: Props) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div
      className={`f-field${textarea ? ' f-field--textarea' : ''}${filled ? ' f-field--filled' : ''}${showCheck ? '' : ' f-field--no-check'}${error ? ' f-field--error' : ''}`}
    >
      {children}
      <label className="f-label" htmlFor={id}>
        {label}
        {optional ? <span className="f-label-optional"> (optional)</span> : null}
      </label>
      {showCheck ? <Check className="f-check" size={16} weight="bold" aria-hidden="true" /> : null}
      <FieldError id={errorId} message={error} />
    </div>
  )
}
