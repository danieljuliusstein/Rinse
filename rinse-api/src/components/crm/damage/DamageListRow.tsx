'use client'

import { Image as ImageIcon } from '@phosphor-icons/react'
import { ListRow } from '@/components/ui'
import { formatDamageDate } from '@/lib/damage-docs'
import type { DamageRecord } from '@/lib/types'

interface DamageListRowProps {
  damage: DamageRecord
  onPress: () => void
}

export default function DamageListRow({ damage, onPress }: DamageListRowProps) {
  const thumb = damage.photo_url ? (
    <span className="damage-list-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={damage.photo_url} alt="" />
    </span>
  ) : (
    <ImageIcon size={20} weight="duotone" aria-hidden="true" />
  )

  return (
    <ListRow
      className="damage-list-row"
      icon={thumb}
      iconTone="amber"
      title={damage.area}
      subtitle={damage.note || undefined}
      trailing={
        <span className="damage-list-row__date">{formatDamageDate(damage.date)}</span>
      }
      onClick={onPress}
    />
  )
}
