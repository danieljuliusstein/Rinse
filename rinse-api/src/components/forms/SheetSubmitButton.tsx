'use client'

import type { MouseEvent } from 'react'

interface Props {
  label: string
  ready?: boolean
  done?: boolean
  disabled?: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}

function addRipple(e: MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const ripple = document.createElement('span')
  ripple.className = 'sheet-submit__ripple'
  const size = 60
  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`
  btn.appendChild(ripple)
  window.setTimeout(() => ripple.remove(), 600)
}

export default function SheetSubmitButton({ label, ready, done, disabled, onClick }: Props) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (ready && !done && !disabled) addRipple(e)
    onClick(e)
  }

  return (
    <button
      type="button"
      className={[
        'sheet-submit',
        ready ? 'sheet-submit--ready' : '',
        done ? 'sheet-submit--done' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      onClick={handleClick}
    >
      {label}
    </button>
  )
}
