'use client'

import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { ListRow } from '@/components/ui'
import type { SettingsIconTone } from '@/lib/settings-menu'

type ListRowIconTone = 'blue' | 'green' | 'amber' | 'purple'

function mapSettingsIconTone(tone: SettingsIconTone): ListRowIconTone {
  if (tone === 'green' || tone === 'amber' || tone === 'purple') return tone
  return 'blue'
}

interface SettingsMenuListRowProps {
  title: string
  subtitle: string
  Icon: PhosphorIcon
  tone: SettingsIconTone
  onClick: () => void
  trailing?: ReactNode
}

/** Settings hub row — icon, subtitle, optional trailing badge. */
export default function SettingsMenuListRow({
  title,
  subtitle,
  Icon,
  tone,
  onClick,
  trailing,
}: SettingsMenuListRowProps) {
  return (
    <ListRow
      icon={<Icon size={20} weight="duotone" aria-hidden="true" />}
      iconTone={mapSettingsIconTone(tone)}
      title={title}
      subtitle={subtitle}
      trailing={trailing}
      onClick={onClick}
    />
  )
}
