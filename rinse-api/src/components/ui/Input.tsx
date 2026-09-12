import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export default function Input({ className = '', error, ...props }: InputProps) {
  return (
    <div className="ui-input-wrap">
      <input className={`f-input auth-input${className ? ` ${className}` : ''}`} {...props} />
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  )
}
