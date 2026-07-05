'use client'

interface FieldErrorProps {
  id?: string
  message?: string
}

export default function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p id={id} className="f-field-error form-field-hint form-field-hint--error" role="alert" aria-live="assertive">
      {message}
    </p>
  )
}
