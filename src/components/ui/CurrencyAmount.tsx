'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { AnimateNumber } from 'motion-number'
import { fmt, fmtDetailed, fmtLineItem, isLoss } from '@/lib/calculations'

/**
 * Financial display variants — color psychology:
 * - revenue: green (money in)
 * - expense: red (money out, always shown as positive magnitude)
 * - profit: green when positive, red with leading minus when negative
 * - balance: neutral silver for outstanding / warning balances
 * - neutral: primary text, signed when negative
 */
export type CurrencyVariant = 'revenue' | 'expense' | 'profit' | 'balance' | 'neutral'

/** macro = whole dollars on dashboards; line-item = cents only when needed; detailed = invoice totals */
export type CurrencyPrecision = 'macro' | 'line-item' | 'detailed'

export interface CurrencyAmountProps {
  value: number
  variant?: CurrencyVariant
  precision?: CurrencyPrecision
  className?: string
  /** Expenses are displayed as positive magnitudes with expense styling */
  unsigned?: boolean
  /** Roll on value change after mount (default true). Set false to always snap. */
  animate?: boolean
}

function formatAmount(value: number, precision: CurrencyPrecision, unsigned: boolean): string {
  if (unsigned) {
    return fmt(Math.abs(value), { decimals: precision === 'detailed' ? 2 : 0 })
  }
  switch (precision) {
    case 'line-item':
      return fmtLineItem(value)
    case 'detailed':
      return fmtDetailed(value, value < 0)
    case 'macro':
    default:
      return fmt(value)
  }
}

function fractionDigits(value: number, precision: CurrencyPrecision): { min: number; max: number } {
  switch (precision) {
    case 'detailed':
      return { min: 2, max: 2 }
    case 'line-item': {
      const hasCents = Math.round(Math.abs(value) * 100) % 100 !== 0
      const d = hasCents ? 2 : 0
      return { min: d, max: d }
    }
    case 'macro':
    default:
      return { min: 0, max: 0 }
  }
}

function currencyClass(variant: CurrencyVariant, value: number, unsigned: boolean): string {
  const displayValue = unsigned ? Math.abs(value) : value
  switch (variant) {
    case 'revenue':
      return 'currency--revenue'
    case 'expense':
      return 'currency--expense'
    case 'profit':
      return isLoss(displayValue) ? 'currency--loss' : 'currency--revenue'
    case 'balance':
      return displayValue > 0 ? 'currency--balance' : 'currency--neutral'
    case 'neutral':
    default:
      return isLoss(displayValue) ? 'currency--loss' : 'currency--neutral'
  }
}

function animatedValue(value: number, unsigned: boolean): number {
  return unsigned ? Math.abs(value) : value
}

export default function CurrencyAmount({
  value,
  variant = 'neutral',
  precision = 'macro',
  className = '',
  unsigned = false,
  animate = true,
}: CurrencyAmountProps) {
  const reducedMotion = useReducedMotion()
  const mountedRef = useRef(false)
  const prevValueRef = useRef(value)

  const valueChanged = mountedRef.current && prevValueRef.current !== value

  useEffect(() => {
    mountedRef.current = true
    prevValueRef.current = value
  }, [value])

  const classes = ['currency-amount', currencyClass(variant, value, unsigned), className]
    .filter(Boolean)
    .join(' ')

  const shouldRoll = animate && !reducedMotion && valueChanged
  const digits = fractionDigits(value, precision)
  const numeric = animatedValue(value, unsigned)

  if (!shouldRoll) {
    return (
      <span className={classes}>
        {formatAmount(value, precision, unsigned)}
      </span>
    )
  }

  return (
    <span className={classes}>
      <AnimateNumber
        locales="en-US"
        format={{
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: digits.min,
          maximumFractionDigits: digits.max,
        }}
        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
      >
        {numeric}
      </AnimateNumber>
    </span>
  )
}
