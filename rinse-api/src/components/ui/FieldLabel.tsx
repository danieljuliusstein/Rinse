import type { LabelHTMLAttributes, ReactNode } from 'react'

export interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  optional?: boolean
  children: ReactNode
}

export default function FieldLabel({ optional, className = '', children, ...props }: FieldLabelProps) {
  return (
    <label className={['book-label', className].filter(Boolean).join(' ')} {...props}>
      {children}
      {optional ? <span className="book-optional">optional</span> : null}
    </label>
  )
}
