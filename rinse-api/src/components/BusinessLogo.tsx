'use client'

import { useState } from 'react'
import { hasCustomBusinessLogo, resolveBusinessLogoSrc } from '@/lib/business-logo'

interface BusinessLogoProps {
  logoUrl?: string | null
  size?: number
  className?: string
}

export default function BusinessLogo({ logoUrl, size = 64, className = '' }: BusinessLogoProps) {
  const [loadFailed, setLoadFailed] = useState(false)
  const src = resolveBusinessLogoSrc(logoUrl)
  const showPlaceholder = !src || loadFailed

  if (showPlaceholder) {
    return (
      <span
        className={`business-logo-wrap business-logo-wrap--placeholder ${className}`.trim()}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="business-logo-placeholder-label">Logo</span>
      </span>
    )
  }

  return (
    <span
      className={`business-logo-wrap ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="business-logo"
        onError={() => setLoadFailed(true)}
      />
    </span>
  )
}
