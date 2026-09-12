import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  pressable?: boolean
  children: ReactNode
}

export default function Card({ pressable = false, className = '', children, ...props }: CardProps) {
  const base = pressable ? 'card card-pressable' : 'card'
  return (
    <div className={`${base}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  )
}
