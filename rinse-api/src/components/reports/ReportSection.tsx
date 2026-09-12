'use client'

import type { ReactNode } from 'react'

interface ReportSectionProps {
  label?: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export default function ReportSection({ label, subtitle, children, className }: ReportSectionProps) {
  return (
    <section className={`report-section${className ? ` ${className}` : ''}`}>
      {label ? <div className="report-section-label">{label}</div> : null}
      {subtitle ? <div className="report-section-subtitle">{subtitle}</div> : null}
      {children}
    </section>
  )
}
