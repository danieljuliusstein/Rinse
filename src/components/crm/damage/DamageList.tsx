'use client'

import { Plus } from '@phosphor-icons/react'
import DamageListRow from '@/components/crm/damage/DamageListRow'
import type { DamageRecord } from '@/lib/types'

interface DamageListProps {
  damages: DamageRecord[]
  onAdd: () => void
  onOpen: (damageId: string) => void
}

export default function DamageList({ damages, onAdd, onOpen }: DamageListProps) {
  return (
    <>
      {damages.map((damage) => (
        <DamageListRow key={damage.id} damage={damage} onPress={() => onOpen(damage.id)} />
      ))}
      <button type="button" className="more-pill" onClick={onAdd}>
        <Plus size={14} weight="bold" aria-hidden="true" />
        Add damage documentation
      </button>
    </>
  )
}
