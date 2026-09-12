'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QrCodeProps {
  value: string
  label?: string
  size?: number
  /** Client lane uses `--cl-*` tokens */
  variant?: 'operator' | 'client'
  className?: string
}

export default function QrCode({
  value,
  label = 'Scan to pay',
  size = 128,
  variant = 'operator',
  className,
}: QrCodeProps) {
  if (!value.trim()) return null

  const fg = variant === 'client' ? 'var(--cl-text)' : 'var(--text-primary)'
  const bg = variant === 'client' ? 'var(--cl-surface)' : 'var(--bg-surface)'

  return (
    <div className={`qr-code${className ? ` ${className}` : ''}`} data-variant={variant}>
      {label ? <p className="qr-code__label">{label}</p> : null}
      <QRCodeSVG value={value} size={size} fgColor={fg} bgColor={bg} level="M" includeMargin />
    </div>
  )
}
