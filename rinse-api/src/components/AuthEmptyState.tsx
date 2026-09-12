'use client'

import Link from 'next/link'
import { SignIn } from '@phosphor-icons/react'

export interface AuthEmptyStateProps {
  icon?: React.ReactNode
  title: string
  subtitle: string
  primaryCta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
}

export default function AuthEmptyState({
  icon,
  title,
  subtitle,
  primaryCta = { label: 'Sign in', href: '/auth' },
  secondaryCta = { label: 'Create account', href: '/auth?mode=signup' },
}: AuthEmptyStateProps) {
  return (
    <div className="auth-empty-state">
      <div className="auth-empty-state__icon" aria-hidden="true">
        {icon ?? <SignIn size={28} weight="duotone" />}
      </div>
      <p className="auth-empty-state__title">{title}</p>
      <p className="auth-empty-state__subtitle">{subtitle}</p>
      <div className="auth-empty-state__actions">
        <Link href={primaryCta.href} className="auth-empty-state__cta auth-empty-state__cta--primary">
          {primaryCta.label}
        </Link>
        {secondaryCta ? (
          <Link href={secondaryCta.href} className="auth-empty-state__cta auth-empty-state__cta--secondary">
            {secondaryCta.label}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
