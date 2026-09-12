'use client'

import { PillGroup } from '@/components/forms'
import type { EquipmentStatus } from '@/lib/types'

const STATUS_PILLS = [
  { value: 'active' as const, label: 'Active' },
  { value: 'retired' as const, label: 'Retired' },
]

interface Props {
  value: EquipmentStatus
  onChange: (status: EquipmentStatus) => void
}

export default function EquipmentStatusToggle({ value, onChange }: Props) {
  return <PillGroup label="Status" options={STATUS_PILLS} value={value} onChange={onChange} />
}
