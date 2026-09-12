'use client'

import DamageList from '@/components/crm/damage/DamageList'
import AddDamageSheet from '@/components/crm/damage/AddDamageSheet'
import { EmptyState, SectionGroup } from '@/components/ui'
import type { DamageRecord } from '@/lib/types'

interface DamageSectionProps {
  damages: DamageRecord[]
  sheetOpen: boolean
  onOpenSheet: () => void
  onCloseSheet: () => void
  onPhotoSelected: (file: File) => void
  onOpenDamage: (damageId: string) => void
}

export default function DamageSection({
  damages,
  sheetOpen,
  onOpenSheet,
  onCloseSheet,
  onPhotoSelected,
  onOpenDamage,
}: DamageSectionProps) {
  return (
    <>
      {damages.length === 0 ? (
        <EmptyState
          illustration="damage"
          title="No damage documented"
          description="Add photos of scratches, dents, or existing wear before each job."
          actionLabel="Add damage documentation"
          onAction={onOpenSheet}
        />
      ) : (
        <SectionGroup title="Pre-existing damage" meta={String(damages.length)}>
          <DamageList damages={damages} onAdd={onOpenSheet} onOpen={onOpenDamage} />
        </SectionGroup>
      )}
      {sheetOpen ? (
        <AddDamageSheet onPhotoSelected={onPhotoSelected} onClose={onCloseSheet} />
      ) : null}
    </>
  )
}
