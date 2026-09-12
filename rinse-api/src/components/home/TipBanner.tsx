'use client'

import { Lightbulb } from '@phosphor-icons/react'
import type { InventoryAlertData } from '@/lib/home-dashboard'

interface TipBannerProps {
  text: string
}

export default function TipBanner({ text }: TipBannerProps) {
  return (
    <div className="tip-banner">
      <Lightbulb className="tip-banner__icon" size={16} weight="duotone" aria-hidden />
      <p className="tip-banner__text">{text}</p>
    </div>
  )
}

export function TipBannerOptional({ text }: { text: string | null }) {
  if (!text) return null
  return <TipBanner text={text} />
}
