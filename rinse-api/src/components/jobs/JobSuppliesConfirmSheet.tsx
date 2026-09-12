'use client'

import { useMemo, useState } from 'react'
import { Warning } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import { SheetFooter } from '@/components/forms'
import JobSuppliesPicker, { totalSupplyUsageCost } from '@/components/jobs/JobSuppliesPicker'
import { fmtDetailed } from '@/lib/calculations'
import { resolveSuppliesUsed } from '@/lib/supplies-logic'
import type { Package, Supply, SupplyUsage } from '@/lib/types'

interface JobSuppliesConfirmSheetProps {
  supplies: Supply[]
  pkg: Package | undefined
  initialUsed?: SupplyUsage[]
  onConfirm: (used: SupplyUsage[]) => void
  onClose: () => void
}

export default function JobSuppliesConfirmSheet({
  supplies,
  pkg,
  initialUsed,
  onConfirm,
  onClose,
}: JobSuppliesConfirmSheetProps) {
  const [value, setValue] = useState<SupplyUsage[]>(() =>
    resolveSuppliesUsed({ supplies_used: initialUsed ?? [] }, pkg, initialUsed)
  )

  const lowWarnings = useMemo(() => {
    const warnings: string[] = []
    for (const usage of value) {
      const supply = supplies.find((s) => s.id === usage.supply_id)
      if (!supply) continue
      const threshold = supply.reorder_threshold
      if (threshold == null) continue
      const after = supply.quantity_on_hand - usage.quantity_used
      if (after < threshold) {
        warnings.push(`${supply.name}: ${after} ${supply.unit} left (reorder at ${threshold})`)
      }
    }
    return warnings
  }, [value, supplies])

  const totalCost = useMemo(() => totalSupplyUsageCost(supplies, value), [supplies, value])

  return (
    <BottomSheet
      variant="light"
      title="Log supplies used"
      subtitle="Confirm or adjust supplies for this job before saving"
      ariaLabel="Confirm supplies used"
      onClose={onClose}
      footer={
        <SheetFooter
          layout="stacked"
          saveLabel="Confirm & save"
          ready
          onSave={() => onConfirm(value)}
          onCancel={onClose}
        />
      }
    >
      <div className="premium-sheet__section">
        <JobSuppliesPicker supplies={supplies} value={value} onChange={setValue} />

        {lowWarnings.length > 0 ? (
          <div className="usage-projection-banner">
            <Warning className="usage-projection-banner__icon" size={16} weight="fill" />
            <p className="usage-projection-banner__text">{lowWarnings.join(' · ')}</p>
          </div>
        ) : null}

        {totalCost > 0 ? (
          <div className="usage-cost-row">
            <p className="usage-cost-row__label">Estimated supply cost</p>
            <p className="usage-cost-row__value">{fmtDetailed(totalCost)}</p>
          </div>
        ) : null}
      </div>
    </BottomSheet>
  )
}
