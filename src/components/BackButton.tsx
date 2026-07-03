'use client'

import { CaretLeft } from '@phosphor-icons/react'

export default function BackButton({
  onClick,
  label = 'Go back',
  showLabel = true,
}: {
  onClick: () => void
  label?: string
  showLabel?: boolean
}) {
  return (
    <button type="button" className="back-button" onClick={onClick} aria-label={label}>
      <CaretLeft size={20} weight="bold" aria-hidden="true" />
      {showLabel ? <span className="back-button__label">Back</span> : null}
    </button>
  )
}
