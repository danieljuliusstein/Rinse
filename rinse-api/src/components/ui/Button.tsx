import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'secondary' | 'danger'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  fullWidth = true,
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    VARIANT_CLASS[variant],
    fullWidth ? '' : 'ui-btn--auto',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? 'Loading…' : children}
    </button>
  )
}
